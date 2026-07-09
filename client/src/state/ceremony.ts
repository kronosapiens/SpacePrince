import { thresholdCrossedBy } from "@/game/unlocks";
import type { PlanetName } from "@/game/types";

/**
 * Unlock ceremony hand-off (MECHANICS §11.1, SCREENS §4.1): unlocks happen
 * *between* encounters, on the Map — when the player surfaces back from the
 * encounter that crossed a Macrobian threshold, the new planet emerges from
 * ghost on the chart anchor.
 *
 * Ephemeral by design: the pending marker is presentation state, not game
 * state — a reload skips the ceremony rather than replaying it (the unlock
 * itself is derived from `numEncounters` and loses nothing).
 */

let pendingUnlock: PlanetName | null = null;

/** Call when an encounter resolves, with the count *before* the increment. */
export function noteEncounterResolved(prevCount: number): void {
  const crossed = thresholdCrossedBy(prevCount, prevCount + 1);
  if (crossed) pendingUnlock = crossed;
}

/** Consume the pending unlock (Map screen, on surfacing). */
export function takePendingUnlock(): PlanetName | null {
  const p = pendingUnlock;
  pendingUnlock = null;
  return p;
}
