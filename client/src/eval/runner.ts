import { runChart, seededChart } from "@/game/chart";
import { newlyCombusted } from "@/game/combust";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
import { UNLOCK_THRESHOLDS } from "@/game/data";
import { encounterRuler } from "@/game/encounter";
import { eligibleNext } from "@/game/map-gen";
import { hashString, mulberry32 } from "@/game/rng";
import { beginRun, enterNode, isOver, MAPS_PER_RUN, rolloverMap, shouldRolloverMap } from "@/game/run";
import { relationalTurnRng } from "@/game/turn";
import { thresholdCrossedBy, unlockedPlanets } from "@/game/unlocks";
import { princeReducer } from "@/state/prince-reducer";
import type { Chart, RelationalEncounter, NarrativeEncounter, PlanetName, Polarity, Run } from "@/game/types";
import { emptyRelationalTension, playEncounter, snapshot, stateTension, type RelationalTension, type PlayContext, type Policy, type Snapshot, type Step, type Trial } from "./play";
import { POLICIES } from "./policies";

export interface RunSummary {
  startingLifetimeRelationalEncounterCount: number;
  finalLifetimeRelationalEncounterCount: number;
  unlocks: PlanetName[];
  unlockRescues: number;
  tension: RunTension;
  endReason: "completion" | "combustion";
  mapsCompleted: number;
  /** Where the run ended: the last encounter entered, and the last choice made in it. */
  terminalMap: number;
  terminalNodeId: string;
  terminalKind: "relational" | "narrative";
  terminalScenarioId: string | null;
  terminalRuler: PlanetName | null;
  /** The final turn's planet and verb, or the narrative option and its chosen planet. */
  lastPlanet: PlanetName | null;
  lastVerb: Polarity | null;
  lastOptionId: string | null;
  light: number;
  /** Encounters survived, by kind — the fatal one is left out. A narrative
   *  encounter is one choice. */
  relationalEncounters: number;
  narrativeEncounters: number;
  relationalTurns: number;
  /** Player planets combusted, counting each time a revived planet goes out again. */
  combustions: number;
  boundaryRevivals: number;
  narrativeRevivals: number;
  verbs: Record<Polarity, number>;
  /** Keyed `scenarioId/optionId`. */
  narrativeOptions: Record<string, number>;
}

/** Capacity ledger for the fielded Self roster, in actual tension points. */
export interface RunTension {
  relational: RelationalTension;
  entryTension: number; entryDeaths: number; entryWipes: number; entryWipeRescues: number;
  narrativeCreated: number; narrativeEased: number; narrativeRevivalRecovery: number; resolveGain: number;
  boundaryRevivalRecovery: number; unlockCapacity: number;
  capacityStart: number; capacityEnd: number;
}

export function emptyRunTension(): RunTension {
  return { relational: emptyRelationalTension(), entryTension: 0, entryDeaths: 0, entryWipes: 0, entryWipeRescues: 0,
    narrativeCreated: 0, narrativeEased: 0, narrativeRevivalRecovery: 0, resolveGain: 0,
    boundaryRevivalRecovery: 0, unlockCapacity: 0, capacityStart: 0, capacityEnd: 0 };
}

export interface RunTrialOptions {
  /** Defaults to the full roster. Only resolved relational encounters advance this count. */
  startingLifetimeRelationalEncounterCount?: number;
}

export interface RunRecord {
  trial: Trial;
  summary: RunSummary;
  steps: Step[];
}

/** Default evaluation starts with every planet fielded, without a dev flag. */
const FULL_TIER: number = UNLOCK_THRESHOLDS[UNLOCK_THRESHOLDS.length - 1]!;

/** Maps 2–7: seeded by (game seed, map number), never by the choices made.
 *  Map 1's seed derives inside `beginRun`. */
export function mapSeed(gameSeed: number, map: number): number {
  return hashString(`${gameSeed}_map_${map}`) % 2 ** 31;
}

/** Play one trial with the real game functions, in the UI's order. Re-running
 *  a trial reproduces its record exactly. */
