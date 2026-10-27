import { runChart } from "@/game/chart";
import { getScenario } from "@/data/narrative-scenarios";
import { combustionCeiling, isCombusted } from "@/game/combust";
import { eligibleNext, TERMINAL_NODE_ID } from "@/game/map-gen";
import { resolveNarrative } from "@/game/narrative";
import { hashString, mulberry32, pickWeighted } from "@/game/rng";
import { enterNode, isOver } from "@/game/run";
import { resolveTurn } from "@/game/turn";
import { unlockedPlanets } from "@/game/unlocks";
import type { MapState, NarrativeEncounter, Prince, Run } from "@/game/types";
import { playEncounter, type Policy, type PlayContext } from "./play";

/** Uniform among the legal choices: route, (planet, verb), then a narrative
 *  option and one of its selections. */
export const randomPolicy: Policy = {
  route: (play, _run, nodeIds) => pickWeighted(nodeIds, play.rng),
  combat: (play, _run, actions) => pickWeighted(actions, play.rng),
  narrative: (play, _run, options) => {
    const { option, selections } = pickWeighted(options, play.rng);
    return { optionId: option.id, selection: pickWeighted(selections, play.rng) };
  },
};

/** Samples per candidate node in a route forecast. */
export const FORECAST_SAMPLES = 8;

/** Resolution is deterministic; a turn's rng only draws the next precommit,
 *  which scoring a choice must not see (MECHANICS §7). */
const NO_DRAW = () => 0;

interface Measures { over: boolean; lit: number; capacity: number; light: number }

/** Lit planets and remaining capacity to absorb affliction, across the fielded roster. */
function measure(run: Run, prince: Prince): Measures {
  const { numEncounters } = prince;
  const chart = runChart(prince.chart, run);
  const roster = unlockedPlanets(numEncounters);
  return {
    over: isOver(run, chart, numEncounters),
    lit: roster.filter((p) => !isCombusted(chart.planets[p], run.state[p])).length,
    capacity: roster.reduce((sum, p) => sum + Math.max(0, combustionCeiling(chart.planets[p]) - run.state[p].affliction), 0),
    light: run.light,
  };
}

/** Survivals, and lit / capacity / net Light summed over the samples (equal counts, so sums rank like means). */
interface Forecast { survived: number; lit: number; capacity: number; light: number }

/** Play the candidate's encounter from what the map shows before entry. Each
 *  sample seeds its arrival, tie-breaks and turn draws on (trial, map, node,
 *  sample) — not the strategy, so strategies standing in the same place sample
 *  the same arrivals — and never on the live run. */
export function forecast(play: PlayContext, run: Run, nodeId: string): Forecast {
  const { chartSeed, gameSeed, strategySeed } = play.trial;
  const total: Forecast = { survived: 0, lit: 0, capacity: 0, light: 0 };
  for (let sample = 0; sample < FORECAST_SAMPLES; sample++) {
    const seed = hashString(`forecast_${chartSeed}_${gameSeed}_${strategySeed}_${run.mapsCompleted + 1}_${nodeId}_${sample}`);
    const entered = enterNode({
      run, chart: play.prince.chart, nodeId, lifetimeEncounterCount: play.prince.numEncounters, encounterIdSeed: hashString(`${seed}_arrival`),
    });
    const after = measure(playEncounter(forecastContext(play, seed), entered), play.prince);
    total.survived += after.over ? 0 : 1;
    total.lit += after.lit;
    total.capacity += after.capacity;
    total.light += after.light - run.light;
  }
  return total;
}

/** A forecast's own tie-breaks and turn draws: it can neither consume the live
 *  strategy stream nor read `combatTurnRng`, which keys on the live run. */
function forecastContext(play: PlayContext, seed: number): PlayContext {
  const turns = mulberry32(hashString(`${seed}_turns`));
  return { ...play, rng: mulberry32(hashString(`${seed}_ties`)), turnRng: () => turns };
}

/** Encounters from `nodeId` to the map's exit by the shortest path the map allows. */
function encountersToExit(map: MapState, nodeId: string): number {
  const seen = new Set([...map.visitedNodeIds, nodeId]);
  let frontier = [nodeId];
  let count = 0;
  while (!frontier.includes(TERMINAL_NODE_ID)) {
    frontier = frontier.flatMap((id) => eligibleNext(map.graph, id, [...seen]));
    for (const id of frontier) seen.add(id);
    count++;
  }
  return count;
}

/** Criteria compared in order, never weighted; the strategy's rng picks among exact ties. */
function best<T>(items: T[], key: (item: T) => number[], rng: () => number): T {
  let top: T[] = [];
  let topKey: number[] = [];
  for (const item of items) {
    const k = key(item);
    const order = top.length ? compare(k, topKey) : 1;
    if (order > 0) [top, topKey] = [[item], k];
    else if (order === 0) top.push(item);
  }
  return pickWeighted(top, rng);
}

function compare(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i]! > b[i]! ? 1 : -1;
  return 0;
}

/** Rank every legal immediate choice by its outcome through the shared
 *  resolvers, and every route by forecasting the candidate encounters. */
function strategic(
  choiceKey: (m: Measures) => number[],
  routeKey: (f: Forecast, run: Run, nodeId: string) => number[],
): Policy {
  return {
    route: (play, run, nodeIds) => nodeIds.length === 1
      ? nodeIds[0]!
      : best(nodeIds, (id) => routeKey(forecast(play, run, id), run, id), play.rng),
    combat: (play, run, actions) => best(actions, ({ planet, verb }) =>
      choiceKey(measure(resolveTurn(run, play.prince.chart, planet, verb, NO_DRAW)!.run, play.prince)), play.rng),
    narrative: (play, run, options) => {
      const scenario = getScenario((run.encounter as NarrativeEncounter).scenarioId);
      const choices = options.flatMap(({ option, selections }) => selections.map((selection) => ({ optionId: option.id, selection })));
      return best(choices, ({ optionId, selection }) =>
        choiceKey(measure(resolveNarrative(run, play.prince, scenario, optionId, selection)!, play.prince)), play.rng);
    },
  };
}

/** Lit planets, then capacity, then Light; routes break even estimates by the shorter way out. */
export const survivalPolicy = strategic(
  (m) => [m.lit, m.capacity, m.light],
  (f, run, nodeId) => [f.survived, f.lit, f.capacity, f.light, -encountersToExit(run.map, nodeId)],
);

/** Light among choices that keep the run going (any Light if none do), then lit planets and capacity. */
export const lightPolicy = strategic(
  (m) => [m.over ? 0 : 1, m.light, m.lit, m.capacity],
  (f) => [f.survived, f.light, f.lit, f.capacity],
);

export const POLICIES = { random: randomPolicy, survival: survivalPolicy, light: lightPolicy } satisfies Record<string, Policy>;
export type Strategy = keyof typeof POLICIES;
