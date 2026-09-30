import { describe, expect, it } from "vitest";
import { beginRun, rollMapBoundary, rolloverMap } from "@/game/run";
import { blankSideState } from "@/game/chart";
import { combustionCeiling, isCombusted } from "@/game/combust";
import { unlockedPlanets } from "@/game/unlocks";
import { mulberry32 } from "@/game/rng";
import { createStubPrince } from "./fixtures";

describe("map boundary", () => {
  const prince = createStubPrince({ seed: 21 });
  const roster = unlockedPlanets(32); // all seven fielded

  it("applies necessity on the first map to exactly the unlocked roster", () => {
    for (const tier of [0, 1, 32]) {
      const run = beginRun(prince.chart, 7, tier);
      expect(run.map.boundary!.necessity.map((entry) => entry.planet)).toEqual(unlockedPlanets(tier));
      for (const planet of roster) {
        expect(run.state[planet].affliction > 0).toBe(unlockedPlanets(tier).includes(planet));
      }
      expect(beginRun(prince.chart, 7, tier)).toEqual(run);
    }
  });

  it("uncombust roll: success revives before necessity", () => {
    const state = blankSideState();
    const ceiling = combustionCeiling(prince.chart.planets.Mars);
    state.Mars = { affliction: ceiling }; // at the ceiling = combusted (derived)
    const crossed = rollMapBoundary(prince.chart, state, roster, () => 0);
    expect(isCombusted(prince.chart.planets.Mars, crossed.state.Mars)).toBe(false);
    expect(crossed.state.Mars.affliction).toBe(ceiling / 2 + 6);
    expect(crossed.boundary.uncombusts).toHaveLength(1);
    expect(crossed.boundary.uncombusts[0]).toMatchObject({ planet: "Mars", success: true });
  });

  it("uncombust roll: failure leaves the planet combusted at its ceiling", () => {
    const state = blankSideState();
    const ceiling = combustionCeiling(prince.chart.planets.Mars);
    state.Mars = { affliction: ceiling };
    const crossed = rollMapBoundary(prince.chart, state, roster, () => 0.999);
    expect(isCombusted(prince.chart.planets.Mars, crossed.state.Mars)).toBe(true);
    expect(crossed.state.Mars.affliction).toBe(ceiling);
    expect(crossed.boundary.uncombusts[0]).toMatchObject({ planet: "Mars", success: false });
  });

  it("necessity wounds but never combusts", () => {
    for (let seed = 0; seed < 200; seed++) {
      const crossed = rollMapBoundary(
        prince.chart, blankSideState(), roster, mulberry32(seed),
      );
      for (const p of roster) {
        const ceiling = combustionCeiling(prince.chart.planets[p]);
        expect(Number.isInteger(crossed.state[p].affliction)).toBe(true);
        expect(crossed.state[p].affliction).toBeLessThan(ceiling);
      }
    }
  });

  it("uses the same boundary rule at every map depth", () => {
    const run = beginRun(prince.chart, 11);
    const early = rolloverMap(run, prince.chart, roster, 555);
    const late = rolloverMap({ ...run, mapsCompleted: 5 }, prince.chart, roster, 555);
    expect(late.state).toEqual(early.state);
    expect(late.map.boundary).toEqual(early.map.boundary);
  });

  it("rolloverMap crosses the boundary, records it on the new map, and replays deterministically", () => {
    const ceiling = combustionCeiling(prince.chart.planets.Moon);
    let run = beginRun(prince.chart, 11);
    run = { ...run, state: { ...run.state, Moon: { affliction: ceiling } } };
    const next = rolloverMap(run, prince.chart, roster, 555);
    expect(next.map.boundary).toBeDefined();
    expect(next.map.boundary!.uncombusts).toHaveLength(1);
    // Same map seed → same crossing: the boundary is f(seed), like node content.
    const replay = rolloverMap(run, prince.chart, roster, 555);
    expect(replay.state).toEqual(next.state);
    expect(replay.map.boundary).toEqual(next.map.boundary);
  });
});
