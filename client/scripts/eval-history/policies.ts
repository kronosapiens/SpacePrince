// Frozen policy semantics from the October 27 studies, independent of current eval policies.
// Imports resolve only inside the reconstructed historical workspace.
import assert from "node:assert/strict";
import { combatActions, type CombatAction, type PlayContext, type Policy } from "@/eval/play";
import { survivalPolicy } from "@/eval/policies";
import { runChart } from "@/game/chart";
import { combustionCeiling, isCombusted } from "@/game/combust";
import { fortuneChance, getEffectiveStats, getEffectiveStatsFromPlacement } from "@/game/combat";
import { eligibleNext, TERMINAL_NODE_ID } from "@/game/map-gen";
import { hashString, mulberry32, pickWeighted } from "@/game/rng";
import { MAPS_PER_RUN } from "@/game/run";
import { resolveTurn } from "@/game/turn";
import type { Chart, CombatEncounter, PlanetName, Polarity, Run } from "@/game/types";

export type Arm = "combat-immediate" | "combat-two-turn" | "narrative-immediate" | "combat-two-turn-entry-aware";
interface Value { alive: number; lit: number; capacity: number; light: number }
interface Candidate { action: CombatAction; value: Value }
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

function nextAnnouncements(run: Run): { run: Run; probability: number }[] {
  const encounter = run.encounter as CombatEncounter;
  if (encounter.resolved) return [];
  const roster = encounter.roster.filter((p) => !isCombusted(encounter.opponentChart.planets[p], encounter.opponentState[p]));
  return roster.flatMap((planet) => {
    const stats = getEffectiveStatsFromPlacement(encounter.opponentChart.planets[planet]);
    const afflict = stats.affliction / (stats.affliction + stats.testimony);
    return (["Affliction", "Testimony"] as Polarity[]).map((verb) => {
      const sequence = [...encounter.sequence];
      const opponentActions = [...encounter.opponentActions];
      sequence[encounter.turnIndex] = planet;
      opponentActions[encounter.turnIndex] = verb;
      return {
        probability: (verb === "Affliction" ? afflict : 1 - afflict) / roster.length,
        run: { ...run, encounter: { ...encounter, sequence, opponentActions } },
      };
    });
  });
}

function preferred(candidates: Candidate[]): Candidate[] {
  const alive = Math.max(...candidates.map((c) => c.value.alive));
  const aliveBest = candidates.filter((c) => c.value.alive >= alive - EPSILON);
  const lit = Math.max(...aliveBest.map((c) => c.value.lit));
  const litBest = aliveBest.filter((c) => c.value.lit >= lit - EPSILON);
  const capacity = Math.max(...litBest.map((c) => c.value.capacity));
  const safe = litBest.filter((c) => c.value.capacity >= capacity - EPSILON);
  const light = Math.max(...safe.map((c) => c.value.light));
  const lightBest = safe.filter((c) => c.value.light >= light - EPSILON);
  const remaining = Math.max(...lightBest.map((c) => c.value.capacity));
  return lightBest.filter((c) => c.value.capacity >= remaining - EPSILON);
}

