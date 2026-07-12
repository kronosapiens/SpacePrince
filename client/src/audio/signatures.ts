import type { PlanetName } from "@/game/types";

/**
 * Per-planet tonal signatures (VIBES.md §Sound Design, MUSIC.md).
 * "Not a melody, but a texture" — the signature is the germ of the eventual
 * theme (MUSIC.md §Architecture): one Saturn, used as ambient signature now
 * and as full score later.
 *
 * Cohesion model (MUSIC.md §Cohesion): one home pitch (D), each planet a
 * parallel mode on that tonic. The mode is the fingerprint; register,
 * envelope, and gesture carry the character.
 */

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

/** One note of a signature gesture. `deg` indexes the planet's mode
 *  (values ≥ 7 wrap up an octave); times/durations in seconds. */
export interface GestureNote {
  deg: number;
  at: number;
  dur: number;
  vel: number;
}

export type SignatureVoice = "tone" | "pluck" | "strike" | "pad";

/** The planet's ambient figure: a quiet note (or in-mode dyad) drawn from a
 *  small degree pool every `periodS` seconds (±25% humanized). Periods are
 *  deliberately non-harmonic across planets so the bed never settles into a
 *  loop — the texture shifts continuously and thins as planets go dark. */
export interface BreathSpec {
  periodS: number;
  degs: readonly number[];
  dur: number;
  vel: number;
  /** Sound the drawn degree with its in-mode third above — a warm dyad. */
  dyad?: boolean;
}

export interface Signature {
  /** MIDI note of the planet's tonic register (D across octaves — D2 = 38). */
  root: number;
  voice: SignatureVoice;
  /** Amplitude envelope attack, seconds — Saturn arrives slowly, Mars at once. */
  attack: number;
  release: number;
  gesture: readonly GestureNote[];
  breath: BreathSpec;
}

/**
 * Register plan (MUSIC.md §Cohesion): Saturn owns the floor, Mercury sparkles
 * on top, the luminaries and benefics hold the middle.
 */
export const SIGNATURES: Record<PlanetName, Signature> = {
  Sun: {
    // "A single clear tone, sustained and centered."
    root: 62, // D4
    voice: "tone",
    attack: 0.04,
    release: 0.8,
    gesture: [{ deg: 0, at: 0, dur: 1.3, vel: 0.5 }],
    breath: { periodS: 13, degs: [0, 4], dur: 3, vel: 0.16 },
  },
  Moon: {
    // "Soft, layered, slightly distant — heard through water." 5–3–1 nocturne descent.
    root: 62, // D4
    voice: "tone",
    attack: 0.14,
    release: 1.1,
    gesture: [
      { deg: 4, at: 0, dur: 0.8, vel: 0.32 },
      { deg: 2, at: 0.34, dur: 0.8, vel: 0.28 },
      { deg: 0, at: 0.72, dur: 1.3, vel: 0.3 },
    ],
    breath: { periodS: 9, degs: [4, 2, 0, 5], dur: 2.5, vel: 0.14 },
  },
  Mercury: {
    // "Quick, metallic, slightly dissonant — a plucked note that doesn't quite settle."
    root: 74, // D5
    voice: "pluck",
    attack: 0.005,
    release: 0.3,
    gesture: [
      { deg: 0, at: 0, dur: 0.14, vel: 0.5 },
      { deg: 3, at: 0.09, dur: 0.14, vel: 0.4 },
      { deg: 5, at: 0.18, dur: 0.4, vel: 0.45 }, // ends on the 6th — unresolved
    ],
    breath: { periodS: 8, degs: [1, 5, 3, 8], dur: 0.35, vel: 0.18 },
  },
  Venus: {
    // "Warm, harmonic, close — a chord rather than a line." The ♭7 sits quiet inside.
    root: 62, // D4
    voice: "pad",
    attack: 0.08,
    release: 1.0,
    gesture: [
      { deg: 0, at: 0, dur: 1.1, vel: 0.34 },
      { deg: 2, at: 0, dur: 1.1, vel: 0.3 },
      { deg: 4, at: 0, dur: 1.1, vel: 0.3 },
      { deg: 6, at: 0.05, dur: 1.0, vel: 0.16 },
    ],
    breath: { periodS: 12, degs: [0, 2, 4], dur: 3, vel: 0.12, dyad: true },
  },
  Mars: {
    // "Percussive, sharp, brief — a strike, not a tone." Root hit, ♭2 grace.
    root: 50, // D3
    voice: "strike",
    attack: 0.001,
    release: 0.2,
    gesture: [
      { deg: 0, at: 0, dur: 0.12, vel: 0.85 },
      { deg: 1, at: 0.07, dur: 0.1, vel: 0.4 },
    ],
    breath: { periodS: 15, degs: [0, 0, 1], dur: 0.15, vel: 0.12 },
  },
  Jupiter: {
    // "Resonant, wide, chordal — a low sustained harmony." The ♯11 opens the roof.
    root: 50, // D3
    voice: "pad",
    attack: 0.2,
    release: 1.4,
    gesture: [
      { deg: 0, at: 0, dur: 1.5, vel: 0.4 },
      { deg: 4, at: 0, dur: 1.5, vel: 0.34 },
      { deg: 10, at: 0.12, dur: 1.4, vel: 0.26 }, // ♯4 up the octave
    ],
    breath: { periodS: 16, degs: [0, 4, 3], dur: 4, vel: 0.13, dyad: true },
  },
  Saturn: {
    // "Low, sustained, mineral — the lowest note, held." A tritone shadow above it.
    root: 38, // D2
    voice: "tone",
    attack: 0.4,
    release: 1.6,
    gesture: [
      { deg: 0, at: 0, dur: 2.0, vel: 0.5 },
      { deg: 4, at: 0.5, dur: 1.4, vel: 0.18 }, // Locrian ♭5 — borrowed ground
    ],
    breath: { periodS: 19, degs: [0, 0, 4], dur: 5, vel: 0.15 },
  },
};

/** Resolve a gesture degree to a MIDI note for the planet. */
export function gestureMidi(planet: PlanetName, deg: number): number {
  const mode = PLANET_MODE[planet];
  const octave = Math.floor(deg / mode.length);
  const step = mode[deg % mode.length]!;
  return SIGNATURES[planet].root + step + octave * 12;
}
