import { chartRuler, seededChart } from "./chart";
import { NARRATIVE_NODE_PROB, PLANETS } from "./data";
import { hashString, mulberry32 } from "./rng";
import type { NodeContent, PlanetName } from "./types";

export interface RollNodeContentInput {
  rng: () => number;
  /** When > 0, force-narrative pulls (dev cheat). */
  forceNarrativeHouse?: number | null;
  /** When provided, skip narrative roll entirely (dev cheat or preview). */
  forceCombat?: boolean;
  /** Rulers eligible when this map is created. */
  combatRulers?: readonly PlanetName[];
}

export function rollNodeContent(input: RollNodeContentInput): NodeContent {
  const { rng, forceNarrativeHouse, forceCombat, combatRulers = PLANETS } = input;
  if (forceCombat) {
    return { kind: "combat", opponentSeed: rollOpponentSeed(rng, combatRulers) };
  }
  if (forceNarrativeHouse) {
    return { kind: "narrative", house: forceNarrativeHouse };
  }
  if (rng() < NARRATIVE_NODE_PROB) {
    return { kind: "narrative", house: 1 + Math.floor(rng() * 12) };
  }
  return { kind: "combat", opponentSeed: rollOpponentSeed(rng, combatRulers) };
}

function rollOpponentSeed(rng: () => number, combatRulers: readonly PlanetName[]): number {
  return eligibleOpponentSeed(Math.floor(rng() * 2 ** 31), combatRulers);
}

/** Deterministically reject generated charts until their ruler is eligible. */
export function eligibleOpponentSeed(
  opponentSeed: number,
  combatRulers: readonly PlanetName[],
): number {
  if (combatRulers.length === 0) {
    throw new Error("eligibleOpponentSeed requires at least one ruler");
  }
  const eligible = new Set(combatRulers);
  const retry = mulberry32(hashString(`${opponentSeed}_encounter_ruler`));
  let candidate = opponentSeed;
  while (!eligible.has(chartRuler(seededChart(candidate, "")))) {
    candidate = Math.floor(retry() * 2 ** 31);
  }
  return candidate;
}
