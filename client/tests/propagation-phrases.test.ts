import { expect, it } from "vitest";
import { PHRASE_VARIANTS, phraseNoteName, propagationPhrase } from "@/audio/propagation-phrases";
import { strikeMidi } from "@/audio/pitches";
import { PLANETS } from "@/game/data";

it("preserves the initial hit, membership, and modal pitches for every possible propagation", () => {
  for (const ruler of PLANETS) for (const source of PLANETS) {
    const others = PLANETS.filter((planet) => planet !== source);
    for (let subset = 0; subset < 64; subset++) {
      const recipients = others.filter((_, index) => subset & (1 << index));
      for (const variant of PHRASE_VARIANTS) {
        const notes = propagationPhrase(ruler, source, recipients, variant);
        expect(notes[0]).toEqual({ planet: source, midi: strikeMidi(ruler, source), at: 0.2 });
        expect(notes.map((note) => note.planet).sort()).toEqual([source, ...recipients].sort());
        const pitches = notes.map((note) => note.midi);
        expect(Math.max(...pitches) - Math.min(...pitches)).toBeLessThan(12);
        for (const [index, note] of notes.entries()) {
          const original = strikeMidi(ruler, note.planet);
          expect(note.midi % 12).toBe(original % 12);
          expect(Math.abs(note.midi - original)).toBeLessThanOrEqual(12);
          expect(note.at).toBe(index === 0 ? 0.2 : 1.03 + (index - 1) * 0.52);
          if (variant === "Current order") expect(note.midi).toBe(original);
        }
        if (variant === "Current order") expect(notes.slice(1).map((note) => note.planet)).toEqual(recipients);
      }
    }
  }
});

it("gives the opening example distinct arpeggio, arch, and descending voicings", () => {
  const recipients = ["Mercury", "Saturn", "Venus"] as const;
  const phrase = (variant: typeof PHRASE_VARIANTS[number]) => propagationPhrase("Sun", "Sun", recipients, variant);
  expect(phrase("Current order").map(phraseNoteName)).toEqual(["D5", "F♯5", "E5", "A4"]);
  expect(phrase("Thirds").map((note) => note.planet)).toEqual(["Sun", "Mercury", "Saturn", "Venus"]);
  expect(phrase("Thirds").map(phraseNoteName)).toEqual(["D5", "F♯5", "A5", "E5"]);
  expect(phrase("Arch").map(phraseNoteName)).toEqual(["D5", "E5", "A5", "F♯5"]);
  expect(phrase("Falling thirds").map(phraseNoteName)).toEqual(["D5", "E4", "A4", "F♯4"]);
  expect(propagationPhrase("Jupiter", "Moon", [], "Thirds").map(phraseNoteName)).toEqual(["G♯5"]);
  expect(propagationPhrase("Saturn", "Saturn", [], "Thirds").map(phraseNoteName)).toEqual(["A♭4"]);
});
