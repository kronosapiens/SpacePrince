import { blankSideState, cloneSideState } from "./chart";
import { fortuneChance, getEffectiveStats } from "./combat";
import { combustionCeiling, uncombust } from "./combust";
import { rollNodeContent } from "./map-content";
import { buildMapGraph, ROOT_NODE_ID } from "./map-gen";
import { hashString, mulberry32, randomSeed } from "./rng";
import { unlockedPlanets } from "./unlocks";
import type { Chart, MapBoundary, MapState, NodeContent, PlanetName, Run, SideState } from "./types";

/** A run spans up to seven maps; the seventh's completion ends it (MECHANICS §11). */
export const MAPS_PER_RUN = 7;

/** Per map completed, the barrage's ceiling-fraction span grows by this much:
 *  entering map k+1 rolls up to `k × 5%` of each ceiling (MECHANICS §11.3). */
export const BARRAGE_CEILING_FRACTION_PER_MAP = 0.05;

export function newMapState(seed: number): MapState {
  const graph = buildMapGraph(seed);
  // Every node's content is fixed at map creation, seeded on (map seed, node
  // id). Onchain the map seed itself is a VRF draw at creation — a map is
  // unknowable until it exists, then fully derivable, and the client renders
  // all of it (no fog of war). The root is an entry, not an encounter, so it
  // carries no content.
  const rolledNodes: Record<string, NodeContent> = {};
  for (const node of graph.nodes) {
    if (node.id === ROOT_NODE_ID) continue;
    rolledNodes[node.id] = rollNodeContent({
      rng: mulberry32(hashString(`${seed}_${node.id}`)),
    });
  }
  return {
    id: `map_${seed}`,
    seed,
    graph,
    currentNodeId: ROOT_NODE_ID,
    visitedNodeIds: [ROOT_NODE_ID],
    rolledNodes,
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

/**
 * The map boundary (MECHANICS §11.3), rolled from the new map's seed. Two steps,
 * in order: each combusted fielded planet rolls fortune to uncombust, then each
 * lit planet — relit ones included — takes its barrage share. Returns the
 * crossed state and the record the map screen shows on entry.
 */
export function rollMapBoundary(
  chart: Chart,
  state: SideState,
  roster: PlanetName[],
  mapsCompleted: number,
  rng: () => number,
): { state: SideState; boundary: MapBoundary } {
  const next = cloneSideState(state);
  const uncombusts: MapBoundary["uncombusts"] = [];
  const barrage: MapBoundary["barrage"] = [];
  for (const planet of roster) {
    if (!next[planet].combusted) continue;
    const chance = fortuneChance(getEffectiveStats(chart, planet).luck);
    const success = rng() < chance;
    if (success) uncombust(chart.planets[planet], next[planet]);
    uncombusts.push({ planet, chance, success });
  }
  for (const planet of roster) {
    const ps = next[planet];
    if (ps.combusted) continue;
    const ceiling = combustionCeiling(chart.planets[planet]);
    const frac = rng() * mapsCompleted * BARRAGE_CEILING_FRACTION_PER_MAP;
    const halved = rng() < fortuneChance(getEffectiveStats(chart, planet).luck);
    let amount = Math.round(ceiling * frac);
    if (halved) amount = Math.round(amount / 2);
    // The barrage wounds but never combusts (§11.3) — same guard as spawns.
    amount = Math.max(0, Math.min(amount, ceiling - 1 - ps.affliction));
    if (amount > 0) {
      ps.affliction += amount;
      barrage.push({ planet, amount, halved });
    }
  }
  return { state: next, boundary: { uncombusts, barrage } };
}

/** Called at L7 traversal. Bumps `mapsCompleted`; for a non-final map it archives
 *  the finished map to the event log, generates a fresh one, and passes the
 *  chart through the map boundary (§11.3) — uncombust rolls, then the barrage,
 *  both seeded by the new map. The seventh completion ends the run: the final
 *  map stays current (not archived), so the End screen's
 *  `[...events.map(e => e.map), run.map]` is exactly seven. */
export function rolloverMap(
  run: Run,
  chart: Chart,
  roster: PlanetName[],
  seed = randomSeed(),
): Run {
  const mapsCompleted = run.mapsCompleted + 1;
  if (mapsCompleted >= MAPS_PER_RUN) {
    return { ...run, mapsCompleted, encounter: null };
  }
  const events = [...run.events, { kind: "map-completed" as const, map: run.map }];
  const crossed = rollMapBoundary(
    chart, run.state, roster, mapsCompleted,
    mulberry32(hashString(`${seed}_boundary`)),
  );
  const map: MapState = { ...newMapState(seed), boundary: crossed.boundary };
  return { ...run, map, state: crossed.state, mapsCompleted, encounter: null, events };
}
