import { describe, expect, it } from "vitest";
import { afflictedSideState, SPAWN_AFFLICTION_TIERS } from "@/game/encounter";
import { seededChart } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { mulberry32 } from "@/game/rng";
import { PLANETS } from "@/game/data";

describe("afflictedSideState — opponent spawn affliction (MECHANICS §11)", () => {
  it("draws each fielded planet from the tiers, and reaches all of them", () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 50; seed++) {
      const state = afflictedSideState([...PLANETS], mulberry32(seed));
      for (const p of PLANETS) {
        expect(SPAWN_AFFLICTION_TIERS).toContain(state[p].affliction);
        seen.add(state[p].affliction);
      }
    }
    expect([...seen].sort((a, b) => a - b)).toEqual(SPAWN_AFFLICTION_TIERS);
  });

  it("never spawns a planet combusted — the top tier clears the smallest ceiling", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const chart = seededChart(seed, "t");
      const state = afflictedSideState([...PLANETS], mulberry32(seed));
      for (const p of PLANETS) {
        expect(state[p].affliction).toBeLessThan(combustionCeiling(chart.planets[p]));
      }
    }
  });

  it("seeds only the fielded roster", () => {
    const state = afflictedSideState(["Moon"], mulberry32(7));
    expect(SPAWN_AFFLICTION_TIERS).toContain(state.Moon.affliction);
    for (const p of PLANETS.filter((x) => x !== "Moon")) {
      expect(state[p].affliction).toBe(0);
    }
  });
});
