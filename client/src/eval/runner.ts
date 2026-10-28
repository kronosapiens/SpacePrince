import { runChart, seededChart } from "@/game/chart";
import { combustionCeiling, newlyCombusted } from "@/game/combust";
import { UNLOCK_THRESHOLDS } from "@/game/data";
import { encounterRuler } from "@/game/encounter";
import { eligibleNext } from "@/game/map-gen";
import { hashString, mulberry32 } from "@/game/rng";
import { beginRun, enterNode, isOver, MAPS_PER_RUN, rolloverMap, shouldRolloverMap } from "@/game/run";
import { combatTurnRng } from "@/game/turn";
import { thresholdCrossedBy, unlockedPlanets } from "@/game/unlocks";
import { princeReducer } from "@/state/prince-reducer";
import type { Chart, CombatEncounter, NarrativeEncounter, PlanetName, Polarity, Run } from "@/game/types";
import { emptyCombatPressure, playEncounter, snapshot, statePressure, type CombatPressure, type PlayContext, type Policy, type Snapshot, type Step, type Trial } from "./play";
import { POLICIES } from "./policies";

export interface RunSummary {
  startingLifetimeEncounterCount: number;
  finalLifetimeEncounterCount: number;
  unlocks: PlanetName[];
  unlockRescues: number;
  pressure: RunPressure;
  endReason: "completion" | "combustion";
  mapsCompleted: number;
  /** Where the run ended: the last encounter entered, and the last choice made in it. */
  terminalMap: number;
  terminalNodeId: string;
  terminalKind: "combat" | "narrative";
  terminalScenarioId: string | null;
  terminalRuler: PlanetName | null;
  /** The final turn's planet and verb, or the narrative option and its chosen planet. */
  lastPlanet: PlanetName | null;
  lastVerb: Polarity | null;
  lastOptionId: string | null;
  light: number;
  /** Encounters survived, by kind — the fatal one is left out. A narrative
   *  encounter is one choice. */
  combatEncounters: number;
  narrativeEncounters: number;
  combatTurns: number;
  /** Player planets combusted, counting each time a revived planet goes out again. */
  combustions: number;
  boundaryRevivals: number;
  narrativeRevivals: number;
  verbs: Record<Polarity, number>;
  /** Keyed `scenarioId/optionId`. */
  narrativeOptions: Record<string, number>;
}

/** Capacity ledger for the fielded Self roster, in actual affliction points. */
export interface RunPressure {
  combat: CombatPressure;
  entryDamage: number; entryDeaths: number; entryWipes: number; entryWipeRescues: number;
  narrativeDamage: number; narrativeHealing: number; narrativeRevivalRecovery: number; resolveGain: number;
  boundaryRevivalRecovery: number; unlockCapacity: number;
  capacityStart: number; capacityEnd: number;
}

export function emptyRunPressure(): RunPressure {
  return { combat: emptyCombatPressure(), entryDamage: 0, entryDeaths: 0, entryWipes: 0, entryWipeRescues: 0,
    narrativeDamage: 0, narrativeHealing: 0, narrativeRevivalRecovery: 0, resolveGain: 0,
    boundaryRevivalRecovery: 0, unlockCapacity: 0, capacityStart: 0, capacityEnd: 0 };
}

