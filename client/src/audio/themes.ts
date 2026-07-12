import type { PlanetName } from "@/game/types";

/**
 * Seven planet themes (MUSIC.md), developed from the MIDI sketches in
 * spec/design/music-sketches/ — the sketch material is the bed; the down and
 * up layers are new, written for vertical mixing (the FTL model): all layers
 * run in sync, and the surface decides the mix — the map breathes the down
 * layer in, combat the up layer.
 *
 *   bed  — the theme's identity: harmony + motif. Present in every mix.
 *   down — sparse figuration (slow arps, soft counterlines). Map register.
 *   up   — percussion + drive. Combat register.
 *
 * All themes share the D tonic (MUSIC.md §Cohesion); mode is the fingerprint,
 * meter the personality. Venus and Moon had no sketch — composed here in
 * their committed modes (Mixolydian warmth, Aeolian nocturne).
 */

export type ThemeRole = "pad" | "lead" | "bass" | "arp" | "kick" | "snare" | "hat";

export interface ThemeNote {
  /** Beat position (quarter-note beats from loop start). */
  t: number;
  /** Note name ("Eb3") — percussion roles ignore pitch except kick. */
  n: string;
  /** Duration in beats. */
  d: number;
  /** Velocity 0..1. */
  v: number;
  role: ThemeRole;
}

export interface ThemeSpec {
  bpm: number;
  /** Loop length in beats. */
  beats: number;
  bed: ThemeNote[];
  down: ThemeNote[];
  up: ThemeNote[];
}

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function nameToMidi(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  const acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  return LETTER[m[1]!]! + acc + (Number(m[3]) + 1) * 12;
}

// ── tiny builders ───────────────────────────────────────────────────────────

const N = (role: ThemeRole, t: number, n: string, d: number, v: number): ThemeNote => ({
  t, n, d, v, role,
});

/** A chord: several simultaneous pad notes. */
function chord(t: number, notes: string[], d: number, v: number): ThemeNote[] {
  return notes.map((n) => N("pad", t, n, d, v));
}

/** A melodic line from [beat, note, dur] triples. */
function line(role: ThemeRole, v: number, steps: Array<[number, string, number]>): ThemeNote[] {
  return steps.map(([t, n, d]) => N(role, t, n, d, v));
}

/** Repeat a one-cycle pattern across the loop. */
function every(cycle: number, until: number, notes: ThemeNote[]): ThemeNote[] {
  const out: ThemeNote[] = [];
  for (let base = 0; base < until; base += cycle) {
    for (const note of notes) {
      if (base + note.t < until) out.push({ ...note, t: base + note.t });
    }
  }
  return out;
}

// ── Jupiter · Lydian · 3/4 · 96 — broad, the ♯4 reaching (sketch 01) ───────

const jupiter: ThemeSpec = {
  bpm: 96,
  beats: 48, // sketch's 8 bars, then the lead answers an octave higher
  bed: [
    // Pad: I | II (the Lydian brightness) | V | I | II | iii | V | I — ×2
    ...every(24, 48, [
      ...chord(0, ["D3", "F#3", "A3"], 3, 0.4),
      ...chord(3, ["E3", "G#3", "B3"], 3, 0.4),
      ...chord(6, ["A3", "C#4", "E4"], 3, 0.4),
      ...chord(9, ["D3", "F#3", "A3"], 3, 0.4),
      ...chord(12, ["E3", "G#3", "B3"], 3, 0.4),
      ...chord(15, ["F#3", "A3", "C#4"], 3, 0.4),
      ...chord(18, ["A3", "C#4", "E4"], 3, 0.4),
      ...chord(21, ["D3", "F#3", "A3"], 3, 0.4),
    ]),
    // Horn line (sketch), answered up the octave on the repeat.
    ...line("lead", 0.5, [
      [0, "A4", 2], [2, "F#4", 1], [3, "G#4", 3], [6, "A4", 2], [8, "B4", 1], [9, "A4", 3],
      [12, "B4", 2], [14, "C#5", 1], [15, "A4", 3], [18, "G#4", 2], [20, "E4", 1], [21, "D5", 3],
    ]),
    ...line("lead", 0.42, [
      [24, "A5", 2], [26, "F#5", 1], [27, "G#5", 3], [30, "A5", 2], [32, "B5", 1], [33, "A5", 3],
      [36, "B5", 2], [38, "C#6", 1], [39, "A5", 3], [42, "G#5", 2], [44, "E5", 1], [45, "D6", 3],
    ]),
  ],
  down: every(6, 48, [
    // Slow broken chord, one arc per two bars.
    N("arp", 0, "D4", 0.9, 0.3), N("arp", 1, "A4", 0.9, 0.26),
    N("arp", 2, "F#4", 0.9, 0.28), N("arp", 3, "G#4", 0.9, 0.24),
    N("arp", 4, "A4", 1.9, 0.26),
  ]),
  up: [
    ...every(3, 48, [
      N("kick", 0, "D2", 0.3, 0.7),
      N("hat", 1, "F#5", 0.1, 0.25), N("hat", 2, "F#5", 0.1, 0.25),
    ]),
    ...every(6, 48, [N("snare", 4, "D3", 0.2, 0.4)]),
    ...every(3, 48, [N("bass", 0, "D2", 1.4, 0.5), N("bass", 1.5, "A2", 1.4, 0.4)]),
  ],
};

