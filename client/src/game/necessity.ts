import { blankSideState, cloneSideState } from "./chart";
import { fortuneChance, getEffectiveStats } from "./relational";
import { isCombusted, remainingResolve } from "./combust";
import { pickWeighted } from "./rng";
import type { Chart, NecessityEntry, PlanetName, SideState } from "./types";

export const NECESSITY_TENSION_TIERS = [12, 24, 36];
/** The Other's Necessity: each fielded planet rolls its Fortune this many times, */
export const OTHER_NECESSITY_ROLLS = 3;
/** and each miss adds its Resolve over this divisor as tension. */
export const OTHER_NECESSITY_RESOLVE_DIVISOR = 6;

/** Apply necessity to available fielded planets, preserving existing tension. */
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
    const draw = pickWeighted(NECESSITY_TENSION_TIERS, rng);
    const blocked = rng() < fortuneChance(getEffectiveStats(chart, planet).luck);
    const amount = Math.max(0, Math.min(
      blocked ? 0 : draw,
      remainingResolve(chart.planets[planet], ps),
    ));
    ps.tension += amount;
    necessity.push({ planet, amount, blocked, draw });
  }
  return { state: next, necessity };
}

/** Apply the Other's Necessity to a blank state: each fielded planet rolls its
 *  Fortune three times, and every miss adds a sixth of its Resolve as tension. */
export function applyOtherNecessity(
  chart: Chart,
  roster: readonly PlanetName[],
  rng: () => number,
): { state: SideState; necessity: NecessityEntry[] } {
  const state = blankSideState();
  const necessity: NecessityEntry[] = [];
  for (const planet of roster) {
    const { luck, resolve } = getEffectiveStats(chart, planet);
    const chance = fortuneChance(luck);
    const perMiss = resolve / OTHER_NECESSITY_RESOLVE_DIVISOR;
    let amount = 0;
    for (let roll = 0; roll < OTHER_NECESSITY_ROLLS; roll++) {
      if (rng() >= chance) amount += perMiss;
    }
    state[planet].tension = amount;
    necessity.push({ planet, amount, draw: OTHER_NECESSITY_ROLLS * perMiss });
  }
  return { state, necessity };
}
