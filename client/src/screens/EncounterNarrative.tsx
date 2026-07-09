import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chart } from "@/components/Chart";
import { PLANET_PRIMARY } from "@/svg/palette";
import { PLANETS } from "@/game/data";
import { KandinskyComposition } from "@/components/KandinskyComposition";
import { unlockedPlanets } from "@/game/unlocks";
import { applyOutcomes, buildNarrativeContext } from "@/game/narrative";
import { isOver } from "@/game/run";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { HOUSES } from "@/data/houses";
import { getScenario, getTreeNode, resolveAside, visibleOptions, type Option } from "@/data/narrative-trees";
import { getFragmentById, pickFragment, fragmentTitle } from "@/data/chorus";
import { playCombust, playPropagation, setAmbient } from "@/audio/engine";
import { hashString, mulberry32 } from "@/game/rng";
import type {
  NarrativeEncounter,
  PlanetName,
  Polarity,
  Prince,
  Run,
} from "@/game/types";

const ROMAN = ["i", "ii", "iii", "iv", "v"];

const HOUSE_ROMAN = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
];

const HOUSE_NAMES = [
  "First House", "Second House", "Third House", "Fourth House",
  "Fifth House", "Sixth House", "Seventh House", "Eighth House",
  "Ninth House", "Tenth House", "Eleventh House", "Twelfth House",
];

export interface CommitNarrativeArgs {
  nextRun: Run;
  /** Free-form summary of the choice made (used in NodeOutcome). */
  summary: string;
  /** True when the choice resolved the encounter. */
  resolved: boolean;
}

interface NarrativeScreenProps {
  run: Run;
  prince: Prince;
  encounter: NarrativeEncounter;
  /** Persistence + (when resolved) lifetime bump + outcome construction
   *  happens inside the implementation (real or dev). */
  onCommit: (args: CommitNarrativeArgs) => void;
  /** Clear `run.currentEncounter` and return to the map. */
  onClearEncounter: () => void;
}

