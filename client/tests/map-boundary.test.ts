import { describe, expect, it } from "vitest";
import { beginRun, rollMapBoundary, rolloverMap } from "@/game/run";
import { blankSideState } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { unlockedPlanets } from "@/game/unlocks";
import { mulberry32 } from "@/game/rng";
import { createStubPrince } from "./fixtures";

describe("map boundary (MECHANICS §11.3)", () => {
  const prince = createStubPrince({ seed: 21 });
  const roster = unlockedPlanets(32); // all seven fielded

  it("a run's first map carries no boundary — the chart enters clean", () => {
    expect(beginRun(7).map.boundary).toBeUndefined();
  });

  it("uncombust roll: success returns the planet at half ceiling", () => {
    const state = blankSideState();
    const ceiling = combustionCeiling(prince.chart.planets.Mars);
    state.Mars = { affliction: ceiling, combusted: true };
    // rng → 0 sits under any positive fortune chance (the roll succeeds) and
    // rolls a zero barrage, isolating the uncombust step.
    const crossed = rollMapBoundary(prince.chart, state, roster, 3, () => 0);
    expect(crossed.state.Mars.combusted).toBe(false);
    expect(crossed.state.Mars.affliction).toBe(ceiling / 2);
    expect(crossed.boundary.uncombusts).toHaveLength(1);
    expect(crossed.boundary.uncombusts[0]).toMatchObject({ planet: "Mars", success: true });
  });

  it("uncombust roll: failure leaves the planet combusted at its ceiling", () => {
    const state = blankSideState();
    const ceiling = combustionCeiling(prince.chart.planets.Mars);
    state.Mars = { affliction: ceiling, combusted: true };
    const crossed = rollMapBoundary(prince.chart, state, roster, 3, () => 0.999);
    expect(crossed.state.Mars.combusted).toBe(true);
    expect(crossed.state.Mars.affliction).toBe(ceiling);
    expect(crossed.boundary.uncombusts[0]).toMatchObject({ planet: "Mars", success: false });
  });

  it("the barrage wounds but never combusts, even at full depth", () => {
    for (let seed = 0; seed < 200; seed++) {
      const crossed = rollMapBoundary(
        prince.chart, blankSideState(), roster, 6, mulberry32(seed),
      );
      for (const p of roster) {
        const ceiling = combustionCeiling(prince.chart.planets[p]);
        expect(crossed.state[p].combusted).toBe(false);
        expect(crossed.state[p].affliction).toBeLessThan(ceiling);
      }
    }
  });

  it("the barrage deepens with maps completed", () => {
    const total = (k: number) => {
      let sum = 0;
      for (let seed = 0; seed < 100; seed++) {
        const crossed = rollMapBoundary(
          prince.chart, blankSideState(), roster, k, mulberry32(seed),
        );
        sum += crossed.boundary.barrage.reduce((s, b) => s + b.amount, 0);
      }
      return sum;
    };
    expect(total(6)).toBeGreaterThan(total(1));
  });

  it("rolloverMap crosses the boundary, records it on the new map, and replays deterministically", () => {
    const ceiling = combustionCeiling(prince.chart.planets.Moon);
    let run = beginRun(11);
    run = { ...run, state: { ...run.state, Moon: { affliction: ceiling, combusted: true } } };
    const next = rolloverMap(run, prince.chart, roster, 555);
    expect(next.map.boundary).toBeDefined();
    expect(next.map.boundary!.uncombusts).toHaveLength(1);
    // Same map seed → same crossing: the boundary is f(seed), like node content.
    const replay = rolloverMap(run, prince.chart, roster, 555);
    expect(replay.state).toEqual(next.state);
    expect(replay.map.boundary).toEqual(next.map.boundary);
  });
});
