import type { PlanetPlacement, PlanetState } from "./types";

/** Resolve (the combustion ceiling) per point of durability. Durability is a
 *  multiple of 12, so ceilings are multiples of 60 — the sexagesimal lattice
 *  (MECHANICS.md §10); the maximum, a fixed earth-sign Saturn, is 360. Kept as
 *  a named constant so the math, the spec, and any UI copy stay in sync. */
export const RESOLVE_PER_DURABILITY = 5;

/**
 * Combustion ceiling (MECHANICS.md §10) — the affliction a planet absorbs
 * before it goes out, surfaced in the UI as "Resolve". Set by durability alone
 * (core + sign buffs).
 *
 *   ceiling = durability × RESOLVE_PER_DURABILITY
 */
export function combustionCeiling(placement: PlanetPlacement): number {
  return (placement.base.durability + placement.buffs.durability) * RESOLVE_PER_DURABILITY;
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

/**
 * Would a direct blow of `amount` combust this planet? Drives the ambient
 * combust warning: choice-independent, so it can be shown before the player
 * picks — on their own candidates against the incoming blow, and on the
 * opponent's actor against the strongest answer.
 */
export function wouldCombust(
  placement: PlanetPlacement,
  state: PlanetState,
  amount: number,
): boolean {
  if (state.combusted || amount <= 0) return false;
  return state.affliction + amount >= combustionCeiling(placement);
}

/** Sets `state.combusted` when the ceiling is reached; returns whether it just did. */
export function applyCombust(placement: PlanetPlacement, state: PlanetState): boolean {
  if (shouldCombust(placement, state)) {
    state.combusted = true;
    return true;
  }
  return false;
}

/**
 * Uncombust (MECHANICS.md §10) — the only way back, and it never happens in
 * combat. The map-boundary fortune roll and the narrative uncombust rites both
 * land here: the planet returns at half its ceiling — back, but scarred.
 */
export function uncombust(placement: PlanetPlacement, state: PlanetState): void {
  state.combusted = false;
  state.affliction = combustionCeiling(placement) / 2;
}
