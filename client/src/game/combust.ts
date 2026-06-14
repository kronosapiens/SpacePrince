import type { PlanetPlacement, PlanetState } from "./types";

/**
 * Combustion ceiling (MECHANICS.md §10) — the affliction a planet absorbs
 * before it goes out. Set by durability alone (core + sign buffs).
 *
 *   ceiling = durability × 20
 */
export function combustionCeiling(placement: PlanetPlacement): number {
  return (placement.base.durability + placement.buffs.durability) * 20;
}

/**
 * Deterministic combustion (MECHANICS.md §10): a planet combusts the moment its
 * affliction reaches the ceiling — no roll. Affliction below the ceiling is a
 * readable, recoverable margin; at the line, the candle goes out.
 */
export function shouldCombust(placement: PlanetPlacement, state: PlanetState): boolean {
  if (state.combusted) return false;
  if (state.affliction <= 0) return false;
  return state.affliction >= combustionCeiling(placement);
}

/** Sets `state.combusted` when the ceiling is reached; returns whether it just did. */
export function applyCombust(placement: PlanetPlacement, state: PlanetState): boolean {
  if (shouldCombust(placement, state)) {
    state.combusted = true;
    return true;
  }
  return false;
}
