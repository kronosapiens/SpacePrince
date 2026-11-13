import { chartRuler, seededChart } from "./chart";
import { NARRATIVE_NODE_PROB, PLANETS } from "./data";
import { hashString, mulberry32 } from "./rng";
import type { NodeContent, PlanetName } from "./types";

export interface RollNodeContentInput {
  rng: () => number;
  /** When > 0, force-narrative pulls (dev cheat). */
  forceNarrativeHouse?: number | null;
  /** When provided, skip narrative roll entirely (dev cheat or preview). */
  forceRelational?: boolean;
}

export function rollNodeContent(input: RollNodeContentInput): NodeContent {
  const { rng, forceNarrativeHouse, forceRelational } = input;
  if (!forceRelational) {
    if (forceNarrativeHouse) return { kind: "narrative", house: forceNarrativeHouse };
    if (rng() < NARRATIVE_NODE_PROB) return { kind: "narrative", house: 1 + Math.floor(rng() * 12) };
  }
  return { kind: "relational", opponentSeed: Math.floor(rng() * 2 ** 31) };
}

/** The order of the seven planets that a relational node's seed fixes. */
export function rulerOrder(opponentSeed: number): PlanetName[] {
  const rng = mulberry32(hashString(`${opponentSeed}_ruler_order`));
  const order = [...PLANETS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

/** A seed's ruler: the first planet in its order that the player has unlocked. */
export function seedRuler(opponentSeed: number, unlocked: readonly PlanetName[]): PlanetName {
  const ruler = rulerOrder(opponentSeed).find((planet) => unlocked.includes(planet));
  if (!ruler) throw new Error("seedRuler requires at least one unlocked planet");
  return ruler;
}

/** The ruler the map shows for a relational node: the one its encounter
 *  started under, or before entry the one it would start under now. */
export function nodeRuler(
  content: Extract<NodeContent, { kind: "relational" }>,
  unlocked: readonly PlanetName[],
): PlanetName {
  return content.ruler ?? seedRuler(content.opponentSeed, unlocked);
}

/** Deterministically reject candidate seeds until the generated chart has this ruler. */
export function opponentSeedForRuler(opponentSeed: number, ruler: PlanetName): number {
  const retry = mulberry32(hashString(`${opponentSeed}_encounter_ruler`));
  let candidate = opponentSeed;
  while (chartRuler(seededChart(candidate, "")) !== ruler) {
    candidate = Math.floor(retry() * 2 ** 31);
  }
  return candidate;
}