export interface RunTrialOptions {
  /** Defaults to the full roster. Every resolved encounter advances this count. */
  startingLifetimeEncounterCount?: number;
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
  const startingLifetimeEncounterCount = options.startingLifetimeEncounterCount ?? FULL_TIER;
  if (!Number.isSafeInteger(startingLifetimeEncounterCount) || startingLifetimeEncounterCount < 0) {
    throw new Error("Starting lifetime encounter count must be a nonnegative safe integer");
  }
  const play: PlayContext = {
    trial,
    prince: {
      id: `eval_${chartSeed}`, position: { iso: "", lat: 0, lon: 0 }, chart,
      numEncounters: startingLifetimeEncounterCount, achievements: 0, runs: [],
    },
    policy,
    rng: mulberry32(hashString(`strategy_${chartSeed}_${gameSeed}_${strategy}_${strategySeed}`)),
    turnRng: combatTurnRng,
  };
  let run = beginRun(chart, gameSeed, startingLifetimeEncounterCount);
  play.prince = princeReducer(play.prince, { kind: "startRun", run })!;
  const steps: Step[] = [boundaryStep(run)];
  while (!isOver(run, chart, play.prince.numEncounters)) {
    if (shouldRolloverMap(run, chart, play.prince.numEncounters)) {
      run = rolloverMap(run, chart, unlockedPlanets(play.prince.numEncounters), mapSeed(gameSeed, run.mapsCompleted + 2));
      play.prince = princeReducer(play.prince, { kind: "commitRun", run })!;
      if (run.mapsCompleted < MAPS_PER_RUN) steps.push(boundaryStep(run));
      continue;
    }
    const { graph, currentNodeId, visitedNodeIds } = run.map;
    const nodeId = play.policy.route(play, run, eligibleNext(graph, currentNodeId, visitedNodeIds));
    const lifetimeBefore = play.prince.numEncounters, beforeEntry = run;
    run = enterNode({ run, chart, nodeId, lifetimeEncounterCount: lifetimeBefore });
    play.prince = princeReducer(play.prince, { kind: "commitRun", run })!;
    const entry = entryStep(run, beforeEntry, chart, lifetimeBefore);
    steps.push(entry);
    run = playEncounter(play, run, (step) => steps.push(step));
    play.prince = princeReducer(play.prince, { kind: "commitRun", run })!;
    const overBeforeClear = isOver(run, chart, lifetimeBefore);
    // EncounterScreen commits the resolved run, increments, then clears. A new
    // planet can rescue even a zero-turn entry wipe before isOver is checked again.
    play.prince = princeReducer(play.prince, { kind: "incrementEncounters" })!;
    run = { ...run, encounter: null };
    play.prince = princeReducer(play.prince, { kind: "commitRun", run })!;
    const unlocked = thresholdCrossedBy(lifetimeBefore, play.prince.numEncounters);
    if (unlocked) steps.push({ kind: "unlock", planet: unlocked, lifetimeEncounterCount: play.prince.numEncounters,
      rescuedByUnlock: overBeforeClear && !isOver(run, chart, play.prince.numEncounters),
      entryWipe: entry.encounter === "combat" && entry.wipe,
      capacity: capacity(chart, snapshot(run), play.prince.numEncounters) - capacity(chart, snapshot(run), lifetimeBefore),
      ...snapshot(run) });
  }
  return { trial, summary: summarize(steps, run, chart, startingLifetimeEncounterCount, play.prince.numEncounters), steps };
}

function capacity(chart: Chart, point: Snapshot, lifetimeEncounterCount: number): number {
  const placements = runChart(chart, point).planets;
  return unlockedPlanets(lifetimeEncounterCount).reduce((sum, p) =>
    sum + Math.max(0, combustionCeiling(placements[p]) - point.affliction[p]), 0);
}

function boundaryStep(run: Run): Step {
  const { seed, boundary } = run.map;
  return {
    kind: "boundary", map: run.mapsCompleted + 1, seed,
    uncombusts: boundary!.uncombusts, necessity: boundary!.necessity, ...snapshot(run),
  };
}

function entryStep(run: Run, before: Run, chart: Chart, lifetimeEncounterCount: number): Extract<Step, { kind: "enter" }> {
  const nodeId = run.map.currentNodeId;
  const content = run.map.rolledNodes[nodeId]!;
  const entry = { kind: "enter" as const, map: run.mapsCompleted + 1, nodeId, lifetimeEncounterCount, ...snapshot(run) };
  return content.kind === "combat"
    ? { ...entry, encounter: "combat", opponentSeed: content.opponentSeed, ruler: encounterRuler(run.encounter as CombatEncounter),
      necessity: (run.encounter as CombatEncounter).selfNecessity ?? [],
      combusts: newlyCombusted(runChart(chart, run), before.state, run.state), wipe: isOver(run, chart, lifetimeEncounterCount) }
    : { ...entry, encounter: "narrative", house: content.house, scenarioId: (run.encounter as NarrativeEncounter).scenarioId };
}

