import { DIGNITY_DURABILITY_MULT } from "./data";
import type { PlanetPlacement, PlanetState } from "./types";

/**
 * Combustion probability (MECHANICS.md §10). Affliction fills toward a
 * combustion ceiling of durability × 20, scaled by dignity; the fraction
 * filled reads directly as the per-hit probability.
 *
 *   ceiling = durability × 20 × dignityMult
 *   p       = min(1, affliction / ceiling)
 */
export function combustionProbability(placement: PlanetPlacement, state: PlanetState): number {
  if (state.combusted) return 0;
  if (state.affliction <= 0) return 0;
  const durability = placement.base.durability + placement.buffs.durability;
  const ceiling = durability * 20 * DIGNITY_DURABILITY_MULT[placement.dignity];
  return Math.min(1, state.affliction / ceiling);
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
