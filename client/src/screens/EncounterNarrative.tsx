import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEncounterAdvance } from "@/components/useEncounterAdvance";
import type { ProjectionChips } from "@/components/Chart";
import { usePlayerChart } from "@/components/PlayerChartLayout";
import { NarrativeGuide, type NarrativeGuidePhase } from "@/components/NarrativeGuide";
import { PLANET_PRIMARY, VALENCE_COLOR } from "@/svg/palette";
import { PLANETS } from "@/game/data";
import { KandinskyComposition } from "@/components/KandinskyComposition";
import { unlockedPlanets } from "@/game/unlocks";
import { availableSelections, buildNarrativeContext, joyPresent, previewOption, resolveNarrative, requiresPlanet, type Selection } from "@/game/narrative";
import { describeOptionParts } from "@/copy/narrative";
import { newlyCombusted } from "@/game/combust";
import { isOver } from "@/game/run";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { HOUSES } from "@/data/houses";
import { getScenario } from "@/data/narrative-scenarios";
import { playCombust, playStrike, playUISound, setTheme } from "@/audio/engine";
import { playFocusSound, playHoverSound } from "@/audio/interaction";
import type {
  NarrativeEncounter,
  PlanetName,
  Polarity,
  Prince,
  Run,
} from "@/game/types";

const ROMAN = ["i", "ii", "iii", "iv", "v"];
const EFFECT_COLORS = {
  ...VALENCE_COLOR,
  Light: "color-mix(in srgb, var(--gold) 55%, var(--bone))",
};

const HOUSE_NAMES = [
  "First House", "Second House", "Third House", "Fourth House",
  "Fifth House", "Sixth House", "Seventh House", "Eighth House",
  "Ninth House", "Tenth House", "Eleventh House", "Twelfth House",
];

interface NarrativeScreenProps {
  run: Run;
  prince: Prince;
  encounter: NarrativeEncounter;
  onCommit: (nextRun: Run) => void;
  devUnlockAll?: boolean;
  /** Clear `run.encounter` and return to the map. */
  onClearEncounter: () => void;
}

