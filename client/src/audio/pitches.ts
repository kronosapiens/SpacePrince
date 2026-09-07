import type { PlanetName } from "@/game/types";

/** Mode per planet as semitone offsets from the shared D tonic (MUSIC.md table). */
export const PLANET_MODE: Record<PlanetName, readonly number[]> = {
  Jupiter: [0, 2, 4, 6, 7, 9, 11], // Lydian — the ♯4 reaches past its own boundary
  Sun: [0, 2, 4, 5, 7, 9, 11], // Ionian — the home key itself
  Venus: [0, 2, 4, 5, 7, 9, 10], // Mixolydian — major-lean with the ♭7 ache
  Mercury: [0, 2, 3, 5, 7, 9, 10], // Dorian — the palindrome mode, self-inverting
  Moon: [0, 2, 3, 5, 7, 8, 10], // Aeolian — nocturnal, reflective
  Mars: [0, 1, 3, 5, 7, 8, 10], // Phrygian — the ♭2 carries menace
  Saturn: [0, 1, 3, 5, 6, 8, 10], // Locrian — the ♭5 denies a stable home
};

/** D-octave MIDI anchors for event sounds (MUSIC.md, "The strike grid"). */
export const PLANET_REGISTER: Record<PlanetName, number> = {
  Sun: 62, // D4
  Moon: 62, // D4
  Mercury: 74, // D5
  Venus: 62, // D4
  Mars: 50, // D3
  Jupiter: 50, // D3
  Saturn: 38, // D2
};

/**
 * Degree per planet — where that planet's mode starts in the shared collection.
 * The seven modes are the seven rotations of one set of notes (Ionian from the
 * first, Dorian from the second, through Locrian from the seventh), so the
 * degree comes with the mode rather than being chosen.
 */
export const PLANET_DEGREE: Record<PlanetName, number> = {
  Sun: 0,
  Mercury: 1,
  Mars: 2,
  Jupiter: 3,
  Venus: 4,
  Moon: 5,
  Saturn: 6,
};

/** The struck planet's degree in the ruler's mode, at its own register. */
export function strikeMidi(ruler: PlanetName, target: PlanetName): number {
  return PLANET_REGISTER[target] + PLANET_MODE[ruler][PLANET_DEGREE[target]]!;
}
