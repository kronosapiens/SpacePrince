import { cloneSideState } from "./chart";
import { fortuneChance, getEffectiveStats } from "./relational";
import { isCombusted, remainingResolve } from "./combust";
import { pickWeighted } from "./rng";
import type { Chart, NecessityEntry, PlanetName, SideState } from "./types";

export const NECESSITY_TENSION_TIERS = [12, 24, 36];

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
