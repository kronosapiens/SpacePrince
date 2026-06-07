import { DIGNITY_DURABILITY_MULT } from "./data";
import type { PlanetPlacement, PlanetState } from "./types";

/**
 * Combustion probability (MECHANICS.md §10). Effective durability, scaled by
 * dignity, offsets affliction; only the remainder ("functional affliction")
 * carries risk, read directly as a percent.
 *
 *   functional = max(0, affliction − durability × dignityMult)
 *   p          = min(1, functional / 100)
 */
export function combustionProbability(placement: PlanetPlacement, state: PlanetState): number {
  if (state.combusted) return 0;
  if (state.affliction <= 0) return 0;
  const durability = placement.base.durability + placement.buffs.durability;
  const offset = durability * DIGNITY_DURABILITY_MULT[placement.dignity];
  const functional = Math.max(0, state.affliction - offset);
  return Math.min(1, functional / 100);
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
