import { MACROBIAN_ORDER, MACROBIAN_THRESHOLDS } from "./data";
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
  if (devUnlockAll) return [...MACROBIAN_ORDER];
  return MACROBIAN_ORDER.filter((_, i) => lifetimeCount >= MACROBIAN_THRESHOLDS[i]!);
}

/** Returns the planet that crosses a threshold from `prev` → `next`, or null. */
export function thresholdCrossedBy(prev: number, next: number): PlanetName | null {
  for (let i = 0; i < MACROBIAN_THRESHOLDS.length; i++) {
    const t = MACROBIAN_THRESHOLDS[i]!;
    if (prev < t && next >= t) return MACROBIAN_ORDER[i]!;
  }
  return null;
}
