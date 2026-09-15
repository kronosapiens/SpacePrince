import { describe, expect, it } from "vitest";
import { THEMES, nameToMidi } from "@/audio/themes";
import { PLANET_MODE } from "@/audio/pitches";
import { PLANETS } from "@/game/data";

describe("themes", () => {
  it("every theme has finite positive tempo and loop length", () => {
    for (const [name, t] of Object.entries(THEMES)) {
      expect(Number.isFinite(t.bpm), `${name} tempo`).toBe(true);
      expect(t.bpm, `${name} tempo`).toBeGreaterThan(0);
      expect(Number.isFinite(t.beats), `${name} loop length`).toBe(true);
      expect(t.beats, `${name} loop length`).toBeGreaterThan(0);
    }
  });

  it("every note parses and sits inside its loop", () => {
    for (const [name, t] of Object.entries(THEMES)) {
      expect(t.bed.length, `${name} bed`).toBeGreaterThan(0);
      for (const layer of [t.bed, t.down, t.up]) {
        for (const note of layer) {
          expect(() => nameToMidi(note.n), `${name} ${note.n}`).not.toThrow();
          expect(note.t, `${name} note at ${note.t}`).toBeGreaterThanOrEqual(0);
          expect(note.t, `${name} note at ${note.t}`).toBeLessThan(t.beats);
          expect(note.d, `${name} ${note.n} duration`).toBeGreaterThan(0);
          expect(note.t + note.d, `${name} ${note.n} note end`).toBeLessThanOrEqual(t.beats);
          expect(note.v).toBeGreaterThan(0);
          expect(note.v).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("pitched layers stay in their planet's mode relative to D", () => {
    const perc = new Set(["kick", "snare", "hat"]);
    for (const p of PLANETS) {
      const t = THEMES[p];
      for (const note of [...t.bed, ...t.down, ...t.up]) {
        if (perc.has(note.role)) continue;
        const degree = ((nameToMidi(note.n) - nameToMidi("D4")) % 12 + 12) % 12;
        expect(PLANET_MODE[p], `${p} ${note.n} at beat ${note.t}`).toContain(degree);
      }
    }
  });

  it("the up layer carries percussion; the down layer carries none", () => {
    const perc = new Set(["kick", "snare", "hat"]);
    for (const p of PLANETS) {
      const t = THEMES[p];
      expect(t.up.some((n) => perc.has(n.role)), `${p} up`).toBe(true);
      expect(t.down.every((n) => !perc.has(n.role)), `${p} down`).toBe(true);
    }
  });

  it("nameToMidi matches known anchors", () => {
    expect(nameToMidi("D2")).toBe(38);
    expect(nameToMidi("D4")).toBe(62);
    expect(nameToMidi("Eb3")).toBe(51);
    expect(nameToMidi("F#5")).toBe(78);
  });
});