// ── Sun · Ionian · 4/4 · 72 — the home key, centered (sketch 02) ────────────

const sun: ThemeSpec = {
  bpm: 72,
  beats: 32,
  bed: [
    // Pad: I | IV | I | V | I | IV | V | I (sketch).
    ...chord(0, ["D3", "F#3", "A3"], 4, 0.38), ...chord(4, ["G3", "B3", "D4"], 4, 0.38),
    ...chord(8, ["D3", "F#3", "A3"], 4, 0.38), ...chord(12, ["A3", "C#4", "E4"], 4, 0.38),
    ...chord(16, ["D3", "F#3", "A3"], 4, 0.38), ...chord(20, ["G3", "B3", "D4"], 4, 0.38),
    ...chord(24, ["A3", "C#4", "E4"], 4, 0.38), ...chord(28, ["D3", "F#3", "A3"], 4, 0.38),
    // Flute line (sketch, complete).
    ...line("lead", 0.46, [
      [0, "D4", 2], [2, "F#4", 1], [3, "A4", 1], [4, "B4", 2], [6, "A4", 1], [7, "G4", 1],
      [8, "F#4", 2], [10, "E4", 1], [11, "D4", 1], [12, "E4", 2], [14, "A4", 2],
      [16, "D4", 2], [18, "F#4", 1], [19, "A4", 1], [20, "B4", 2], [22, "A4", 1], [23, "G4", 1],
      [24, "A4", 2], [26, "C#5", 1], [27, "B4", 1], [28, "D4", 4],
    ]),
  ],
  down: every(4, 32, [
    N("arp", 0, "D5", 1.9, 0.22), N("arp", 2, "A4", 1.9, 0.2),
  ]),
  up: [
    ...every(4, 32, [
      N("kick", 0, "D2", 0.3, 0.6), N("kick", 2, "D2", 0.3, 0.45),
      N("hat", 1, "F#5", 0.1, 0.22), N("hat", 3, "F#5", 0.1, 0.22),
    ]),
    ...every(2, 32, [N("bass", 0, "D2", 0.9, 0.45), N("bass", 1, "A2", 0.9, 0.35)]),
  ],
};

// ── Mercury · Dorian · 6/8 · 138 — moto perpetuo, ends unsettled (sketch 03) ─

const mercury: ThemeSpec = {
  bpm: 138,
  beats: 48,
  bed: [
    // Harp engine: i broken | IV (the bright Dorian G-major) broken (sketch).
    ...every(6, 48, [
      N("arp", 0, "D3", 0.5, 0.34), N("arp", 0.5, "F3", 0.5, 0.34), N("arp", 1, "A3", 0.5, 0.34),
      N("arp", 1.5, "D4", 0.5, 0.34), N("arp", 2, "F3", 0.5, 0.34), N("arp", 2.5, "A3", 0.5, 0.34),
      N("arp", 3, "G3", 0.5, 0.34), N("arp", 3.5, "B3", 0.5, 0.34), N("arp", 4, "D4", 0.5, 0.34),
      N("arp", 4.5, "G4", 0.5, 0.34), N("arp", 5, "B3", 0.5, 0.34), N("arp", 5.5, "D4", 0.5, 0.34),
    ]),
    // The quick line that never lands (sketch): rises through i, leaves on E.
    // Three passes at pitch; the fourth answers an octave up.
    ...every(12, 36, [
      ...line("lead", 0.42, [
        [0, "D4", 0.5], [0.5, "F4", 0.5], [1, "A4", 0.5], [1.5, "B4", 0.5], [2, "A4", 0.5], [2.5, "F4", 0.5],
        [3, "G4", 0.5], [3.5, "B4", 0.5], [4, "D5", 0.5], [4.5, "B4", 0.5], [5, "G4", 0.5], [5.5, "E4", 0.5],
        [6, "D4", 0.5], [6.5, "F4", 0.5], [7, "A4", 0.5], [7.5, "B4", 0.5], [8, "A4", 0.5], [8.5, "F4", 0.5],
        [9, "G4", 0.5], [9.5, "B4", 0.5], [10, "D5", 0.5], [10.5, "B4", 0.5], [11, "G4", 0.5], [11.5, "E4", 0.5],
      ]),
    ]),
    ...line("lead", 0.36, [
      [36, "D5", 0.5], [36.5, "F5", 0.5], [37, "A5", 0.5], [37.5, "B5", 0.5], [38, "A5", 0.5], [38.5, "F5", 0.5],
      [39, "G5", 0.5], [39.5, "B5", 0.5], [40, "D6", 0.5], [40.5, "B5", 0.5], [41, "G5", 0.5], [41.5, "E5", 0.5],
      [42, "D5", 0.5], [42.5, "F5", 0.5], [43, "A5", 0.5], [43.5, "B5", 0.5], [44, "A5", 0.5], [44.5, "F5", 0.5],
      [45, "G5", 0.5], [45.5, "B5", 0.5], [46, "D6", 0.5], [46.5, "B5", 0.5], [47, "G5", 0.5], [47.5, "E5", 0.5],
    ]),
  ],
  down: every(6, 48, [
    N("arp", 0, "D5", 2.9, 0.2), N("arp", 3, "G5", 2.9, 0.18),
  ]),
  up: [
    ...every(1, 48, [N("hat", 0, "F#5", 0.08, 0.2)]),
    ...every(3, 48, [N("kick", 0, "D2", 0.2, 0.55), N("kick", 1.5, "D2", 0.2, 0.35)]),
    ...every(3, 48, [
      N("bass", 0, "D2", 0.45, 0.45), N("bass", 0.5, "D2", 0.45, 0.3),
      N("bass", 1.5, "G2", 0.45, 0.4), N("bass", 2, "G2", 0.45, 0.3),
    ]),
  ],
};

