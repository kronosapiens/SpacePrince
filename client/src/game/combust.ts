import { PLANETS } from "./data";
import { getEffectiveStatsFromPlacement } from "./relational";
import type { Chart, PlanetName, PlanetPlacement, PlanetState, SideState } from "./types";

/**
 * Remaining Resolve (MECHANICS.md §10) — what a planet has left: its Resolve
 * less the tension on it. Resolve is the effective stat, base plus placement
 * bonuses and the run's gains, in the same units as tension.
 */
export function remainingResolve(placement: PlanetPlacement, state: PlanetState): number {
  return getEffectiveStatsFromPlacement(placement).resolve - state.tension;
}

/**
 * Combustion is derived, never stored (STATE.md): tension caps at Resolve
 * and a planet combusts the moment it reaches it (MECHANICS.md §10),
 * so a planet is combusted exactly when its tension holds at its Resolve.
 * The one predicate every combusted-check goes through.
 */
export function isCombusted(placement: PlanetPlacement, state: PlanetState): boolean {
  return state.tension >= getEffectiveStatsFromPlacement(placement).resolve;
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
  return state.tension + amount >= getEffectiveStatsFromPlacement(placement).resolve;
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
 * relational. The map-boundary fortune roll and the narrative uncombust rites both
 * land here: the planet returns at half its Resolve — back, but scarred.
 */
export function uncombust(placement: PlanetPlacement, state: PlanetState): void {
  state.tension = getEffectiveStatsFromPlacement(placement).resolve / 2;
}