export function EncounterNarrativeScreen(props: NarrativeScreenProps) {
  const { run, prince, encounter, onCommit, onClearEncounter, devUnlockAll = false } = props;
  const { setActive } = useActivePlanet();

  const house = HOUSES[encounter.house - 1]!;
  const scenario = useMemo(
    () => getScenario(encounter.scenarioId),
    [encounter.scenarioId],
  );
  const rulerPlanet: PlanetName = house.ruler;
  const joyPlanet: PlanetName | null = house.joy;
  const playerUnlocked = useMemo(
    () => unlockedPlanets(prince.numEncounters, devUnlockAll),
    [prince.numEncounters, devUnlockAll],
  );

  useEffect(() => {
    setActive(rulerPlanet);
  }, [rulerPlanet, setActive]);

  // The house ruler carries the score and the planetary artwork.
  useEffect(() => {
    setTheme(rulerPlanet, "narrative");
  }, [rulerPlanet]);

  const ctx = useMemo(
    () =>
      buildNarrativeContext({
        prince,
        run,
        joyPlanet,
        rulerPlanet: house.ruler,
        unlocked: playerUnlocked,
      }),
    [prince, run, joyPlanet, house.ruler, playerUnlocked],
  );

  const resolved = encounter.resolved;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);
  const [focusedOptionId, setFocusedOptionId] = useState<string | null>(null);
  const [chartHovered, setChartHovered] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetName | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetName | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guidePhase, setGuidePhase] = useState<NarrativeGuidePhase>("scene");
  const [flash, setFlash] = useState<{
    epoch: number;
    impact: Map<PlanetName, Polarity>;
    combusting: Set<PlanetName>;
    light: number;
  } | null>(null);
  const committedRef = useRef(false);
  const options = useMemo(() => scenario.options.filter((o) => !o.visibleIf || o.visibleIf(ctx)), [scenario, ctx]);
  const rows = useMemo(() => options.map((option) => {
    const assignments = availableSelections(run, ctx, option);
    const preview = previewOption(run, ctx, option);
    return {
      option, assignments,
      aside: describeOptionParts(ctx, option),
      reason: !assignments.length ? (preview.ok || run.light >= (option.cost ?? 0) ? "No eligible planets can carry this choice." : preview.reason) : null,
    };
  }), [options, run, ctx]);
  const [frozenRows, setFrozenRows] = useState<typeof rows | null>(null);
  const shownRows = resolved ? frozenRows ?? rows : rows;
  const selectedRow = rows.find((row) => row.option.id === selectedOptionId);
  const selectedOption = selectedRow?.option;
  const targeting = !!selectedOption && requiresPlanet(selectedOption);
  const previewOptionId = hoveredOptionId ?? (chartHovered ? null : focusedOptionId) ?? selectedOptionId;
  const indicatedOption = rows.find((row) => row.option.id === previewOptionId)?.option;
  const inspectedPlanet = targeting ? hoveredPlanet : selectedPlanet ?? hoveredPlanet;
  const preview = indicatedOption ? previewOption(run, ctx, indicatedOption, inspectedPlanet ? { chosen: inspectedPlanet } : {}) : null;
  const eligiblePlanets = new Set(targeting
    ? selectedRow!.assignments.flatMap((s) => s.chosen ? [s.chosen] : [])
    : playerUnlocked);
  const targetEffect = indicatedOption?.result.effects.find((e) => "target" in e && e.target === "chosen");
  const verb: Polarity = targetEffect?.kind === "affliction" && targetEffect.delta > 0 ? "Affliction" : "Testimony";
  const choosePlanet = (planet: PlanetName) => {
    if (resolved || committedRef.current || !eligiblePlanets.has(planet)) return;
    if (targeting) {
      handleOption(selectedOption.id, { chosen: planet });
      return;
    }
    playUISound(selectedPlanet === planet ? "dismiss" : "select");
    setSelectedPlanet((p) => p === planet ? null : planet);
    setHoveredPlanet(null);
  };
  const resetChoice = useCallback(() => {
    if (guideOpen) return;
    if (selectedOptionId || selectedPlanet) playUISound("dismiss");
    setSelectedOptionId(null);
    setSelectedPlanet(null);
    setHoveredPlanet(null);
    setHoveredOptionId(null);
    setFocusedOptionId(null);
  }, [guideOpen, selectedOptionId, selectedPlanet]);
  useEffect(() => {
    if (resolved) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") resetChoice();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resolved, resetChoice]);
  const projection: ProjectionChips = { deltas: {} };
  if (!resolved && preview?.ok) {
    for (const p of playerUnlocked) {
      const delta = preview.success.state[p].affliction - run.state[p].affliction;
      if (delta) projection.deltas[p] = { delta: Math.abs(delta), polarity: delta > 0 ? "Affliction" : "Testimony" };
    }
  }

  const handleOption = (optionId: string, selection: Selection) => {
    if (resolved || committedRef.current || guideOpen) return;
    const nextRun = resolveNarrative(run, prince, scenario, optionId, selection, devUnlockAll);
    if (!nextRun) return;
    committedRef.current = true;
    playUISound("commit");
    setSelectedOptionId(optionId);
    setFrozenRows(rows);

    // Dramatize the resolution on the chart: heal/harm valence bloom per planet,
    // a candle-out ripple for any combust, and a Light pulse (SCREENS.md §3.5).
    const impact = new Map<PlanetName, Polarity>();
    const combusting = new Set<PlanetName>(newlyCombusted(prince.chart, run.state, nextRun.state));
    for (const p of PLANETS) {
      const before = run.state[p];
      const after = nextRun.state[p];
      if (after.affliction < before.affliction) impact.set(p, "Testimony");
      else if (after.affliction > before.affliction) impact.set(p, "Affliction");
    }
    setFlash({
      epoch: 1,
      impact,
      combusting,
      light: nextRun.light - run.light,
    });
    // Each planet the outcome touches rings its degree in the house ruler's
    // mode (MUSIC.md, "The strike grid") — relief lands, harm hangs — so an
    // outcome that touches several sounds as a chord. Combustion adds a
    // breath to the planet's note, as in combat.
    for (const [p, polarity] of impact) {
      if (combusting.has(p)) continue;
      playStrike(house.ruler, p, polarity === "Affliction" ? "inverts" : "flows");
    }
    for (const p of combusting) {
      playCombust();
      playStrike(house.ruler, p, "landing");
    }

    onCommit(nextRun);
  };

  const planetDelta = inspectedPlanet && preview?.ok
    ? preview.success.state[inspectedPlanet].affliction - run.state[inspectedPlanet].affliction : 0;
  const planetEffect = !resolved && preview?.ok && inspectedPlanet && (targetEffect || planetDelta)
    ? { verb: planetDelta > 0 ? "Affliction" as const : "Testimony" as const, value: Math.abs(planetDelta) }
    : undefined;

  // `over` is derived (STATE.md): the run ended if every fielded planet combust.
  const runEnded = isOver(run, prince.chart, prince.numEncounters);

  const advance = useEncounterAdvance(
    resolved, onClearEncounter, runEnded ? 2800 : flash?.combusting.size ? 2400 : 1800,
  );

  const chartRef = usePlayerChart({
    props: {
      chart: prince.chart,
      state: run.state,
      unlockedPlanets: playerUnlocked,
      activePlanet: !targeting && joyPresent(ctx) ? joyPlanet : null,
      selectedPlanet,
      hoveredPlanet: selectedPlanet ? null : hoveredPlanet,
      onPlanetHover: resolved || selectedPlanet ? undefined : (planet) => {
        setHoveredPlanet(planet);
        if (planet) {
          setHoveredOptionId(null);
          setChartHovered(true);
        }
      },
      onPlanetClick: resolved ? undefined : choosePlanet,
      interactionPlanets: eligiblePlanets,
      inviteInteraction: !resolved && targeting && !selectedPlanet,
      incoming: !resolved && targetEffect ? {
        verb,
        amount: targetEffect.kind === "affliction" ? Math.abs(targetEffect.delta) : undefined,
      } : null,
      projection,
      statsPanelPlanet: resolved ? null : inspectedPlanet,
      statsPanelEffect: planetEffect,
      statsPanelReserveActions: targeting,
      side: "self",
      showColorField: true,
      passive: resolved,
      impactPlanets: flash?.impact,
      combustingPlanets: flash?.combusting,
      animationEpoch: flash?.epoch,
    },
    onBackgroundClick: resolved ? advance : resetChoice,
    onMouseEnter: () => setChartHovered(true),
    onMouseLeave: () => setChartHovered(false),
    className: resolved ? "is-resolved" : "",
  });

  return (
    <>
      {/* A resolved scene carries itself onward within seconds — nothing left
          to study, so the guide comes down with the choices. */}
      {!resolved && (
        <NarrativeGuide
          open={guideOpen}
          phase={guidePhase}
          house={house}
          asideIndex={shownRows.length ? 1 : null}
          onOpen={() => { setGuidePhase("scene"); setGuideOpen(true); }}
          onClose={() => setGuideOpen(false)}
          onPhaseChange={setGuidePhase}
        />
      )}
      <div className="narrative-column anim-surface-in">
        <div className="narrative-body">
          <div className="narrative-heading">
            <div className="narrative-composition">
              <KandinskyComposition planet={rulerPlanet} />
            </div>
            <div className="narrative-house" data-guide="narrative-house">
              {HOUSE_NAMES[house.num - 1]}
              <span className="narrative-house-gloss">{house.gloss}</span>
            </div>
          </div>
          <p>{resolved ? (encounter.resolutionText ?? "It is finished.") : scenario.text}</p>
        </div>

        <div className={`narrative-options ${resolved ? "is-resolved" : ""} ${targeting ? "is-targeting" : ""}`} data-guide="narrative-options" style={{ "--vc": PLANET_PRIMARY[rulerPlanet] } as CSSProperties}>
          {shownRows.map(({ option: o, aside, reason, assignments }, i) => {
            const isSelected = selectedOptionId === o.id;
            const commit = () => {
              if (!assignments.length || committedRef.current) return;
              if (!requiresPlanet(o)) {
                handleOption(o.id, {});
                return;
              }
              if (!isSelected) {
                playUISound("select");
                setSelectedOptionId(o.id);
                setSelectedPlanet(null);
                setHoveredPlanet(null);
                if (window.matchMedia("(max-width: 899px)").matches) {
                  chartRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
                }
              }
            };
            return (
              <div key={o.id} className="narrative-option">
                <button
                  className={`option ${isSelected ? "is-selected" : ""} ${!resolved && previewOptionId === o.id ? "is-preview" : ""}`}
                  data-guide={`option-${i + 1}`}
                  onClick={resolved ? advance : (e) => { e.stopPropagation(); commit(); }}
                  onPointerEnter={(event) => { playHoverSound(event); setHoveredOptionId(o.id); }}
                  onPointerLeave={() => setHoveredOptionId(null)}
                  onFocus={(event) => {
                    playFocusSound(event);
                    setHoveredOptionId(null);
                    setChartHovered(false);
                    setFocusedOptionId(o.id);
                  }}
                  onBlur={() => setFocusedOptionId(null)}
                  onKeyDown={(event) => {
                    if (event.repeat && (event.key === "Enter" || event.key === " ")) event.preventDefault();
                  }}
                  aria-pressed={requiresPlanet(o) ? isSelected : undefined}
                  disabled={!resolved && !assignments.length}
                  type="button"
                >
                  <span className="option-index">{ROMAN[i] ?? `${i + 1}`}.</span>
                  <span className="option-text">
                    {o.text}
                    <span className="option-aside" data-guide={`option-aside-${i + 1}`}>
                      {aside.map((part, index) => part.kind
                        ? <span key={index} style={{ color: EFFECT_COLORS[part.kind] }}>{part.text}</span>
                        : part.text)}
                    </span>
                    {!resolved && reason && <span className="option-reason">{reason}</span>}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="narrative-light" data-guide="narrative-light">
          <span className="eyebrow">LIGHT</span>
          <span
            key={flash?.light ? flash.epoch : "l"}
            className={`narrative-light-v ${flash?.light ? "anim-light-pop" : ""}`}
            style={
              flash?.light
                ? ({ "--flash-color": flash.light > 0 ? "var(--testimony)" : "var(--affliction)" } as CSSProperties)
                : undefined
            }
          >
            {Math.round(run.light)}
          </span>
        </div>
      </div>
    </>
  );
}