// ── Venus · Mixolydian · 3/4 · 72 — warm, the ♭7 ache (composed) ────────────

const venus: ThemeSpec = {
  bpm: 72,
  beats: 36,
  bed: [
    // I | ♭VII (the Mixolydian ache) | IV | I — ×2, close voicings.
    ...every(18, 36, [
      ...chord(0, ["D3", "F#3", "A3", "C4"], 6, 0.36), // I with the ♭7 folded in
      ...chord(6, ["C3", "E3", "G3"], 6, 0.36),
      ...chord(12, ["G3", "B3", "D4"], 3, 0.36),
      ...chord(15, ["D3", "F#3", "A3"], 3, 0.36),
    ]),
    ...line("lead", 0.4, [
      [0, "A4", 2], [2, "B4", 1], [3, "A4", 2], [5, "G4", 1],
      [6, "E4", 2], [8, "G4", 1], [9, "F#4", 3],
      [12, "G4", 2], [14, "B4", 1], [15, "A4", 3],
      [18, "A4", 2], [20, "B4", 1], [21, "C5", 3], // rises to the ♭7 —
      [24, "B4", 2], [26, "G4", 1], [27, "A4", 3], // — and eases back
      [30, "F#4", 2], [32, "E4", 1], [33, "D4", 3],
    ]),
  ],
  down: every(6, 36, [
    N("arp", 0, "D4", 1.4, 0.24), N("arp", 1.5, "A4", 1.4, 0.22),
    N("arp", 3, "F#4", 1.4, 0.22), N("arp", 4.5, "C5", 1.4, 0.18),
  ]),
  up: [
    ...every(3, 36, [
      N("kick", 0, "D2", 0.3, 0.5),
      N("hat", 1.5, "F#5", 0.1, 0.18),
    ]),
    ...every(6, 36, [N("bass", 0, "D2", 2.8, 0.4), N("bass", 3, "C3", 2.8, 0.32)]),
  ],
};

// ── Mars · Phrygian · 5/4 · 138 — the Holst hammer, ♭II stabs (sketch 04) ───

