import { runChart } from "@/game/chart";
import { combustionCeiling, isCombusted } from "@/game/combust";
import { fortuneChance, getEffectiveStats } from "@/game/combat";
import { eligibleNext, TERMINAL_NODE_ID } from "@/game/map-gen";
import { NECESSITY_AFFLICTION_TIERS } from "@/game/necessity";
import { hashString, mulberry32, pickWeighted } from "@/game/rng";
import { MAPS_PER_RUN } from "@/game/run";
import { resolveTurn } from "@/game/turn";
import type { Chart, CombatEncounter, MapState, PlanetName, Polarity, Run } from "@/game/types";
import { combatActions, type CombatAction, type PlayContext, type Policy } from "./play";

export interface Value { alive: number; lit: number; capacity: number; light: number }
export interface Candidate { action: CombatAction; immediate: Value; value: Value }
export interface PlanningOptions {
  horizon?: 1 | 2;
  capacityAllowance?: number;
  anticipateEntry?: boolean;
  route?: "survival" | "combat" | "narrative";
}

const NO_DRAW = () => 0;
const EPSILON = 1e-9;

function measure(run: Run, chart: Chart, roster: PlanetName[]): Value {
  let lit = 0, capacity = 0;
  for (const planet of roster) {
    const remaining = Math.max(0, combustionCeiling(chart.planets[planet]) - run.state[planet].affliction);
    if (remaining > 0) lit++;
    capacity += remaining;
  }
  return { alive: lit > 0 ? 1 : 0, lit, capacity, light: run.light };
}

/** Every possible next announcement: uniform among lit Other planets, then
 * the game's stat-weighted verb. Replaces the resolver's placeholder draw. */
export function nextAnnouncements(run: Run): { run: Run; probability: number }[] {
  const encounter = run.encounter as CombatEncounter;
  if (encounter.resolved) return [];
  const roster = encounter.roster.filter((p) => !isCombusted(encounter.opponentChart.planets[p], encounter.opponentState[p]));
  return roster.flatMap((planet) => {
    const stats = getEffectiveStats(encounter.opponentChart, planet);
    const total = stats.affliction + stats.testimony;
    const afflict = total > 0 ? stats.affliction / total : 1;
    return (["Affliction", "Testimony"] as Polarity[]).map((verb) => {
      const sequence = [...encounter.sequence];
      const opponentActions = [...encounter.opponentActions];
      sequence[encounter.turnIndex] = planet;
      opponentActions[encounter.turnIndex] = verb;
      return {
        probability: (verb === "Affliction" ? afflict : 1 - afflict) / roster.length,
        run: { ...run, encounter: { ...encounter, sequence, opponentActions } },
      };
    }).filter(({ probability }) => probability > 0);
  });
}

/** Preserve survival probability and expected lit count; spend at most the
 * stated capacity allowance for Light. Zero gives the defensive ordering. */
export function preferred(candidates: Candidate[], allowance = 0): Candidate[] {
  const alive = Math.max(...candidates.map((c) => c.value.alive));
  const aliveBest = candidates.filter((c) => c.value.alive >= alive - EPSILON);
  const lit = Math.max(...aliveBest.map((c) => c.value.lit));
  const litBest = aliveBest.filter((c) => c.value.lit >= lit - EPSILON);
  const capacity = Math.max(...litBest.map((c) => c.value.capacity));
  const safe = litBest.filter((c) => c.value.capacity >= capacity - allowance - EPSILON);
  const light = Math.max(...safe.map((c) => c.value.light));
  const lightBest = safe.filter((c) => c.value.light >= light - EPSILON);
  const remaining = Math.max(...lightBest.map((c) => c.value.capacity));
  return lightBest.filter((c) => c.value.capacity >= remaining - EPSILON);
}

/** Value a resolved combat as if another combat arrived before recovery.
 * This heuristic omits intervening narratives, map revival and unlocks.
 * Independent Fortune rolls fully block the current Necessity tiers.
 * The chart is natal; both Resolve and Fortune include run gains here. */
