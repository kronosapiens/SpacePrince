import { cloneSideState } from "./chart";
import { fortuneChance, getEffectiveStats } from "./combat";
import { combustionCeiling, isCombusted } from "./combust";
import { pickWeighted } from "./rng";
import type { Chart, NecessityEntry, PlanetName, SideState } from "./types";

export const NECESSITY_AFFLICTION_TIERS = [12, 24, 36];

/** Apply necessity to available fielded planets, preserving existing affliction. */
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
    const draw = pickWeighted(NECESSITY_AFFLICTION_TIERS, rng);
    const blocked = rng() < fortuneChance(getEffectiveStats(chart, planet).luck);
    const amount = Math.max(0, Math.min(
      blocked ? 0 : draw,
      combustionCeiling(chart.planets[planet]) - ps.affliction,
    ));
    ps.affliction += amount;
    necessity.push({ planet, amount, blocked, draw });
  }
  return { state: next, necessity };
}