export function EncounterNarrativeScreen(props: NarrativeScreenProps) {
  const { run, prince, encounter, onCommit, onClearEncounter } = props;
  const { setActive } = useActivePlanet();

  const house = HOUSES[encounter.house - 1]!;
  const tree = useMemo(
    () => getScenario(encounter.treeId, encounter.house),
    [encounter.treeId, encounter.house],
  );
  const ariaPlanet: PlanetName = house.ruler;
  const joyPlanet: PlanetName | null = house.joy;
  const playerUnlocked = useMemo(
    () => unlockedPlanets(prince.numEncounters),
    [prince.numEncounters],
  );

  useEffect(() => {
    setActive(ariaPlanet);
  }, [ariaPlanet, setActive]);

  // House ambience is shaped by its ruling planet (VIBES.md §Sound Design) —
  // the aria's voice, held as a single quiet tone under the encounter.
  useEffect(() => {
    setAmbient([ariaPlanet]);
    return () => setAmbient(null);
  }, [ariaPlanet]);

  const fragment = useMemo(() => {
    const fixed = getFragmentById(encounter.fragmentId);
    if (fixed) return fixed;
    const rng = mulberry32(encounter.house * 1000 + run.seed);
    return pickFragment({
      planet: ariaPlanet,
      mood: tree.fragmentMood,
      exclude: run.seenFragmentIds,
      rng,
    });
  }, [encounter.fragmentId, encounter.house, run.seed, run.seenFragmentIds, ariaPlanet, tree.fragmentMood]);

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

  const [resolved, setResolved] = useState(encounter.resolved);
  const [resolutionLine, setResolutionLine] = useState<string | null>(encounter.resolutionText ?? null);
  // Two-tap commit (mirrors combat, SCREENS.md §3.6): first tap arms an option
  // with a glow, second tap on the same option commits. Cleared on node change.
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  useEffect(() => setSelectedOptionId(null), [encounter.currentNodeId]);
  // Resolution flash: dramatize the state change on the chart (SCREENS.md §3.5).
  const [flash, setFlash] = useState<{
    epoch: number;
    impact: Map<PlanetName, Polarity>;
    combusting: Set<PlanetName>;
    distance: number; // signed delta; 0 = unchanged
  } | null>(null);
  const epochRef = useRef(0);
  // Freeze the option list at decision time so it stays put after resolution
  // (the visibility predicates read run-state, which the outcome can change).
  const [frozenOptions, setFrozenOptions] = useState<Option[] | null>(null);
  const node = useMemo(() => getTreeNode(tree, encounter.currentNodeId), [tree, encounter.currentNodeId]);
  const options = useMemo(() => visibleOptions(node, ctx), [node, ctx]);
  const shownOptions = resolved ? (frozenOptions ?? options) : options;

  const handleOption = (option: Option) => {
    if (resolved) return;
    let outcomes = option.outcomes ?? [];
    let resolutionText = "";
    if (option.outcomesOnSuccess || option.outcomesOnFail) {
      const luckPlanet = joyPlanet ?? house.ruler;
      const placement = prince.chart.planets[luckPlanet];
      const luck = placement.base.luck + placement.buffs.luck;
      // Luck runs ~2–12 on the even-stat scale; ~0.46 at luck 2, ~0.76 at luck 12.
      const chance = Math.min(0.85, 0.4 + luck * 0.03);
      // Seeded on (encounter, node, option): deterministic like every other
      // roll — the prototype stand-in for onchain true RNG at resolution.
      const wagerRng = mulberry32(
        hashString(`${encounter.id}_${encounter.currentNodeId}_${option.id}_wager`),
      );
      const success = wagerRng() < chance;
      outcomes = success ? (option.outcomesOnSuccess ?? []) : (option.outcomesOnFail ?? []);
      resolutionText = success ? "The wager holds." : "The wager falls.";
    }

    let nextRun = applyOutcomes(run, prince, outcomes, ctx);
    if (fragment && !nextRun.seenFragmentIds.includes(fragment.id)) {
      nextRun = { ...nextRun, seenFragmentIds: [...nextRun.seenFragmentIds, fragment.id] };
    }

    // Dramatize the resolution on the chart: heal/harm valence bloom per planet,
    // a candle-out ripple for any combust, and a Distance pulse (SCREENS.md §3.5).
    const impact = new Map<PlanetName, Polarity>();
    const combusting = new Set<PlanetName>();
    for (const p of PLANETS) {
      const before = run.state[p];
      const after = nextRun.state[p];
      if (!before.combusted && after.combusted) combusting.add(p);
      if (after.affliction < before.affliction) impact.set(p, "Testimony");
      else if (after.affliction > before.affliction) impact.set(p, "Affliction");
    }
    epochRef.current += 1;
    setFlash({
      epoch: epochRef.current,
      impact,
      combusting,
      distance: nextRun.distance - run.distance,
    });
    // Plain state-change sounds (SCREENS §3.5 — no propagation language here):
    // a combust cuts that planet's signature; otherwise heal resolves, harm hangs.
    if (combusting.size > 0) {
      for (const p of combusting) playCombust(p);
    } else if (impact.size > 0) {
      const harmed = [...impact.values()].some((pol) => pol === "Affliction");
      playPropagation(harmed);
    }

    if (option.next) {
      const updatedEnc: NarrativeEncounter = {
        ...encounter,
        currentNodeId: option.next,
        visitedNodeIds: [...encounter.visitedNodeIds, option.next],
      };
      nextRun = { ...nextRun, encounter: updatedEnc };
      onCommit({ nextRun, summary: option.text, resolved: false });
      return;
    }

    const finalEnc: NarrativeEncounter = {
      ...encounter,
      resolved: true,
      resolutionText: resolutionText || option.text,
    };
    nextRun = { ...nextRun, encounter: finalEnc };

    onCommit({
      nextRun,
      summary: `${house.name} · ${option.text}`,
      resolved: true,
    });
    setResolved(true);
    setResolutionLine(resolutionText || option.text);
    setFrozenOptions(options);
  };

  // `over` is derived (STATE.md): the run ended if every fielded planet combust.
  const runEnded = isOver(run, prince.numEncounters);

  const continuedRef = useRef(false);
  const handleContinue = useCallback(() => {
    if (continuedRef.current) return; // timer + tap both call this; fire once
    continuedRef.current = true;
    // Clear the encounter; PlaySurface then shows End (run over) or Map.
    onClearEncounter();
  }, [onClearEncounter]);

  // No Continue button: once resolved, the line gets a beat to land and then
  // the world carries the player onward (SCREENS.md §10). A tap skips the wait.
  useEffect(() => {
    if (!resolved) return;
    // Let the flash land before leaving — longer when a planet combusts.
    const ms = runEnded ? 2800 : flash?.combusting.size ? 2400 : 1800;
    const t = setTimeout(handleContinue, ms);
    return () => clearTimeout(t);
  }, [resolved, runEnded, flash, handleContinue]);

  const fragmentLines = (fragment?.text ?? "").split(/\n+/);

  return (
    <div
      className={`narrative ${resolved ? "is-resolved" : ""}`}
      onClick={resolved ? handleContinue : () => setSelectedOptionId(null)}
    >
      <div className="narrative-chart">
        <Chart
          chart={prince.chart}
          state={run.state}
          unlockedPlanets={playerUnlocked}
          activePlanet={joyPlanet ?? null}
          entrance="left"
          showColorField
          passive
          impactPlanets={flash?.impact}
          combustingPlanets={flash?.combusting}
          animationEpoch={flash?.epoch}
        />
      </div>

      <div className="narrative-column">
        <div className="narrative-composition">
          <KandinskyComposition planet={ariaPlanet} size={280} />
        </div>

        <div className="narrative-text anim-fragment-in">
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
          <div className="narrative-house">
            <span className="narrative-house-num">{HOUSE_ROMAN[house.num - 1]}:</span> {HOUSE_NAMES[house.num - 1]}
            <span className="narrative-house-gloss"> — {house.gloss}</span>
          </div>
          <p>{resolved ? (resolutionLine ?? "It is finished.") : node.text}</p>
        </div>

        <div className={`narrative-options ${resolved ? "is-resolved" : ""} ${selectedOptionId ? "is-arming" : ""}`} style={{ "--vc": PLANET_PRIMARY[ariaPlanet] } as CSSProperties}>
          {shownOptions.map((o, i) => {
            // Branch options (those that open a follow-up node) carry no direct
            // effect; cue that they lead onward, with a trailing arrow.
            const baseAside = resolveAside(o, ctx) ?? (o.next ? "A further choice" : undefined);
            const aside = o.next && baseAside ? `${baseAside} →` : baseAside;
            return (
              <button
                key={o.id}
                className={`option ${i === 1 ? "is-emph" : ""} ${selectedOptionId === o.id ? "is-selected" : ""}`}
                onClick={resolved ? handleContinue : (e) => { e.stopPropagation(); selectedOptionId === o.id ? handleOption(o) : setSelectedOptionId(o.id); }}
                aria-pressed={selectedOptionId === o.id}
                type="button"
              >
                <span className="option-index">{ROMAN[i] ?? `${i + 1}`}.</span>
                <span className="option-text">
                  {o.text}
                  {aside && <span className="option-aside">{aside}</span>}
                </span>
              </button>
            );
          })}
        </div>

        <div className="narrative-distance">
          <span className="eyebrow">DISTANCE</span>
          <span
            key={flash?.distance ? flash.epoch : "d"}
            className={`narrative-distance-v ${flash?.distance ? "anim-distance-pop" : ""}`}
            style={
              flash?.distance
                ? ({ "--flash-color": flash.distance > 0 ? "var(--testimony)" : "var(--affliction)" } as CSSProperties)
                : undefined
            }
          >
            {Math.round(run.distance)}
          </span>
        </div>
      </div>
    </div>
  );
}
