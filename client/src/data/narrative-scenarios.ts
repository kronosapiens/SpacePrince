import type { NarrativeScenario } from "@/game/narrative";
import type { SignName } from "@/game/types";
import { HOUSE_01_SCENARIOS } from "./narrative/house-01";
import { HOUSE_02_SCENARIOS } from "./narrative/house-02";
import { HOUSE_03_SCENARIOS } from "./narrative/house-03";
import { HOUSE_04_SCENARIOS } from "./narrative/house-04";
import { HOUSE_05_SCENARIOS } from "./narrative/house-05";
import { HOUSE_06_SCENARIOS } from "./narrative/house-06";
import { HOUSE_07_SCENARIOS } from "./narrative/house-07";
import { HOUSE_08_SCENARIOS } from "./narrative/house-08";
import { HOUSE_09_SCENARIOS } from "./narrative/house-09";
import { HOUSE_10_SCENARIOS } from "./narrative/house-10";
import { HOUSE_11_SCENARIOS } from "./narrative/house-11";
import { HOUSE_12_SCENARIOS } from "./narrative/house-12";

export const NARRATIVE_SCENARIOS: NarrativeScenario[] = [
  ...HOUSE_01_SCENARIOS,
  ...HOUSE_02_SCENARIOS,
  ...HOUSE_03_SCENARIOS,
  ...HOUSE_04_SCENARIOS,
  ...HOUSE_05_SCENARIOS,
  ...HOUSE_06_SCENARIOS,
  ...HOUSE_07_SCENARIOS,
  ...HOUSE_08_SCENARIOS,
  ...HOUSE_09_SCENARIOS,
  ...HOUSE_10_SCENARIOS,
  ...HOUSE_11_SCENARIOS,
  ...HOUSE_12_SCENARIOS,
];

export const SCENARIOS_BY_HOUSE: Record<number, NarrativeScenario[]> = {};
for (const scenario of NARRATIVE_SCENARIOS) (SCENARIOS_BY_HOUSE[scenario.house] ??= []).push(scenario);
const SCENARIOS_BY_ID = new Map(NARRATIVE_SCENARIOS.map((scenario) => [scenario.scenarioId, scenario]));

export function getScenario(scenarioId: string): NarrativeScenario {
  const scenario = SCENARIOS_BY_ID.get(scenarioId);
  if (!scenario) throw new Error(`No scenario ${scenarioId}`);
  return scenario;
}

/** Exhaust the house's matching-sign scenes before repeating one. */
export function pickScenario(house: number, sign: SignName, seenScenarioIds: readonly string[], rng: () => number): NarrativeScenario {
  const matching = (SCENARIOS_BY_HOUSE[house] ?? []).filter((scenario) => scenario.sign === sign);
  const unseen = matching.filter((scenario) => !seenScenarioIds.includes(scenario.scenarioId));
  const pool = unseen.length ? unseen : matching;
  if (!pool.length) throw new Error(`No scenarios for house ${house} in ${sign}`);
  return pool[Math.floor(rng() * pool.length)]!;
}
