import { getScenario, NARRATIVE_SCENARIOS } from "@/data/narrative-scenarios";
import { derivePlacements, runChart } from "@/game/chart";
import { combustionCeiling, isCombusted } from "@/game/combust";
import { PLANETS, SIGNS } from "@/game/data";
import { narrativeContext, previewOption, resolveNarrative, visibleOptions, type NarrativeScenario } from "@/game/narrative";
import type { PlanetName, Prince, Run } from "@/game/types";
import { unlockedPlanets } from "@/game/unlocks";
import { BASE_PRINCE, chartFor, stateFor, type Condition, type Occupancy } from "./narrative-catalogue-fixtures";

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
    run.state[planet].affliction = Math.min(96, combustionCeiling(chart.planets[planet]));
  }
  return { prince, run };
}

export function pilotMeasures(prince: Prince, run: Run) {
  const chart = runChart(prince.chart, run);
  const roster = unlockedPlanets(prince.numRelationalEncounters);
  const remaining = Object.fromEntries(roster.map((p) =>
    [p, Math.max(0, combustionCeiling(chart.planets[p]) - run.state[p].affliction)])) as Partial<Record<PlanetName, number>>;
  return {
    light: run.light,
    capacity: Object.values(remaining).reduce((sum, amount) => sum + amount, 0),
    remaining,
    lit: roster.filter((p) => !isCombusted(chart.planets[p], run.state[p])),
    gains: run.gains,
  };
}

export function pilotOutcomes(prince: Prince, run: Run, scene: NarrativeScenario) {
  const ctx = narrativeContext(prince, run, scene.house);
  const before = pilotMeasures(prince, run);
  return visibleOptions(run, ctx, scene).flatMap(({ option, selections }) => selections.map((selection) => {
    const preview = previewOption(run, ctx, option, selection);
    const next = resolveNarrative(run, prince, scene, option.id, selection);
    if (!preview.ok || !next) throw new Error(`Invalid pilot choice: ${scene.scenarioId}/${option.id}`);
    const after = pilotMeasures(prince, next);
    return {
      option, selection, preview: preview.success, next, after,
      harmless: after.light >= before.light && before.lit.every((p) => after.lit.includes(p)) &&
        Object.entries(before.remaining).every(([p, amount]) => after.remaining[p as PlanetName]! >= amount),
    };
  }));
}
