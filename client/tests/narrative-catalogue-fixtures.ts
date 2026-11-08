import { blankGains, blankSideState, derivePlacements, getDignity, runChart } from "@/game/chart";
import { combustionCeiling, isCombusted } from "@/game/combust";
import { PLANETS, SIGNS } from "@/game/data";
import { beginNarrativeEncounter } from "@/game/encounter";
import { narrativeContext, previewOption, resolveNarrative, visibleOptions, type NarrativeScenario } from "@/game/narrative";
import { beginRun } from "@/game/run";
import type { PlanetName, Prince, Run } from "@/game/types";
import { unlockedPlanets } from "@/game/unlocks";
import { createStubPrince } from "./fixtures";

export const BASE_PRINCE = createStubPrince();
const BASE_RUN = beginRun(BASE_PRINCE.chart, 42, 64);
export type Occupancy = "empty" | "favorable" | "adverse" | "neutral" | "balanced";
export type Condition = "clean" | "injured" | "near combustion" | "one lit";

export const CATALOGUE_STATES = [
  { name: "first-healthy-penniless", tier: 0, condition: "clean", light: 0, occupancy: "empty" },
  { name: "first-near-combustion-penniless", tier: 0, condition: "near combustion", light: 0, occupancy: "empty" },
  { name: "four-wounded-funded", tier: 4, condition: "injured", light: 120, occupancy: "empty" },
  { name: "full-healthy-funded", tier: 32, condition: "clean", light: 360, occupancy: "empty" },
  { name: "full-wounded-funded", tier: 32, condition: "injured", light: 360, occupancy: "empty" },
  { name: "full-near-combustion-penniless", tier: 32, condition: "near combustion", light: 0, occupancy: "empty" },
  { name: "full-one-lit-penniless", tier: 32, condition: "one lit", light: 0, occupancy: "empty" },
  { name: "favorable-wounded-funded", tier: 32, condition: "injured", light: 360, occupancy: "favorable" },
  { name: "adverse-wounded-funded", tier: 32, condition: "injured", light: 360, occupancy: "adverse" },
] as const;

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

export function catalogueState(scene: NarrativeScenario, sample: typeof CATALOGUE_STATES[number]) {
  const prince = { ...BASE_PRINCE, chart: chartFor(scene, sample.occupancy), numRelationalEncounters: sample.tier };
  return { prince, run: stateFor(scene, prince, sample.condition, sample.light) };
}

export function narrativeMeasures(prince: Prince, run: Run) {
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

export function narrativeOutcomes(prince: Prince, run: Run, scene: NarrativeScenario) {
  const ctx = narrativeContext(prince, run, scene.house);
  const before = narrativeMeasures(prince, run);
  return visibleOptions(run, ctx, scene).flatMap(({ option, selections }) => selections.map((selection) => {
    const preview = previewOption(run, ctx, option, selection);
    const next = resolveNarrative(run, prince, scene, option.id, selection);
    if (!preview.ok || !next) throw new Error(`Invalid narrative choice: ${scene.scenarioId}/${option.id}`);
    const after = narrativeMeasures(prince, next);
    return {
      option, selection, preview: preview.success, next, after,
      harmless: after.light >= before.light && before.lit.every((p) => after.lit.includes(p)) &&
        Object.entries(before.remaining).every(([p, amount]) => after.remaining[p as PlanetName]! >= amount),
    };
  }));
}
