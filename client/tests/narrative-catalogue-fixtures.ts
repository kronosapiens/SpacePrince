import { blankGains, blankSideState, derivePlacements, getDignity, runChart } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { PLANETS, SIGNS } from "@/game/data";
import { beginNarrativeEncounter } from "@/game/encounter";
import type { NarrativeScenario } from "@/game/narrative";
import { beginRun } from "@/game/run";
import type { PlanetName, Prince, Run } from "@/game/types";
import { unlockedPlanets } from "@/game/unlocks";
import { createStubPrince } from "./fixtures";

export const BASE_PRINCE = createStubPrince();
const BASE_RUN = beginRun(BASE_PRINCE.chart, 42, 64);
export type Occupancy = "empty" | "favorable" | "adverse" | "neutral" | "balanced";
export type Condition = "clean" | "injured" | "near combustion" | "one lit";

export function chartFor(scene: NarrativeScenario, occupancy: Occupancy) {
  const signIndex = SIGNS.indexOf(scene.sign);
  const strong = PLANETS.find((p) => ["Domicile", "Exaltation"].includes(getDignity(p, scene.sign)))!;
  const weak = PLANETS.find((p) => ["Detriment", "Fall"].includes(getDignity(p, scene.sign)))!;
  const neutral = PLANETS.find((p) => getDignity(p, scene.sign) === "Neutral")!;
  const occupants = occupancy === "balanced" ? [strong, weak]
    : occupancy === "favorable" ? [strong]
    : occupancy === "adverse" ? [weak]
    : occupancy === "neutral" ? [neutral] : [];
  const longitudes = Object.fromEntries(PLANETS.map((p, i) =>
    [p, (occupants.includes(p) ? signIndex : (signIndex + 1 + i) % 12) * 30 + 15],
  )) as Record<PlanetName, number>;
  return {
    ...BASE_PRINCE.chart,
    ...derivePlacements({ longitudes, ascendantLongitude: ((signIndex - scene.house + 13) % 12) * 30, isDiurnal: true }),
  };
}

export function stateFor(scene: NarrativeScenario, prince: Prince, condition: Condition, light: number, gains = false) {
  const run: Run = { ...BASE_RUN, light, state: blankSideState(), gains: blankGains() };
  if (gains) for (const p of PLANETS) run.gains[p].resolve = 24;
  const chart = runChart(prince.chart, run);
  const roster = unlockedPlanets(prince.numRelationalEncounters);
  for (const [i, p] of roster.entries()) {
    const ceiling = combustionCeiling(chart.planets[p]);
    run.state[p].affliction = condition === "clean" ? 0
      : condition === "near combustion" ? ceiling - 1
      : condition === "one lit" && i > 0 ? ceiling
      : Math.min(ceiling - 12, 6 + i * 6);
  }
  run.encounter = beginNarrativeEncounter({ run, house: scene.house, scenarioId: scene.scenarioId });
  return run;
}
