import type { PlanetName } from "@/game/types";

/** Chosen mode per planet as semitone offsets from the shared D tonic. */
export const PLANET_MODE: Record<PlanetName, readonly number[]> = {
  Jupiter: [0, 2, 4, 6, 7, 9, 11], // Lydian — the ♯4 reaches past its own boundary
  Sun: [0, 2, 4, 5, 7, 9, 11], // Ionian — the home key itself
  Venus: [0, 2, 4, 5, 7, 9, 10], // Mixolydian — major-lean with the ♭7 ache
  Mercury: [0, 2, 3, 5, 7, 9, 10], // Dorian — the palindrome mode, self-inverting
  Moon: [0, 2, 3, 5, 7, 8, 10], // Aeolian — nocturnal, reflective
  Mars: [0, 1, 3, 5, 7, 8, 10], // Phrygian — the ♭2 carries menace
  Saturn: [0, 1, 3, 5, 6, 8, 10], // Locrian — the ♭5 denies a stable home
};

/** Shared D5 tonic at the center of the planetary event voices. */
export const PLANET_REGISTER = 74;

/**
 * Chosen degree per planet, stored zero-based and independent of PLANET_MODE.
 * Degrees 5–7 sound below the tonic, giving the low-to-high order
 * Saturn, Jupiter, Mars, Sun, Moon, Venus, Mercury.
 */
export const PLANET_DEGREE: Record<PlanetName, number> = {
  Saturn: 4,
  Jupiter: 5,
  Mars: 6,
  Sun: 0,
  Moon: 1,
  Venus: 2,
  Mercury: 3,
};

/** The struck planet's degree in the ruler's mode, voiced around Sun's D5. */
export function strikeMidi(ruler: PlanetName, target: PlanetName): number {
  const degree = PLANET_DEGREE[target];
  const octaveOffset = degree >= 4 ? -12 : 0;
  return PLANET_REGISTER + PLANET_MODE[ruler][degree]! + octaveOffset;
}