export function runTrial(trial: Trial, policy: Policy = POLICIES[trial.strategy], options: RunTrialOptions = {}): RunRecord {
  const { chartSeed, gameSeed, strategy, strategySeed } = trial;
  const chart = seededChart(chartSeed);
  const startingLifetimeRelationalEncounterCount = options.startingLifetimeRelationalEncounterCount ?? FULL_TIER;
  if (!Number.isSafeInteger(startingLifetimeRelationalEncounterCount) || startingLifetimeRelationalEncounterCount < 0) {
    throw new Error("Starting lifetime relational encounter count must be a nonnegative safe integer");
  }
  const play: PlayContext = {
    trial,
    prince: {
      id: `eval_${chartSeed}`, position: { iso: "", lat: 0, lon: 0 }, chart,
      numRelationalEncounters: startingLifetimeRelationalEncounterCount, achievements: 0, runs: [],
    },
    policy,
    // Keep seeded strategy streams stable across the encounter terminology change.
    rng: mulberry32(hashString(`strategy_${chartSeed}_${gameSeed}_${strategy.replace("relational", "combat")}_${strategySeed}`)),
    turnRng: relationalTurnRng,
  };
  let run = beginRun(chart, gameSeed, startingLifetimeRelationalEncounterCount);
  play.prince = princeReducer(play.prince, { kind: "startRun", run })!;
  const steps: Step[] = [boundaryStep(run)];
  while (!isOver(run, chart, play.prince.numRelationalEncounters)) {
    if (shouldRolloverMap(run, chart, play.prince.numRelationalEncounters)) {
      run = rolloverMap(run, chart, unlockedPlanets(play.prince.numRelationalEncounters), mapSeed(gameSeed, run.mapsCompleted + 2));
      play.prince = princeReducer(play.prince, { kind: "commitRun", run })!;
      if (run.mapsCompleted < MAPS_PER_RUN) steps.push(boundaryStep(run));
      continue;
    }
    const { graph, currentNodeId, visitedNodeIds } = run.map;
    const nodeId = play.policy.route(play, run, eligibleNext(graph, currentNodeId, visitedNodeIds));
    const lifetimeBefore = play.prince.numRelationalEncounters, beforeEntry = run;
    run = enterNode({ run, chart, nodeId, lifetimeRelationalEncounterCount: lifetimeBefore });
    play.prince = princeReducer(play.prince, { kind: "commitRun", run })!;
    const entry = entryStep(run, beforeEntry, chart, lifetimeBefore);
    steps.push(entry);
    run = playEncounter(play, run, (step) => steps.push(step));
    play.prince = princeReducer(play.prince, { kind: "commitRun", run })!;
    const overBeforeClear = isOver(run, chart, lifetimeBefore);
    // EncounterScreen commits the resolved run, increments, then clears. A new
    // planet can rescue even a zero-turn entry wipe before isOver is checked again.
    if (run.encounter?.kind === "relational" && run.encounter.resolved) {
      play.prince = princeReducer(play.prince, { kind: "incrementRelationalEncounters" })!;
    }
    run = { ...run, encounter: null };
    play.prince = princeReducer(play.prince, { kind: "commitRun", run })!;
    const unlocked = thresholdCrossedBy(lifetimeBefore, play.prince.numRelationalEncounters);
    if (unlocked) steps.push({ kind: "unlock", planet: unlocked, lifetimeRelationalEncounterCount: play.prince.numRelationalEncounters,
      rescuedByUnlock: overBeforeClear && !isOver(run, chart, play.prince.numRelationalEncounters),
      entryWipe: entry.encounter === "relational" && entry.wipe,
      capacity: capacity(chart, snapshot(run), play.prince.numRelationalEncounters) - capacity(chart, snapshot(run), lifetimeBefore),
      ...snapshot(run) });
  }
  return { trial, summary: summarize(steps, run, chart, startingLifetimeRelationalEncounterCount, play.prince.numRelationalEncounters), steps };
}

function capacity(chart: Chart, point: Snapshot, lifetimeRelationalEncounterCount: number): number {
  const placements = runChart(chart, point).planets;
  return unlockedPlanets(lifetimeRelationalEncounterCount).reduce((sum, p) =>
    sum + Math.max(0, getEffectiveStatsFromPlacement(placements[p]).resolve - point.tension[p]), 0);
}

function boundaryStep(run: Run): Step {
  const { seed, boundary } = run.map;
  return {
    kind: "boundary", map: run.mapsCompleted + 1, seed,
    uncombusts: boundary!.uncombusts, necessity: boundary!.necessity, ...snapshot(run),
  };
}

function entryStep(run: Run, before: Run, chart: Chart, lifetimeRelationalEncounterCount: number): Extract<Step, { kind: "enter" }> {
  const nodeId = run.map.currentNodeId;
  const content = run.map.rolledNodes[nodeId]!;
  const entry = { kind: "enter" as const, map: run.mapsCompleted + 1, nodeId, lifetimeRelationalEncounterCount, ...snapshot(run) };
  return content.kind === "relational"
    ? { ...entry, encounter: "relational", opponentSeed: content.opponentSeed, ruler: encounterRuler(run.encounter as RelationalEncounter),
      necessity: (run.encounter as RelationalEncounter).selfNecessity ?? [],
      combusts: newlyCombusted(runChart(chart, run), before.state, run.state), wipe: isOver(run, chart, lifetimeRelationalEncounterCount) }
    : { ...entry, encounter: "narrative", house: content.house, scenarioId: (run.encounter as NarrativeEncounter).scenarioId };
}

