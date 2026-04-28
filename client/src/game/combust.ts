import { DIGNITY_COMBUST_FACTOR } from "./data";
import type { PlanetPlacement, PlanetState } from "./types";

export function combustionProbability(placement: PlanetPlacement, state: PlanetState): number {
  if (state.combusted) return 0;
  if (state.affliction <= 0) return 0;
  const durability = placement.base.durability + placement.buffs.durability;
  const threshold = durability * 10;
  const ratio = threshold === 0 ? 1 : Math.min(1, state.affliction / threshold);
  return Math.max(0, Math.min(0.95, ratio * DIGNITY_COMBUST_FACTOR[placement.dignity]));
}

/** Returns true and mutates state.combusted if the roll succeeds. */
export function maybeCombust(
  placement: PlanetPlacement,
  state: PlanetState,
  rng: () => number,
): boolean {
  const p = combustionProbability(placement, state);
  if (p <= 0) return false;
  if (rng() < p) {
    state.combusted = true;
    return true;
  }
  return false;
}
