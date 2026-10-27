import { pickScenario } from "@/data/narrative-scenarios";
import { blankGains, blankSideState, cloneSideState, houseSign, runChart } from "./chart";
import { fortuneChance, getEffectiveStats } from "./combat";
import { isCombusted, uncombust } from "./combust";
import { beginCombatEncounter, beginNarrativeEncounter } from "./encounter";
import { applyNecessity } from "./necessity";
import { rollNodeContent } from "./map-content";
import { buildMapGraph, ROOT_NODE_ID, TERMINAL_NODE_ID } from "./map-gen";
import { hashString, mulberry32, randomSeed } from "./rng";
import { unlockedPlanets } from "./unlocks";
import type { Chart, MapBoundary, MapState, NodeContent, PlanetName, Run, SideState } from "./types";

/** A run spans up to seven maps; the seventh's completion ends it (MECHANICS §11). */
export const MAPS_PER_RUN = 7;

export function newMapState(
  seed: number,
  combatRulers: readonly PlanetName[] = unlockedPlanets(0),
): MapState {
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
      combatRulers,
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

export function beginRun(
  chart: Chart,
  seed = randomSeed(),
  lifetimeEncounterCount = 0,
  devUnlockAll = false,
): Run {
  const rng = mulberry32(seed);
  const mapSeed = Math.floor(rng() * 2 ** 31);
  const combatRulers = unlockedPlanets(lifetimeEncounterCount, devUnlockAll);
  const crossed = rollMapBoundary(
    chart, blankSideState(), combatRulers,
    mulberry32(hashString(`${mapSeed}_boundary`)),
  );
  return {
    id: `run_${seed}`,
    seed,
    state: crossed.state,
    light: 0,
    gains: blankGains(),
    map: { ...newMapState(mapSeed, combatRulers), boundary: crossed.boundary },
    mapsCompleted: 0,
    encounter: null,
    seenScenarioIds: [],
    events: [],
  };
}

export interface EnterNodeInput {
  run: Run;
  chart: Chart;
  nodeId: string;
  lifetimeEncounterCount: number;
  devUnlockAll?: boolean;
  /** Route forecasts only: replaces the live arrival draws — combat's opening
   *  necessity and precommits, narrative's scenario pick — with a sampled
   *  seed. The opponent chart and the node bookkeeping are unchanged. */
  encounterIdSeed?: number;
}

/** Step onto a node: mark it current and visited, and open its pre-rolled
 *  encounter. A narrative scenario is drawn from the house's unseen pool,
 *  seeded on (run, house, node), and joins the no-repeat history. */
export function enterNode(input: EnterNodeInput): Run {
  const { run, chart, nodeId, lifetimeEncounterCount, devUnlockAll, encounterIdSeed } = input;
  const content = run.map.rolledNodes[nodeId];
  if (!content) throw new Error(`Node ${nodeId} has no content`);
  const entered: Run = {
    ...run,
    map: { ...run.map, currentNodeId: nodeId, visitedNodeIds: [...run.map.visitedNodeIds, nodeId] },
  };
  if (content.kind === "combat") {
    const encounter = beginCombatEncounter({
      run: entered,
      opponentSeed: content.opponentSeed,
      lifetimeEncounterCount,
      devUnlockAll,
      encounterIdSeed,
    });
    return { ...entered, encounter };
  }
  const rng = mulberry32(encounterIdSeed ?? hashString(`${run.id}_${content.house}_${nodeId}`));
  const { scenarioId } = pickScenario(content.house, houseSign(chart, content.house), run.seenScenarioIds, rng);
  return {
    ...entered,
    encounter: beginNarrativeEncounter({ run: entered, house: content.house, scenarioId }),
    seenScenarioIds: [...run.seenScenarioIds, scenarioId],
  };
}

/** Whether a run has ended — derived, never stored (STATE.md). A run is over
 *  when the seventh map is finished (completion) or every planet the player has
 *  *fielded* (its unlock tier) is combust (full combustion). Needs the chart
 *  because combustion is itself derived — affliction against each ceiling,
 *  which the run's gains raise. */
export function isOver(run: Run, chart: Chart, numEncounters: number): boolean {
  if (run.mapsCompleted >= MAPS_PER_RUN) return true;
  const tier = unlockedPlanets(numEncounters);
  const planets = runChart(chart, run).planets;
  return tier.length > 0 && tier.every((p) => isCombusted(planets[p], run.state[p]));
}

/**
 * The map boundary, rolled from the new map's seed. Two steps,
 * in order: each combusted fielded planet rolls fortune to uncombust, then each
 * lit planet — relit ones included — takes its necessity. Returns the
 * crossed state and the record the map screen shows on entry.
 */
export function rollMapBoundary(
  chart: Chart,
  state: SideState,
  roster: PlanetName[],
  rng: () => number,
): { state: SideState; boundary: MapBoundary } {
  const next = cloneSideState(state);
  const uncombusts: MapBoundary["uncombusts"] = [];
  for (const planet of roster) {
    if (!isCombusted(chart.planets[planet], next[planet])) continue;
    const chance = fortuneChance(getEffectiveStats(chart, planet).luck);
    const success = rng() < chance;
    if (success) uncombust(chart.planets[planet], next[planet]);
    uncombusts.push({ planet, chance, success });
  }
  const applied = applyNecessity(chart, next, roster, rng);
  return { state: applied.state, boundary: { uncombusts, necessity: applied.necessity } };
}

/** Whether the run crosses into its next map: the terminal node's encounter
 *  has cleared and the run is not over. Full combustion ends the run first,
 *  so a spent chart never reaches the boundary's uncombust rolls. */
export function shouldRolloverMap(run: Run, chart: Chart, numEncounters: number): boolean {
  return !run.encounter && run.map.currentNodeId === TERMINAL_NODE_ID && !isOver(run, chart, numEncounters);
}

/** Called at L7 traversal. Bumps `mapsCompleted`; for a non-final map it archives
 *  the finished map to the event log, generates a fresh one, and passes the
 *  chart, with the run's gains, through the map boundary — uncombust rolls,
 *  then necessity, both seeded by the new map. The seventh completion ends the
 *  run: the final map stays current (not archived). */
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
    runChart(chart, run), run.state, roster,
    mulberry32(hashString(`${seed}_boundary`)),
  );
  const map: MapState = { ...newMapState(seed, roster), boundary: crossed.boundary };
  return { ...run, map, state: crossed.state, mapsCompleted, encounter: null, events };
}
