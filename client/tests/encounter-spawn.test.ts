import { describe, expect, it } from "vitest";
import { afflictedSideState } from "@/game/encounter";
import { seededChart } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { mulberry32 } from "@/game/rng";
import { PLANETS } from "@/game/data";

// Band edges with slack for integer rounding: round(ceiling × frac) can move
// the realized fraction by up to 0.5/ceiling (±0.025 at the smallest ceiling
// of 20). The bands (0–25% light, 40–65% heavy) stay disjoint under that.
const LIGHT_MAX = 0.28;
const HEAVY_MIN = 0.37;
const HEAVY_MAX = 0.68;

describe("afflictedSideState — opponent spawn affliction (MECHANICS §11)", () => {
  it("seeds exactly one heavy planet, the rest light, none combusted", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const chart = seededChart(seed, "t");
      const state = afflictedSideState(chart, [...PLANETS], mulberry32(seed));
      let heavies = 0;
      for (const p of PLANETS) {
        const frac = state[p].affliction / combustionCeiling(chart.planets[p]);
        expect(state[p].combusted).toBe(false);
        expect(frac).toBeLessThan(1);
        if (frac > LIGHT_MAX) {
          heavies++;
          expect(frac).toBeGreaterThanOrEqual(HEAVY_MIN);
          expect(frac).toBeLessThanOrEqual(HEAVY_MAX);
        }
      }
      expect(heavies).toBe(1);
    }
  });

  it("seeds only the fielded roster; a 1v1 roster makes its planet the heavy one", () => {
    const chart = seededChart(7, "t");
    const state = afflictedSideState(chart, ["Moon"], mulberry32(7));
    const frac = state.Moon.affliction / combustionCeiling(chart.planets.Moon);
    expect(frac).toBeGreaterThanOrEqual(HEAVY_MIN);
    expect(frac).toBeLessThanOrEqual(HEAVY_MAX);
    for (const p of PLANETS.filter((x) => x !== "Moon")) {
      expect(state[p].affliction).toBe(0);
    }
  });
});
