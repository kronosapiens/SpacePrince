import { describe, expect, it } from "vitest";
import { afflictedSideState } from "@/game/encounter";
import { seededChart } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { mulberry32 } from "@/game/rng";
import { PLANETS } from "@/game/data";

describe("afflictedSideState — opponent spawn affliction (MECHANICS §11)", () => {
  it("rolls each fielded planet an integer below its ceiling; none combusted", () => {
    let low = false;
    let high = false;
    for (let seed = 1; seed <= 50; seed++) {
      const chart = seededChart(seed, "t");
      const state = afflictedSideState(chart, [...PLANETS], mulberry32(seed));
      for (const p of PLANETS) {
        const ceiling = combustionCeiling(chart.planets[p]);
        expect(Number.isInteger(state[p].affliction)).toBe(true);
        expect(state[p].affliction).toBeGreaterThanOrEqual(0);
        expect(state[p].affliction).toBeLessThan(ceiling);
        const frac = state[p].affliction / ceiling;
        if (frac < 0.2) low = true;
        if (frac > 0.8) high = true;
      }
    }
    // Uniform across the range, not banded: both tails show up across seeds.
    expect(low).toBe(true);
    expect(high).toBe(true);
  });

  it("seeds only the fielded roster", () => {
    const chart = seededChart(7, "t");
    const state = afflictedSideState(chart, ["Moon"], mulberry32(7));
    expect(state.Moon.affliction).toBeLessThan(combustionCeiling(chart.planets.Moon));
    for (const p of PLANETS.filter((x) => x !== "Moon")) {
      expect(state[p].affliction).toBe(0);
    }
  });
});
