import { MACROBIAN_ORDER, MACROBIAN_THRESHOLDS } from "./data";
import type { PlanetName } from "./types";

/**
 * Macrobian ascent. Cumulative lifetime encounter count gates planet unlocks.
 * Encounter 1 → Moon. Encounter 2 → Mercury. 4 → Venus. 8 → Sun.
 * 16 → Mars. 32 → Jupiter. 64 → Saturn.
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