export function entryLeafValue(run: Run, chart: Chart): Value {
  const encounter = run.encounter as CombatEncounter;
  const effective = runChart(chart, run);
  const current = measure(run, effective, encounter.roster);
  const completed = run.mapsCompleted >= MAPS_PER_RUN ||
    (run.mapsCompleted === MAPS_PER_RUN - 1 && run.map.currentNodeId === TERMINAL_NODE_ID);
  if (!encounter.resolved || !current.alive || completed) return current;

  let allLost = 1, lit = 0, capacity = 0;
  for (const planet of encounter.roster) {
    const remaining = Math.max(0, combustionCeiling(effective.planets[planet]) - run.state[planet].affliction);
    if (remaining === 0) continue;
    const fortune = fortuneChance(getEffectiveStats(effective, planet).luck);
    let survives = fortune;
    capacity += fortune * remaining;
    for (const draw of NECESSITY_AFFLICTION_TIERS) {
      const probability = (1 - fortune) / NECESSITY_AFFLICTION_TIERS.length;
      const after = Math.max(0, remaining - draw);
      if (after > 0) survives += probability;
      capacity += probability * after;
    }
    survives = Math.min(1, survives);
    lit += survives;
    allLost *= 1 - survives;
  }
  return { alive: 1 - allLost, lit, capacity, light: run.light };
}

/** Resolve the announced exchange exactly. At horizon two, enumerate the next
 * announcement and choose its best response by the same rule. No live draws
 * are consumed; entry anticipation changes only resolved-encounter leaves. */
export function evaluateCombat(
  play: PlayContext, run: Run, actions: CombatAction[], options: PlanningOptions = {},
): Candidate[] {
  const { horizon = 1, capacityAllowance = 0, anticipateEntry = false } = options;
  const chart = runChart(play.prince.chart, run);
  const roster = (run.encounter as CombatEncounter).roster;
  const valueOf = (after: Run) => anticipateEntry
    ? entryLeafValue(after, play.prince.chart) : measure(after, chart, roster);
  return actions.map((action) => {
    const after = resolveTurn(run, play.prince.chart, action.planet, action.verb, NO_DRAW)!.run;
    const immediate = measure(after, chart, roster);
    const announcements = horizon === 2 ? nextAnnouncements(after) : [];
    if (!announcements.length) return { action, immediate, value: valueOf(after) };
    const value: Value = { alive: 0, lit: 0, capacity: 0, light: 0 };
    for (const next of announcements) {
      const following = combatActions(next.run, play.prince.chart, next.run.encounter as CombatEncounter).map((choice) => {
        const resolved = resolveTurn(next.run, play.prince.chart, choice.planet, choice.verb, NO_DRAW)!.run;
        return { action: choice, immediate: measure(resolved, chart, roster), value: valueOf(resolved) };
      });
      // Exact ties have identical measures, so their identity cannot affect this value.
      const best = preferred(following, capacityAllowance)[0]!.value;
      for (const key of ["alive", "lit", "capacity", "light"] as const) value[key] += next.probability * best[key];
    }
    return { action, immediate, value };
  });
}

/** Encounters from `nodeId` to the map's exit by the shortest path the map allows. */
export function encountersToExit(map: MapState, nodeId: string): number {
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

function preferredRoute(kind: "combat" | "narrative", play: PlayContext, run: Run, nodes: string[]): string {
  const preferred = nodes.filter((id) => run.map.rolledNodes[id]!.kind === kind);
  const candidates = preferred.length ? preferred : nodes;
  const distances = candidates.map((id) => encountersToExit(run.map, id));
  const shortest = Math.min(...distances);
  const tied = candidates.filter((_, i) => distances[i] === shortest);
  const { chartSeed, gameSeed } = play.trial;
  // Historical route controls use a node-keyed stream, independent of combat ties.
  const rng = mulberry32(hashString(`difficulty_route_${chartSeed}_${gameSeed}_${run.mapsCompleted + 1}_${run.map.currentNodeId}`));
  return pickWeighted(tied, rng);
}

/** The baseline supplies immediate defense and narratives. Explicit baseline
 * context keeps forecast routes from recursively invoking the planner. */
export function planningPolicy(baseline: Policy, options: PlanningOptions): Policy {
  const { horizon = 1, capacityAllowance = 0, anticipateEntry = false, route = "survival" } = options;
  return {
    route: route === "survival"
      ? (play, run, ids) => baseline.route({ ...play, policy: baseline }, run, ids)
      : (play, run, ids) => preferredRoute(route, play, run, ids),
    combat: horizon === 1 && capacityAllowance === 0 && !anticipateEntry
      ? baseline.combat
      : (play, run, actions) => pickWeighted(preferred(evaluateCombat(play, run, actions, options), capacityAllowance), play.rng).action,
    narrative: baseline.narrative,
  };
}