const mars: ThemeSpec = {
  bpm: 138,
  beats: 40,
  bed: [
    // Brass stabs (sketch): Dm two bars, ♭II (E♭ major) answer, Dm close.
    ...every(20, 40, [
      ...chord(0, ["D3", "F3", "A3"], 1.75, 0.5),
      ...chord(3, ["D3", "F3", "A3"], 1.75, 0.45),
      ...chord(5, ["D3", "F3", "A3"], 1.75, 0.5),
      ...chord(8, ["D3", "F3", "A3"], 1.75, 0.45),
      ...chord(10, ["Eb3", "G3", "Bb3"], 1.75, 0.5),
      ...chord(13, ["Eb3", "G3", "Bb3"], 1.75, 0.45),
      ...chord(15, ["D3", "F3", "A3"], 1.75, 0.5),
      ...chord(18, ["D3", "F3", "A3"], 1.75, 0.45),
    ]),
    // The two-note verdict at each phrase end (sketch): ♭2 falling to 1.
    ...every(10, 40, [...line("lead", 0.55, [[8, "Eb4", 1], [9, "D4", 1]])]),
  ],
  down: every(5, 40, [
    // The ostinato at half presence — the war heard from the map.
    N("arp", 0, "D3", 0.7, 0.26), N("arp", 2, "Eb3", 0.7, 0.22), N("arp", 3, "D3", 0.7, 0.24),
  ]),
  up: [
    // Full 5/4 ostinato (sketch): D D E♭ D D, hammered.
    ...every(5, 40, [
      N("bass", 0, "D2", 0.75, 0.6), N("bass", 1, "D2", 0.75, 0.6),
      N("bass", 2, "Eb2", 0.75, 0.65), N("bass", 3, "D2", 0.75, 0.6), N("bass", 4, "D2", 0.75, 0.6),
    ]),
    // Drums (sketch): hat every beat; kick on the stab rhythm; snare with the ♭2.
    ...every(1, 40, [N("hat", 0, "F#5", 0.08, 0.22)]),
    ...every(10, 40, [
      N("kick", 0, "C2", 0.3, 0.75), N("kick", 3, "C2", 0.3, 0.6),
      N("kick", 5, "C2", 0.3, 0.7), N("kick", 8, "C2", 0.3, 0.6),
      N("snare", 2, "D3", 0.2, 0.55), N("snare", 7, "D3", 0.2, 0.5),
    ]),
  ],
};

// ── Moon · Aeolian · 6/8 · 63 — nocturne, half-lit (composed) ───────────────

const moon: ThemeSpec = {
  bpm: 63,
  beats: 24,
  bed: [
    // i | ♭VI | ♭VII | i — the nocturne wheel, low and close.
    ...chord(0, ["D3", "F3", "A3"], 6, 0.34),
    ...chord(6, ["Bb2", "D3", "F3"], 6, 0.34),
    ...chord(12, ["C3", "E3", "G3"], 6, 0.34),
    ...chord(18, ["D3", "F3", "A3"], 6, 0.34),
    // A sparse line that keeps returning to rest.
    ...line("lead", 0.36, [
      [1, "A4", 2], [4, "F4", 2], [7, "D4", 2], [10, "F4", 2],
      [13, "G4", 2], [16, "E4", 2], [19, "D4", 4],
    ]),
  ],
  down: every(6, 24, [
    N("arp", 0, "D4", 0.9, 0.24), N("arp", 1, "A4", 0.9, 0.2), N("arp", 2, "F4", 0.9, 0.22),
    N("arp", 3, "A4", 0.9, 0.2), N("arp", 4, "D5", 1.9, 0.18),
  ]),
  up: [
    ...every(6, 24, [
      N("kick", 0, "D2", 0.3, 0.45), N("kick", 3, "D2", 0.3, 0.3),
      N("hat", 1.5, "F#5", 0.1, 0.15), N("hat", 4.5, "F#5", 0.1, 0.15),
    ]),
    ...every(3, 24, [N("bass", 0, "D2", 1.4, 0.4)]),
  ],
};

// ── Saturn · Locrian · 4/4 · 50 — the toll, ♭II consolation (sketch 05) ─────

const saturn: ThemeSpec = {
  bpm: 50,
  beats: 24,
  bed: [
    // Half-diminished breath | E♭ consolation | back (sketch pad).
    ...chord(0, ["D3", "F3", "G#3", "C4"], 8, 0.34),
    ...chord(8, ["Eb3", "G3", "Bb3"], 8, 0.34),
    ...chord(16, ["D3", "F3", "G#3", "C4"], 8, 0.34),
    // The toll (sketch): tonic against its own denied fifth.
    ...line("bass", 0.5, [
      [0, "D2", 4], [4, "G#2", 4], [8, "D2", 4], [12, "G#2", 4], [16, "D2", 4], [20, "D2", 4],
    ]),
    // Falling strings (sketch): F → E♭ → D, twice.
    ...line("lead", 0.4, [
      [2, "F4", 2], [4, "Eb4", 4], [10, "D4", 2],
      [16, "F4", 2], [18, "Eb4", 2], [20, "D4", 4],
    ]),
  ],
  down: every(8, 24, [
    N("arp", 0, "D4", 3.8, 0.18), N("arp", 4, "G#4", 3.8, 0.15),
  ]),
  up: [
    ...every(4, 24, [
      N("kick", 0, "C2", 0.5, 0.6), N("kick", 2, "C2", 0.5, 0.4),
      N("snare", 3, "D3", 0.3, 0.35),
    ]),
    ...every(2, 24, [N("bass", 0, "D1", 1.9, 0.4)]),
  ],
};

export const THEMES: Record<PlanetName, ThemeSpec> = {
  Sun: sun,
  Moon: moon,
  Mercury: mercury,
  Venus: venus,
  Mars: mars,
  Jupiter: jupiter,
  Saturn: saturn,
};