// The original sensitivity assumes another combat before recovery; it is not an
// optimal continuation and ignores intervening narratives, revival and unlocks.
function entryLeafValue(run: Run, chart: Chart, variant: string): Value {
  const encounter = run.encounter as CombatEncounter;
  const effective = runChart(chart, run);
  const current = measure(run, effective, encounter.roster);
  const completed = run.mapsCompleted >= MAPS_PER_RUN ||
    (run.mapsCompleted === MAPS_PER_RUN - 1 && run.map.currentNodeId === TERMINAL_NODE_ID);
  if (!encounter.resolved || !current.alive || completed) return current;

  assert(variant === "capped-36" || variant === "lethal-24");
  const tiers = variant === "capped-36" ? [24, 36, 48] : [12, 24, 36];
  const reserve = variant === "capped-36" ? 1 : 0;
  let allLost = 1, lit = 0, capacity = 0;
  for (const planet of encounter.roster) {
    const remaining = Math.max(0, combustionCeiling(effective.planets[planet]) - run.state[planet].affliction);
    if (remaining === 0) continue;
    const fortune = fortuneChance(getEffectiveStats(effective, planet).luck);
    let survives = 0;
    for (const draw of tiers) {
      for (const halved of [false, true]) {
        const probability = (halved ? fortune : 1 - fortune) / tiers.length;
        const amount = Math.max(0, Math.min(halved ? draw / 2 : draw, remaining - reserve));
        const after = remaining - amount;
        if (after > 0) survives += probability;
        capacity += probability * after;
      }
    }
    survives = Math.min(1, survives);
    lit += survives;
    allLost *= 1 - survives;
  }
  return { alive: 1 - allLost, lit, capacity, light: run.light };
}

function twoTurn(play: PlayContext, run: Run, actions: CombatAction[], entryAware: boolean, variant: string): CombatAction {
  const chart = runChart(play.prince.chart, run);
  const roster = (run.encounter as CombatEncounter).roster;
  const leaf = (state: Run) => entryAware ? entryLeafValue(state, play.prince.chart, variant) : measure(state, chart, roster);
  const candidates = actions.map((action) => {
    const after = resolveTurn(run, play.prince.chart, action.planet, action.verb, NO_DRAW)!.run;
    const announcements = nextAnnouncements(after);
    if (!announcements.length) return { action, value: leaf(after) };
    const value: Value = { alive: 0, lit: 0, capacity: 0, light: 0 };
    for (const next of announcements) {
      const following = combatActions(next.run, play.prince.chart, next.run.encounter as CombatEncounter).map((choice) => {
        const resolved = resolveTurn(next.run, play.prince.chart, choice.planet, choice.verb, NO_DRAW)!.run;
        return { action: choice, value: leaf(resolved) };
      });
      const best = preferred(following)[0]!.value;
      for (const key of ["alive", "lit", "capacity", "light"] as const) value[key] += next.probability * best[key];
    }
    return { action, value };
  });
  return pickWeighted(preferred(candidates), play.rng).action;
}

function distanceToExit(run: Run, node: string): number {
  const seen = new Set([...run.map.visitedNodeIds, node]);
  let frontier = [node], distance = 0;
  while (!frontier.includes(TERMINAL_NODE_ID)) {
    frontier = frontier.flatMap((id) => eligibleNext(run.map.graph, id, [...seen]));
    assert(frontier.length, "Eligible nodes must have a path to the exit");
    for (const id of frontier) seen.add(id);
    distance++;
  }
  return distance;
}

export function policy(arm: Arm, variant: string): Policy {
  return {
    route: (play, run, nodes) => {
      const kind = arm === "narrative-immediate" ? "narrative" : "combat";
      const preferredNodes = nodes.filter((id) => run.map.rolledNodes[id]!.kind === kind);
      const candidates = preferredNodes.length ? preferredNodes : nodes;
      const distances = candidates.map((id) => distanceToExit(run, id));
      const shortest = Math.min(...distances);
      const tied = candidates.filter((_, i) => distances[i] === shortest);
      const { chartSeed, gameSeed } = play.trial;
      // Original route stream is independent of combat ties, including single-node draws.
      const rng = mulberry32(hashString(`difficulty_route_${chartSeed}_${gameSeed}_${run.mapsCompleted + 1}_${run.map.currentNodeId}`));
      return pickWeighted(tied, rng);
    },
    combat: arm === "combat-two-turn" || arm === "combat-two-turn-entry-aware"
      ? (play, run, actions) => twoTurn(play, run, actions, arm === "combat-two-turn-entry-aware", variant)
      : survivalPolicy.combat,
    narrative: survivalPolicy.narrative,
  };
}
