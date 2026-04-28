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
    loreCounters: {},
    lifetimeEncounterAtRunStart: profile.lifetimeEncounterCount,
    over: false,
  };
}

export function isRunOver(run: RunState): boolean {
  return PLANETS.every((p) => run.perPlanetState[p].combusted);
}

/** Called at L7 traversal — generate a fresh map and archive the prior one. */
export function rolloverMap(run: RunState, seed = randomSeed()): RunState {
  return {
    ...run,
    currentMap: newMapState(seed),
    mapHistory: [...run.mapHistory, run.currentMap],
    currentEncounter: null,
  };
}
