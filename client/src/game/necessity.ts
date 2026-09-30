import { cloneSideState } from "./chart";
import { fortuneChance, getEffectiveStats } from "./combat";
import { combustionCeiling, isCombusted } from "./combust";
import { pickWeighted } from "./rng";
import type { Chart, MapBoundary, PlanetName, SideState } from "./types";

export const NECESSITY_AFFLICTION_TIERS = [12, 24, 36];

/** Apply necessity to available fielded planets, preserving existing affliction. */
export function applyNecessity(
  chart: Chart,
  state: SideState,
  roster: readonly PlanetName[],
  rng: () => number,
): { state: SideState; necessity: MapBoundary["necessity"] } {
  const next = cloneSideState(state);
  const necessity: MapBoundary["necessity"] = [];
  for (const planet of roster) {
    const ps = next[planet];
    if (isCombusted(chart.planets[planet], ps)) continue;
    const draw = pickWeighted(NECESSITY_AFFLICTION_TIERS, rng);
    const halved = rng() < fortuneChance(getEffectiveStats(chart, planet).luck);
    const amount = Math.max(0, Math.min(
      halved ? draw / 2 : draw,
      combustionCeiling(chart.planets[planet]) - 1 - ps.affliction,
    ));
    if (amount > 0) {
      ps.affliction += amount;
      necessity.push({ planet, amount, halved });
    }
  }
  return { state: next, necessity };
}
