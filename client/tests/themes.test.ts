import { describe, expect, it } from "vitest";
import { THEMES, nameToMidi } from "@/audio/themes";
import { PLANETS } from "@/game/data";

describe("planet themes (MUSIC.md)", () => {
  it("all seven planets have a theme in a loopable ~20-35s range", () => {
    for (const p of PLANETS) {
      const t = THEMES[p];
      const seconds = (t.beats * 60) / t.bpm;
      expect(seconds, `${p} loop length`).toBeGreaterThanOrEqual(15);
      expect(seconds, `${p} loop length`).toBeLessThanOrEqual(40);
    }
  });

  it("every note parses and sits inside its loop", () => {
    for (const p of PLANETS) {
      const t = THEMES[p];
      for (const layer of [t.bed, t.down, t.up]) {
        expect(layer.length).toBeGreaterThan(0);
        for (const note of layer) {
          expect(() => nameToMidi(note.n), `${p} ${note.n}`).not.toThrow();
          expect(note.t, `${p} note at ${note.t}`).toBeGreaterThanOrEqual(0);
          expect(note.t, `${p} note at ${note.t}`).toBeLessThan(t.beats);
          expect(note.v).toBeGreaterThan(0);
          expect(note.v).toBeLessThanOrEqual(1);
        }
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
