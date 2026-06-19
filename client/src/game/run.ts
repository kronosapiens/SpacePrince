import { PLANETS } from "./data";
import { blankSideState } from "./chart";
import { buildMapGraph, ROOT_NODE_ID } from "./map-gen";
import { mulberry32, randomSeed } from "./rng";
import type {
  MapState,
  Profile,
  RunState,
} from "./types";

export function newMapState(seed: number): MapState {
  return {
    id: `map_${seed}`,
    seed,
    graph: buildMapGraph(seed),
    currentNodeId: ROOT_NODE_ID,
    visitedNodeIds: [ROOT_NODE_ID],
    rolledNodes: {},
    lastNarrativeHouse: null,
    outcomes: {},
  };
}

export function beginRun(profile: Profile, seed = randomSeed()): RunState {
  const rng = mulberry32(seed);
  const mapSeed = Math.floor(rng() * 2 ** 31);
  return {
    id: `run_${seed}`,
    seed,
    startedAt: Date.now(),
    perPlanetState: blankSideState(),
    runDistance: 0,
    runOmens: [],
    currentMap: newMapState(mapSeed),
    mapHistory: [],
    currentEncounter: null,
    seenFragmentIds: [],
    seenScenarioIds: [],
    loreCounters: {},
    lifetimeEncounterAtRunStart: profile.lifetimeEncounterCount,
    over: false,
  };
}

/** A run spans up to seven maps; the seventh's completion ends it (MECHANICS §11). */
export const MAPS_PER_RUN = 7;

export function isRunOver(run: RunState): boolean {
  return PLANETS.every((p) => run.perPlanetState[p].combusted);
}

/** Called at L7 traversal. Generates a fresh map and archives the prior one —
 *  unless the seventh map was just completed, in which case the run ends by
 *  *completion* (MECHANICS §11): the current map stays in place as the final,
 *  completed map (End-of-Run reads `mapHistory` + `currentMap`) and the run is
 *  marked over. Either ending — completion here, or full combustion in
 *  `turn.ts` — inscribes the run's final Distance as a star. */
export function rolloverMap(run: RunState, seed = randomSeed()): RunState {
  if (run.mapHistory.length + 1 >= MAPS_PER_RUN) {
    return { ...run, currentEncounter: null, over: true };
  }
  return {
    ...run,
    currentMap: newMapState(seed),
    mapHistory: [...run.mapHistory, run.currentMap],
    currentEncounter: null,
  };
}