function summarize(steps: Step[], run: Run, chart: Chart, startingLifetimeEncounterCount: number, finalLifetimeEncounterCount: number): RunSummary {
  const verbs: Record<Polarity, number> = { Affliction: 0, Testimony: 0 };
  const narrativeOptions: Record<string, number> = {};
  let entry: Extract<Step, { kind: "enter" }> | undefined;
  let choice: Extract<Step, { kind: "turn" | "narrative" }> | undefined;
  let combatEncounters = 0, narrativeEncounters = 0, combatTurns = 0;
  let combustions = 0, boundaryRevivals = 0, narrativeRevivals = 0;
  const pressure = emptyRunPressure(), unlocks: PlanetName[] = [];
  let unlockRescues = 0, lifetimeEncounterCount = startingLifetimeEncounterCount;
  pressure.capacityStart = capacity(chart, steps[0]!, startingLifetimeEncounterCount);
  pressure.capacityEnd = capacity(chart, snapshot(run), finalLifetimeEncounterCount);
  for (const [index, step] of steps.entries()) {
    if (step.kind === "boundary") {
      boundaryRevivals += step.uncombusts.filter((u) => u.success).length;
      if (index > 0) pressure.boundaryRevivalRecovery += statePressure(chart, steps[index - 1]!, step, unlockedPlanets(lifetimeEncounterCount)).revivalRecovery;
    } else if (step.kind === "enter") {
      entry = step;
      choice = undefined;
      lifetimeEncounterCount = step.lifetimeEncounterCount;
      if (step.encounter === "combat") {
        combatEncounters++;
        combustions += step.combusts.length;
        pressure.entryDamage += step.necessity.reduce((sum, n) => sum + n.amount, 0);
        pressure.entryDeaths += step.combusts.length;
        pressure.entryWipes += +step.wipe;
      }
      else narrativeEncounters++;
    } else if (step.kind === "turn") {
      choice = step;
      combatTurns++;
      verbs[step.verb]++;
      combustions += step.combusts.length;
      for (const key of Object.keys(pressure.combat) as (keyof CombatPressure)[]) pressure.combat[key] += step.pressure[key];
    } else if (step.kind === "narrative") {
      choice = step;
      combustions += step.combusts.length;
      narrativeRevivals += step.revivals.length;
      const key = `${entry?.encounter === "narrative" ? entry.scenarioId : ""}/${step.optionId}`;
      narrativeOptions[key] = (narrativeOptions[key] ?? 0) + 1;
      pressure.narrativeDamage += step.pressure.damage;
      pressure.narrativeHealing += step.pressure.healing;
      pressure.narrativeRevivalRecovery += step.pressure.revivalRecovery;
      pressure.resolveGain += step.pressure.resolveGain;
    } else {
      lifetimeEncounterCount = step.lifetimeEncounterCount;
      unlocks.push(step.planet);
      unlockRescues += +step.rescuedByUnlock;
      pressure.unlockCapacity += step.capacity;
      pressure.entryWipeRescues += +(step.entryWipe && step.rescuedByUnlock);
    }
  }
  // A combat may end at entry, before any choice.
  const last = entry!, final = choice;
  const endReason = run.mapsCompleted >= MAPS_PER_RUN ? "completion" : "combustion";
  const fatal = (kind: "combat" | "narrative") => (endReason === "combustion" && last.encounter === kind ? 1 : 0);
  return {
    startingLifetimeEncounterCount, finalLifetimeEncounterCount, unlocks, unlockRescues, pressure,
    endReason,
    mapsCompleted: run.mapsCompleted,
    terminalMap: last.map,
    terminalNodeId: last.nodeId,
    terminalKind: last.encounter,
    terminalScenarioId: last.encounter === "narrative" ? last.scenarioId : null,
    terminalRuler: last.encounter === "combat" ? last.ruler : null,
    lastPlanet: final?.kind === "turn" ? final.planet : final?.chosen ?? null,
    lastVerb: final?.kind === "turn" ? final.verb : null,
    lastOptionId: final?.kind === "narrative" ? final.optionId : null,
    light: run.light,
    combatEncounters: combatEncounters - fatal("combat"),
    narrativeEncounters: narrativeEncounters - fatal("narrative"),
    combatTurns,
    combustions,
    boundaryRevivals,
    narrativeRevivals,
    verbs,
    narrativeOptions,
  };
}
