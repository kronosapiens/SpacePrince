import { blankSideState, cloneSideState } from "./chart";
import { fortuneChance, getEffectiveStats } from "./relational";
import { isCombusted, remainingResolve } from "./combust";
import type { Chart, NecessityEntry, PlanetName, SideState } from "./types";

/** Necessity: each fielded planet rolls its Fortune this many times, */
export const NECESSITY_ROLLS = 3;
/** and each miss adds its Resolve over this divisor as tension. */
const NECESSITY_RESOLVE_DIVISOR = 6;

/** The tension one missed roll adds to the planet. */
export function necessityPerMiss(chart: Chart, planet: PlanetName): number {
  return getEffectiveStats(chart, planet).resolve / NECESSITY_RESOLVE_DIVISOR;
}

function rollNecessity(chart: Chart, planet: PlanetName, rng: () => number): number {
  const chance = fortuneChance(getEffectiveStats(chart, planet).luck);
  let misses = 0;
  for (let roll = 0; roll < NECESSITY_ROLLS; roll++) {
    if (rng() >= chance) misses++;
  }
  return misses * necessityPerMiss(chart, planet);
}

/** Apply the player's Necessity to available fielded planets, added to the
 *  tension each already carries and capped at its Resolve. */
export function applyNecessity(
  chart: Chart,
  state: SideState,
  roster: readonly PlanetName[],
  rng: () => number,
): { state: SideState; necessity: NecessityEntry[] } {
  const next = cloneSideState(state);
  const necessity: NecessityEntry[] = [];
  for (const planet of roster) {
    const ps = next[planet];
    if (isCombusted(chart.planets[planet], ps)) continue;
    const amount = Math.min(rollNecessity(chart, planet, rng), remainingResolve(chart.planets[planet], ps));
    ps.tension += amount;
    necessity.push({ planet, amount });
  }
  return { state: next, necessity };
}

/** Apply the Other's Necessity to a blank state. */
export function applyOtherNecessity(
  chart: Chart,
  roster: readonly PlanetName[],
  rng: () => number,
): { state: SideState; necessity: NecessityEntry[] } {
  const state = blankSideState();
  const necessity: NecessityEntry[] = [];
  for (const planet of roster) {
    const amount = rollNecessity(chart, planet, rng);
    state[planet].tension = amount;
    necessity.push({ planet, amount });
  }
  return { state, necessity };
}
