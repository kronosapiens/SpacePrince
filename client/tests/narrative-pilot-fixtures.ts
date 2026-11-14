import { getScenario, NARRATIVE_SCENARIOS } from "@/data/narrative-scenarios";
import { derivePlacements } from "@/game/chart";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
import { PLANETS, SIGNS } from "@/game/data";
import type { NarrativeScenario } from "@/game/narrative";
import type { PlanetName, Prince, Run } from "@/game/types";
import { BASE_PRINCE, chartFor, stateFor, type Condition, type Occupancy } from "./narrative-catalogue-fixtures";

export { narrativeMeasures as pilotMeasures, narrativeOutcomes as pilotOutcomes } from "./narrative-catalogue-fixtures";

export const PILOT_SCENES = NARRATIVE_SCENARIOS.filter((scene) =>
  scene.house === 11 && scene.sign === "Gemini" || scene.house === 12 && scene.sign === "Cancer");

export interface PilotState {
  name: string;
  tier: number;
  condition: Condition;
  light: number;
  occupancy?: Occupancy;
  joy?: boolean;
}

export const PILOT_STATES: PilotState[] = [
  { name: "first-healthy-penniless", tier: 0, condition: "clean", light: 0 },
  { name: "first-near-combustion-penniless", tier: 0, condition: "near combustion", light: 0 },
  { name: "four-wounded-funded", tier: 4, condition: "injured", light: 120 },
  { name: "full-wounded-without-joy", tier: 32, condition: "injured", light: 120, joy: false },
  { name: "full-wounded-with-joy", tier: 32, condition: "injured", light: 120, joy: true },
  { name: "full-one-lit-penniless", tier: 32, condition: "one lit", light: 0 },
  { name: "full-near-combustion-penniless", tier: 32, condition: "near combustion", light: 0 },
  { name: "favorable-wounded-without-joy", tier: 32, condition: "injured", light: 120, occupancy: "favorable", joy: false },
  { name: "adverse-wounded-without-joy", tier: 32, condition: "injured", light: 120, occupancy: "adverse", joy: false },
];

/** One Leo-rising chart for both pools, using the catalogue's placement construction. */
export function pilotState(scene: NarrativeScenario, sample: PilotState): { prince: Prince; run: Run } {
  const occupancy = sample.occupancy ?? "empty";
  let chart = chartFor(getScenario("hidden-cancer-seawall"), occupancy);
  if (occupancy === "favorable" || occupancy === "adverse") {
    const longitudes = Object.fromEntries(PLANETS.map((p) =>
      [p, SIGNS.indexOf(chart.planets[p].sign) * 30 + 15])) as Record<PlanetName, number>;
    longitudes[occupancy === "favorable" ? "Mercury" : "Jupiter"] = 75;
    chart = { ...chart, ...derivePlacements({ longitudes, ascendantLongitude: 120, isDiurnal: true }) };
  }
  const prince = { ...BASE_PRINCE, chart, numRelationalEncounters: sample.tier };
  const run = stateFor(scene, prince, sample.condition, sample.light);
  if (sample.joy === false) for (const planet of ["Jupiter", "Saturn"] as const) {
    run.state[planet].tension = Math.min(96, getEffectiveStatsFromPlacement(chart.planets[planet]).resolve);
  }
  return { prince, run };
}
