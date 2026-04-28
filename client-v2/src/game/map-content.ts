import { NARRATIVE_NODE_PROB } from "./data";
import type { NodeContent } from "./types";

export interface RollNodeContentInput {
  rng: () => number;
  lastNarrativeHouse: number | null;
  /** When > 0, force-narrative pulls (dev cheat). */
  forceNarrativeHouse?: number | null;
  /** When provided, skip narrative roll entirely (dev cheat or preview). */
  forceCombat?: boolean;
}

export function rollNodeContent(input: RollNodeContentInput): NodeContent {
  const { rng, lastNarrativeHouse, forceNarrativeHouse, forceCombat } = input;
  if (forceCombat) {
    return { kind: "combat", opponentSeed: Math.floor(rng() * 2 ** 31) };
  }
  if (forceNarrativeHouse) {
    return { kind: "narrative", house: forceNarrativeHouse };
  }
  if (rng() < NARRATIVE_NODE_PROB) {
    let house = 1 + Math.floor(rng() * 12);
    if (house === lastNarrativeHouse) {
      house = (house % 12) + 1;
    }
    return { kind: "narrative", house };
  }
  return { kind: "combat", opponentSeed: Math.floor(rng() * 2 ** 31) };
}
