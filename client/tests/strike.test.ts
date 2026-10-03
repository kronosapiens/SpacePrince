import { describe, expect, it } from "vitest";
import { PLANET_REGISTER, strikeMidi } from "@/audio/pitches";
import { PLANETS } from "@/game/data";
import type { PlanetName } from "@/game/types";

/** The struck planet's semitone offset from the shared tonic. */
function offset(ruler: PlanetName, target: PlanetName): number {
  return strikeMidi(ruler, target) - PLANET_REGISTER;
}

describe("current planet note assignments (MUSIC.md)", () => {
  it("keeps Sun on the tonic under every ruler", () => {
    for (const ruler of PLANETS) expect(offset(ruler, "Sun"), `under ${ruler}`).toBe(0);
  });

  it("voices Saturn's fifth below the tonic, lowered under its own mode", () => {
    for (const ruler of PLANETS) {
      expect(offset(ruler, "Saturn"), `under ${ruler}`).toBe(ruler === "Saturn" ? -6 : -5);
    }
  });

  it("raises Moon's fourth only under Jupiter", () => {
    for (const ruler of PLANETS) {
      expect(offset(ruler, "Moon"), `under ${ruler}`).toBe(ruler === "Jupiter" ? 6 : 5);
    }
  });

  it("gives Mercury a major third under the bright rulers and minor under the dark", () => {
    const bright: PlanetName[] = ["Jupiter", "Sun", "Venus"];
    for (const ruler of PLANETS) {
      expect(offset(ruler, "Mercury"), `under ${ruler}`).toBe(bright.includes(ruler) ? 4 : 3);
    }
  });

  it("voices Mars's seventh below the tonic, major under Jupiter and Sun", () => {
    const major: PlanetName[] = ["Jupiter", "Sun"];
    for (const ruler of PLANETS) {
      expect(offset(ruler, "Mars"), `under ${ruler}`).toBe(major.includes(ruler) ? -1 : -2);
    }
  });

  it("reverses the Macrobian ascent within one octave with three notes on each side of D5", () => {
    const order = [...PLANETS].reverse();
    for (const ruler of PLANETS) {
      const notes = order.map((planet) => strikeMidi(ruler, planet));
      expect(notes[3], `Sun under ${ruler}`).toBe(74);
      for (let i = 1; i < notes.length; i++) {
        expect(notes[i], `${order[i]} under ${ruler}`).toBeGreaterThan(notes[i - 1]!);
      }
      expect(notes[6]! - notes[0]!, `span under ${ruler}`).toBeLessThan(12);
    }
  });
});
