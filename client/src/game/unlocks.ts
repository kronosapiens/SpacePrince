import { PLANETS, UNLOCK_THRESHOLDS } from "./data";
import type { PlanetName } from "./types";

/**
 * Macrobian ascent. Cumulative lifetime encounter count gates planet unlocks.
 * The Moon is present from the first encounter (threshold 0); each subsequent
 * planet unlocks at 2^i encounters: Mercury 1, Venus 2, Sun 4, Mars 8,
 * Jupiter 16, Saturn 32.
 */
export function unlockedPlanets(
  lifetimeCount: number,
  devUnlockAll = false,
): PlanetName[] {
  if (devUnlockAll) return [...PLANETS];
  return PLANETS.filter((_, i) => lifetimeCount >= UNLOCK_THRESHOLDS[i]!);
}

/** Returns the planet that crosses a threshold from `prev` → `next`, or null. */
export function thresholdCrossedBy(prev: number, next: number): PlanetName | null {
  for (let i = 0; i < UNLOCK_THRESHOLDS.length; i++) {
    const t = UNLOCK_THRESHOLDS[i]!;
    if (prev < t && next >= t) return PLANETS[i]!;
  }
  return null;
}
