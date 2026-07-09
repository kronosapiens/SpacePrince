import { describe, expect, it } from "vitest";
import { afflictedSideState, mapAggression } from "@/game/encounter";
import { newMapState } from "@/game/run";
import { TERMINAL_NODE_ID } from "@/game/map-gen";
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

  it("bands tighten as maps progress: the map-7 pool is drier than map 1's", () => {
    const chart = seededChart(3, "t");
    const pool = (mapIdx: number) => {
      let total = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const s = afflictedSideState(chart, [...PLANETS], mulberry32(seed), { mapIdx });
        for (const p of PLANETS) total += s[p].affliction;
      }
      return total;
    };
    expect(pool(6)).toBeLessThan(pool(0) * 0.75);
    // Late-map fractions stay inside the tightened bands (heavy ≤ ~40%).
    const late = afflictedSideState(chart, [...PLANETS], mulberry32(9), { mapIdx: 6 });
    for (const p of PLANETS) {
      const frac = late[p].affliction / combustionCeiling(chart.planets[p]);
      expect(frac).toBeLessThanOrEqual(0.43);
    }
  });

  it("the L7 gate rolls its heavy planet at the top band regardless of map", () => {
    const chart = seededChart(3, "t");
    for (let seed = 1; seed <= 30; seed++) {
      const s = afflictedSideState(chart, [...PLANETS], mulberry32(seed), { mapIdx: 6, gate: true });
      const fracs = PLANETS.map((p) => s[p].affliction / combustionCeiling(chart.planets[p]));
      expect(Math.max(...fracs)).toBeGreaterThanOrEqual(0.52);
      expect(Math.max(...fracs)).toBeLessThanOrEqual(0.73);
    }
  });
});

describe("run difficulty shape", () => {
  it("aggression ramps 0 → 0.9 across the run's maps, +0.3 at the gate", () => {
    expect(mapAggression(0)).toBe(0);
    expect(mapAggression(6)).toBeCloseTo(0.9);
    expect(mapAggression(9)).toBeCloseTo(0.9); // clamped
    expect(mapAggression(0, true)).toBeCloseTo(0.3);
  });

  it("every map's terminal node is combat — the gate beat", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const map = newMapState(seed);
      expect(map.rolledNodes[TERMINAL_NODE_ID]?.kind).toBe("combat");
    }
  });
});
