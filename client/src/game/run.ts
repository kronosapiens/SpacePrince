import { blankSideState } from "./chart";
import { buildMapGraph, ROOT_NODE_ID } from "./map-gen";
import { mulberry32, randomSeed } from "./rng";
import { unlockedPlanets } from "./unlocks";
import type { MapState, Run } from "./types";

/** A run spans up to seven maps; the seventh's completion ends it (MECHANICS §11). */
export const MAPS_PER_RUN = 7;

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

export function beginRun(seed = randomSeed()): Run {
  const rng = mulberry32(seed);
  const mapSeed = Math.floor(rng() * 2 ** 31);
  return {
    id: `run_${seed}`,
    seed,
    state: blankSideState(),
    distance: 0,
    map: newMapState(mapSeed),
    mapsCompleted: 0,
    encounter: null,
    seenFragmentIds: [],
    seenScenarioIds: [],
    events: [],
  };
}

/** Whether a run has ended — derived, never stored (STATE.md). A run is over
 *  when the seventh map is finished (completion) or every planet the player has
 *  *fielded* (its unlock tier) is combust (full combustion). */
export function isOver(run: Run, numEncounters: number): boolean {
  if (run.mapsCompleted >= MAPS_PER_RUN) return true;
  const tier = unlockedPlanets(numEncounters);
  return tier.length > 0 && tier.every((p) => run.state[p].combusted);
}

/** Called at L7 traversal. Bumps `mapsCompleted`; for a non-final map it archives
 *  the finished map to the event log and generates a fresh one. The seventh
 *  completion ends the run: the final map stays current (not archived), so the
 *  End screen's `[...events.map(e => e.map), run.map]` is exactly seven. */
export function rolloverMap(run: Run, seed = randomSeed()): Run {
  const mapsCompleted = run.mapsCompleted + 1;
  if (mapsCompleted >= MAPS_PER_RUN) {
    return { ...run, mapsCompleted, encounter: null };
  }
  const events = [...run.events, { kind: "map-completed" as const, map: run.map }];
  return { ...run, map: newMapState(seed), mapsCompleted, encounter: null, events };
}
