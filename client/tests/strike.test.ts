import { describe, expect, it } from "vitest";
import { PLANET_DEGREE, PLANET_MODE, SIGNATURES, strikeMidi } from "@/audio/signatures";
import { PLANETS } from "@/game/data";
import type { PlanetName } from "@/game/types";

/** The Ionian step pattern: intervals between consecutive degrees, with the
 *  octave closing the cycle. Rotating it is what makes the seven modes. */
const IONIAN_STEPS = PLANET_MODE.Sun.map(
  (offset, i) => (i === PLANET_MODE.Sun.length - 1 ? 12 : PLANET_MODE.Sun[i + 1]!) - offset,
);

function rotatedMode(degree: number): number[] {
  const out = [0];
  for (let i = 0; i < IONIAN_STEPS.length - 1; i++) {
    out.push(out[i]! + IONIAN_STEPS[(degree + i) % IONIAN_STEPS.length]!);
  }
  return out;
}

/** The struck planet's offset above its own tonic, under a given ruler. */
function offset(ruler: PlanetName, target: PlanetName): number {
  return strikeMidi(ruler, target) - SIGNATURES[target].root;
}

describe("the strike grid (MUSIC.md)", () => {
  it("each planet's mode is the collection rotated by its degree", () => {
    for (const p of PLANETS) {
      expect(rotatedMode(PLANET_DEGREE[p]), `${p} mode from degree ${PLANET_DEGREE[p]}`).toEqual([
        ...PLANET_MODE[p],
      ]);
    }
  });

  it("the Sun never bends", () => {
    for (const ruler of PLANETS) expect(offset(ruler, "Sun"), `under ${ruler}`).toBe(0);
  });

  it("Venus's fifth holds under every mode but Saturn's", () => {
    for (const ruler of PLANETS) {
      expect(offset(ruler, "Venus"), `under ${ruler}`).toBe(ruler === "Saturn" ? 6 : 7);
    }
  });

  it("Jupiter's fourth is raised only in his own row", () => {
    for (const ruler of PLANETS) {
      expect(offset(ruler, "Jupiter"), `under ${ruler}`).toBe(ruler === "Jupiter" ? 6 : 5);
    }
  });

  it("Mars's third is major under the bright rulers, minor under the dark", () => {
    const bright: PlanetName[] = ["Jupiter", "Sun", "Venus"];
    for (const ruler of PLANETS) {
      expect(offset(ruler, "Mars"), `under ${ruler}`).toBe(bright.includes(ruler) ? 4 : 3);
    }
  });

  it("Saturn sits on the seventh, major only under Jupiter and the Sun", () => {
    const major: PlanetName[] = ["Jupiter", "Sun"];
    for (const ruler of PLANETS) {
      expect(offset(ruler, "Saturn"), `under ${ruler}`).toBe(major.includes(ruler) ? 11 : 10);
    }
  });

  it("register follows the signature plan — Saturn on the floor, Mercury on top", () => {
    for (const ruler of PLANETS) {
      expect(strikeMidi(ruler, "Saturn"), `under ${ruler}`).toBeLessThan(
        strikeMidi(ruler, "Mercury"),
      );
    }
  });
});
