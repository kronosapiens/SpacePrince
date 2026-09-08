import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useEncounterAdvance } from "@/components/useEncounterAdvance";
import { Chart, type ProjectionChips } from "@/components/Chart";
import type { PlanetStatsActions } from "@/components/PlanetStatsPanel";
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
import { getFragmentById, pickFragment, fragmentTitle } from "@/data/chorus";
import { playCombust, playStrike, setTheme } from "@/audio/engine";
import { mulberry32 } from "@/game/rng";
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

const HOUSE_ROMAN = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
];

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
  const ariaPlanet: PlanetName = house.ruler;
  const joyPlanet: PlanetName | null = house.joy;
  const playerUnlocked = useMemo(
    () => unlockedPlanets(prince.numEncounters, devUnlockAll),
    [prince.numEncounters, devUnlockAll],
  );

  useEffect(() => {
    setActive(ariaPlanet);
  }, [ariaPlanet, setActive]);

  // The score: narrative sits close to the ruler's theme bed — the aria's
  // planet carries the room (MUSIC.md: theme by planet, variant by surface).
  useEffect(() => {
    setTheme(ariaPlanet, "narrative");
  }, [ariaPlanet]);

  const fragment = useMemo(() => {
    const fixed = getFragmentById(encounter.fragmentId);
    if (fixed) return fixed;
    const rng = mulberry32(encounter.house * 1000 + run.seed);
    return pickFragment({
      planet: ariaPlanet,
      mood: scenario.fragmentMood,
      exclude: run.seenFragmentIds,
      rng,
    });
  }, [encounter.fragmentId, encounter.house, run.seed, run.seenFragmentIds, ariaPlanet, scenario.fragmentMood]);

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
  const chartRef = useRef<HTMLDivElement>(null);
  const inspectedPlanet = selectedPlanet ?? hoveredPlanet;
  const selection = useMemo<Selection>(() => inspectedPlanet ? { chosen: inspectedPlanet } : {}, [inspectedPlanet]);

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
  const preview = selectedOption ? previewOption(run, ctx, selectedOption, selection) : null;
  const eligiblePlanets = new Set(targeting
    ? selectedRow!.assignments.flatMap((s) => s.chosen ? [s.chosen] : [])
    : playerUnlocked);
  const targetEffect = selectedOption?.result.effects.find((e) => "target" in e && e.target === "chosen");
  const verb: Polarity = targetEffect?.kind === "affliction" && targetEffect.delta > 0 ? "Affliction" : "Testimony";
  const choosePlanet = (planet: PlanetName) => {
    if (resolved || !eligiblePlanets.has(planet)) return;
    setSelectedPlanet((p) => p === planet ? null : planet);
    setHoveredPlanet(null);
  };
  const resetChoice = () => {
    if (guideOpen) return;
    setSelectedOptionId(null);
    setSelectedPlanet(null);
    setHoveredPlanet(null);
  };
  const projection: ProjectionChips = { deltas: {} };
  if (!resolved && preview?.ok) {
    for (const p of playerUnlocked) {
      const delta = preview.success.state[p].affliction - run.state[p].affliction;
      if (delta) projection.deltas[p] = { delta: Math.abs(delta), polarity: delta > 0 ? "Affliction" : "Testimony" };
    }
  }

  const handleOption = (optionId: string) => {
    if (resolved || committedRef.current || guideOpen) return;
    const nextRun = resolveNarrative(run, prince, scenario, optionId, selection, devUnlockAll);
    if (!nextRun) return;
    committedRef.current = true;
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

  const planetActions: PlanetStatsActions | undefined =
    targeting && inspectedPlanet && preview?.ok && !resolved ? {
      choices: [{
        verb,
        value: Math.abs(preview.success.state[inspectedPlanet].affliction - run.state[inspectedPlanet].affliction),
      }],
      pending: selectedPlanet ? verb : null,
      onChoose: () => {
        if (!selectedPlanet) setSelectedPlanet(inspectedPlanet);
        else handleOption(selectedOption!.id);
      },
      onClearPending: () => { setSelectedPlanet(null); setHoveredPlanet(null); },
    } : undefined;

  // `over` is derived (STATE.md): the run ended if every fielded planet combust.
  const runEnded = isOver(run, prince.chart, prince.numEncounters);

  const advance = useEncounterAdvance(
    resolved, onClearEncounter, runEnded ? 2800 : flash?.combusting.size ? 2400 : 1800,
  );

  const fragmentLines = (fragment?.text ?? "").split(/\n+/);

  return (
    <div
      className={`narrative ${resolved ? "is-resolved" : ""}`}
      onClick={resolved ? advance : resetChoice}
    >
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
      <div className="narrative-chart" ref={chartRef}>
        <Chart
          chart={prince.chart}
          state={run.state}
          unlockedPlanets={playerUnlocked}
          activePlanet={!targeting && joyPresent(ctx) ? joyPlanet : null}
          selectedPlanet={selectedPlanet}
          hoveredPlanet={selectedPlanet ? null : hoveredPlanet}
          onPlanetHover={resolved || selectedPlanet ? undefined : setHoveredPlanet}
          onPlanetClick={resolved ? undefined : (p) => choosePlanet(p)}
          interactionPlanets={eligiblePlanets}
          inviteInteraction={!resolved && targeting && !selectedPlanet}
          incoming={!resolved && targeting ? {
            verb,
            amount: targetEffect?.kind === "affliction" ? Math.abs(targetEffect.delta) : undefined,
          } : null}
          projection={projection}
          statsPanelPlanet={resolved ? null : inspectedPlanet}
          statsPanelActions={planetActions}
          statsPanelReserveActions={targeting}
          side="self"
          entrance="left"
          showColorField
          passive={resolved}
          impactPlanets={flash?.impact}
          combustingPlanets={flash?.combusting}
          animationEpoch={flash?.epoch}
        />
      </div>

      <div className="narrative-column">
        <div className="narrative-composition">
          <KandinskyComposition planet={ariaPlanet} size={280} />
        </div>

        <div className="narrative-text anim-fragment-in" data-guide="narrative-text">
          {fragment && (
            <>
              <div className="narrative-fragment">
                {fragmentLines.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < fragmentLines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </div>
              <div className="narrative-attrib">
                {fragment.author?.toUpperCase() ?? ""}
                {fragmentTitle(fragment) ? ` · ${fragmentTitle(fragment).toUpperCase()}` : ""}
              </div>
            </>
          )}
        </div>

        <div className="narrative-body">
          <div className="narrative-house" data-guide="narrative-house">
            <span className="narrative-house-num">{HOUSE_ROMAN[house.num - 1]}:</span> {HOUSE_NAMES[house.num - 1]}
            <span className="narrative-house-gloss"> — {house.gloss}</span>
          </div>
          <p>{resolved ? (encounter.resolutionText ?? "It is finished.") : scenario.text}</p>
        </div>

        <div className={`narrative-options ${resolved ? "is-resolved" : ""} ${selectedOptionId ? "is-arming" : ""}`} data-guide="narrative-options" style={{ "--vc": PLANET_PRIMARY[ariaPlanet] } as CSSProperties}>
          {shownRows.map(({ option: o, aside, reason, assignments }, i) => {
            const isSelected = selectedOptionId === o.id;
            const commit = () => {
              if (!assignments.length) return;
              if (!isSelected) {
                setSelectedOptionId(o.id);
                setSelectedPlanet(null);
                setHoveredPlanet(null);
                if (requiresPlanet(o) && window.matchMedia("(max-width: 899px)").matches) {
                  chartRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
                }
              } else if (!requiresPlanet(o)) handleOption(o.id);
            };
            return (
              <div key={o.id} className="narrative-option">
                <button
                  className={`option ${isSelected ? "is-selected" : ""}`}
                  data-guide={`option-${i + 1}`}
                  onClick={resolved ? advance : (e) => { e.stopPropagation(); commit(); }}
                  aria-pressed={isSelected}
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
    </div>
  );
}