function summarize(steps: Step[], run: Run, chart: Chart, startingLifetimeRelationalEncounterCount: number, finalLifetimeRelationalEncounterCount: number): RunSummary {
  const verbs: Record<Polarity, number> = { Affliction: 0, Testimony: 0 };
  const narrativeOptions: Record<string, number> = {};
  let entry: Extract<Step, { kind: "enter" }> | undefined;
  let choice: Extract<Step, { kind: "turn" | "narrative" }> | undefined;
  let relationalEncounters = 0, narrativeEncounters = 0, relationalTurns = 0;
  let combustions = 0, boundaryRevivals = 0, narrativeRevivals = 0;
  const tension = emptyRunTension(), unlocks: PlanetName[] = [];
  let unlockRescues = 0, lifetimeRelationalEncounterCount = startingLifetimeRelationalEncounterCount;
  tension.capacityStart = capacity(chart, steps[0]!, startingLifetimeRelationalEncounterCount);
  tension.capacityEnd = capacity(chart, snapshot(run), finalLifetimeRelationalEncounterCount);
  for (const [index, step] of steps.entries()) {
    if (step.kind === "boundary") {
      boundaryRevivals += step.uncombusts.filter((u) => u.success).length;
      if (index > 0) tension.boundaryRevivalRecovery += stateTension(chart, steps[index - 1]!, step, unlockedPlanets(lifetimeRelationalEncounterCount)).revivalRecovery;
    } else if (step.kind === "enter") {
      entry = step;
      choice = undefined;
      lifetimeRelationalEncounterCount = step.lifetimeRelationalEncounterCount;
      if (step.encounter === "relational") {
        relationalEncounters++;
        combustions += step.combusts.length;
        tension.entryTension += step.necessity.reduce((sum, n) => sum + n.amount, 0);
        tension.entryDeaths += step.combusts.length;
        tension.entryWipes += +step.wipe;
      }
      else narrativeEncounters++;
    } else if (step.kind === "turn") {
      choice = step;
      relationalTurns++;
      verbs[step.verb]++;
      combustions += step.combusts.length;
      for (const key of Object.keys(tension.relational) as (keyof RelationalTension)[]) tension.relational[key] += step.tensionChange[key];
    } else if (step.kind === "narrative") {
      choice = step;
      combustions += step.combusts.length;
      narrativeRevivals += step.revivals.length;
      const key = `${entry?.encounter === "narrative" ? entry.scenarioId : ""}/${step.optionId}`;
      narrativeOptions[key] = (narrativeOptions[key] ?? 0) + 1;
      tension.narrativeCreated += step.tensionChange.created;
      tension.narrativeEased += step.tensionChange.eased;
      tension.narrativeRevivalRecovery += step.tensionChange.revivalRecovery;
      tension.resolveGain += step.tensionChange.resolveGain;
    } else {
      lifetimeRelationalEncounterCount = step.lifetimeRelationalEncounterCount;
      unlocks.push(step.planet);
      unlockRescues += +step.rescuedByUnlock;
      tension.unlockCapacity += step.capacity;
      tension.entryWipeRescues += +(step.entryWipe && step.rescuedByUnlock);
    }
  }
  // A relational may end at entry, before any choice.
  const last = entry!, final = choice;
  const endReason = run.mapsCompleted >= MAPS_PER_RUN ? "completion" : "combustion";
  const fatal = (kind: "relational" | "narrative") => (endReason === "combustion" && last.encounter === kind ? 1 : 0);
  return {
    startingLifetimeRelationalEncounterCount, finalLifetimeRelationalEncounterCount, unlocks, unlockRescues, tension,
    endReason,
    mapsCompleted: run.mapsCompleted,
    terminalMap: last.map,
    terminalNodeId: last.nodeId,
    terminalKind: last.encounter,
    terminalScenarioId: last.encounter === "narrative" ? last.scenarioId : null,
    terminalRuler: last.encounter === "relational" ? last.ruler : null,
    lastPlanet: final?.kind === "turn" ? final.planet : final?.chosen ?? null,
    lastVerb: final?.kind === "turn" ? final.verb : null,
    lastOptionId: final?.kind === "narrative" ? final.optionId : null,
    light: run.light,
    relationalEncounters: relationalEncounters - fatal("relational"),
    narrativeEncounters: narrativeEncounters - fatal("narrative"),
    relationalTurns,
    combustions,
    boundaryRevivals,
    narrativeRevivals,
    verbs,
    narrativeOptions,
  };
}
