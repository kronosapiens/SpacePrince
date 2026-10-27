import { seededChart } from "@/game/chart";
import { UNLOCK_THRESHOLDS } from "@/game/data";
import { encounterRuler } from "@/game/encounter";
import { eligibleNext } from "@/game/map-gen";
import { hashString, mulberry32 } from "@/game/rng";
import { beginRun, enterNode, isOver, MAPS_PER_RUN, rolloverMap, shouldRolloverMap } from "@/game/run";
import { combatTurnRng } from "@/game/turn";
import { unlockedPlanets } from "@/game/unlocks";
import type { CombatEncounter, NarrativeEncounter, PlanetName, Polarity, Run } from "@/game/types";
import { playEncounter, snapshot, type PlayContext, type Step, type Trial } from "./play";
import { POLICIES } from "./policies";

export interface RunSummary {
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
  /** Encounters survived, by kind — the fatal one is left out, whether or not
   *  it resolved. A narrative encounter is one choice. */
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
  /** Issue #11's discrepancy: full combustion before a combat's last turn leaves it unresolved. */
  unresolvedCombat: boolean;
}

export interface RunRecord {
  trial: Trial;
  summary: RunSummary;
  steps: Step[];
}

/** Every planet fielded, without a dev flag. The lifetime count changes nothing
 *  past this tier, so it stays fixed. */
const FULL_TIER: number = UNLOCK_THRESHOLDS[UNLOCK_THRESHOLDS.length - 1]!;

/** Maps 2–7: seeded by (game seed, map number), never by the choices made.
 *  Map 1's seed derives inside `beginRun`. */
export function mapSeed(gameSeed: number, map: number): number {
  return hashString(`${gameSeed}_map_${map}`) % 2 ** 31;
}

/** Play one trial with the real game functions, in the UI's order. Re-running
 *  a trial reproduces its record exactly. */
export function runTrial(trial: Trial): RunRecord {
  const { chartSeed, gameSeed, strategy, strategySeed } = trial;
  const chart = seededChart(chartSeed);
  const play: PlayContext = {
    trial,
    prince: {
      id: `eval_${chartSeed}`, position: { iso: "", lat: 0, lon: 0 }, chart,
      numEncounters: FULL_TIER, achievements: 0, runs: [],
    },
    policy: POLICIES[strategy],
    rng: mulberry32(hashString(`strategy_${chartSeed}_${gameSeed}_${strategy}_${strategySeed}`)),
    turnRng: combatTurnRng,
  };
  let run = beginRun(chart, gameSeed, FULL_TIER);
  const steps: Step[] = [boundaryStep(run)];
  let unresolvedCombat = false;
  while (!isOver(run, chart, FULL_TIER)) {
    if (shouldRolloverMap(run, chart, FULL_TIER)) {
      run = rolloverMap(run, chart, unlockedPlanets(FULL_TIER), mapSeed(gameSeed, run.mapsCompleted + 2));
      if (run.mapsCompleted < MAPS_PER_RUN) steps.push(boundaryStep(run));
      continue;
    }
    const { graph, currentNodeId, visitedNodeIds } = run.map;
    const nodeId = play.policy.route(play, run, eligibleNext(graph, currentNodeId, visitedNodeIds));
    run = enterNode({ run, nodeId, lifetimeEncounterCount: FULL_TIER });
    steps.push(entryStep(run));
    run = playEncounter(play, run, (step) => steps.push(step));
    // The UI cannot leave an unresolved combat (issue #11), so the run stops here.
    if (!run.encounter!.resolved) {
      unresolvedCombat = true;
      break;
    }
    // Leave it as EncounterScreen's clearEncounter does.
    run = { ...run, encounter: null };
  }
  return { trial, summary: summarize(steps, run, unresolvedCombat), steps };
}

function boundaryStep(run: Run): Step {
  const { seed, boundary } = run.map;
  return {
    kind: "boundary", map: run.mapsCompleted + 1, seed,
    uncombusts: boundary!.uncombusts, necessity: boundary!.necessity, ...snapshot(run),
  };
}

function entryStep(run: Run): Step {
  const nodeId = run.map.currentNodeId;
  const content = run.map.rolledNodes[nodeId]!;
  const entry = { kind: "enter" as const, map: run.mapsCompleted + 1, nodeId, ...snapshot(run) };
  return content.kind === "combat"
    ? { ...entry, encounter: "combat", opponentSeed: content.opponentSeed, ruler: encounterRuler(run.encounter as CombatEncounter) }
    : { ...entry, encounter: "narrative", house: content.house, scenarioId: (run.encounter as NarrativeEncounter).scenarioId };
}

function summarize(steps: Step[], run: Run, unresolvedCombat: boolean): RunSummary {
  const verbs: Record<Polarity, number> = { Affliction: 0, Testimony: 0 };
  const narrativeOptions: Record<string, number> = {};
  let entry: Extract<Step, { kind: "enter" }> | undefined;
  let choice: Extract<Step, { kind: "turn" | "narrative" }> | undefined;
  let combatEncounters = 0, narrativeEncounters = 0, combatTurns = 0;
  let combustions = 0, boundaryRevivals = 0, narrativeRevivals = 0;
  for (const step of steps) {
    if (step.kind === "boundary") {
      boundaryRevivals += step.uncombusts.filter((u) => u.success).length;
    } else if (step.kind === "enter") {
      entry = step;
      if (step.encounter === "combat") combatEncounters++;
      else narrativeEncounters++;
    } else if (step.kind === "turn") {
      choice = step;
      combatTurns++;
      verbs[step.verb]++;
      combustions += step.combusts.length;
    } else {
      choice = step;
      combustions += step.combusts.length;
      narrativeRevivals += step.revivals.length;
      const key = `${entry?.encounter === "narrative" ? entry.scenarioId : ""}/${step.optionId}`;
      narrativeOptions[key] = (narrativeOptions[key] ?? 0) + 1;
    }
  }
  // Every encounter makes at least one choice, so both are set.
  const last = entry!, final = choice!;
  const endReason = run.mapsCompleted >= MAPS_PER_RUN ? "completion" : "combustion";
  const fatal = (kind: "combat" | "narrative") => (endReason === "combustion" && last.encounter === kind ? 1 : 0);
  return {
    endReason,
    mapsCompleted: run.mapsCompleted,
    terminalMap: last.map,
    terminalNodeId: last.nodeId,
    terminalKind: last.encounter,
    terminalScenarioId: last.encounter === "narrative" ? last.scenarioId : null,
    terminalRuler: last.encounter === "combat" ? last.ruler : null,
    lastPlanet: final.kind === "turn" ? final.planet : final.chosen,
    lastVerb: final.kind === "turn" ? final.verb : null,
    lastOptionId: final.kind === "narrative" ? final.optionId : null,
    light: run.light,
    combatEncounters: combatEncounters - fatal("combat"),
    narrativeEncounters: narrativeEncounters - fatal("narrative"),
    combatTurns,
    combustions,
    boundaryRevivals,
    narrativeRevivals,
    verbs,
    narrativeOptions,
    unresolvedCombat,
  };
}
