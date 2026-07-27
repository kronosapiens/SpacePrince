import { PLANETS } from "./data";
import type { Chart, PlanetName, PlanetPlacement, PlanetState, SideState } from "./types";

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
 * Combustion is derived, never stored (STATE.md): affliction caps at the
 * ceiling and a planet combusts the moment it reaches it (MECHANICS.md §10),
 * so a planet is combusted exactly when its affliction holds at the ceiling.
 * The one predicate every combusted-check goes through.
 */
export function isCombusted(placement: PlanetPlacement, state: PlanetState): boolean {
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
  if (amount <= 0 || isCombusted(placement, state)) return false;
  return state.affliction + amount >= combustionCeiling(placement);
}

/** The planets combusted in `after` but not in `before` — the diff the
 *  outcome records and the resolution flashes read. */
export function newlyCombusted(chart: Chart, before: SideState, after: SideState): PlanetName[] {
  return PLANETS.filter(
    (p) => isCombusted(chart.planets[p], after[p]) && !isCombusted(chart.planets[p], before[p]),
  );
}

/**
 * Uncombust (MECHANICS.md §10) — the only way back, and it never happens in
 * combat. The map-boundary fortune roll and the narrative uncombust rites both
 * land here: the planet returns at half its ceiling — back, but scarred.
 */
export function uncombust(placement: PlanetPlacement, state: PlanetState): void {
  state.affliction = combustionCeiling(placement) / 2;
}
