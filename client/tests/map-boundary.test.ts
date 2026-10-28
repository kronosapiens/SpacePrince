import { describe, expect, it, vi } from "vitest";
import { beginRun, rollMapBoundary, rolloverMap } from "@/game/run";
import { blankSideState } from "@/game/chart";
import { combustionCeiling, isCombusted } from "@/game/combust";
import { unlockedPlanets } from "@/game/unlocks";
import { createStubPrince } from "./fixtures";

describe("map boundary", () => {
  const prince = createStubPrince({ seed: 21 });
  const roster = unlockedPlanets(32); // all seven fielded

  it("starts every unlock tier with zero affliction and no map Necessity", () => {
    for (const tier of [0, 1, 32]) {
      const run = beginRun(prince.chart, 7, tier);
      expect(run.map.boundary).toEqual({ uncombusts: [], necessity: [] });
      expect(run.state).toEqual(blankSideState());
      expect(beginRun(prince.chart, 7, tier)).toEqual(run);
    }
  });

  it("uncombust roll: success revives at half Resolve without additional damage", () => {
    const state = blankSideState();
    const ceiling = combustionCeiling(prince.chart.planets.Mars);
    state.Mars = { affliction: ceiling }; // at the ceiling = combusted (derived)
    const crossed = rollMapBoundary(prince.chart, state, roster, () => 0);
    expect(isCombusted(prince.chart.planets.Mars, crossed.state.Mars)).toBe(false);
    expect(crossed.state.Mars.affliction).toBe(ceiling / 2);
    expect(crossed.boundary.uncombusts).toHaveLength(1);
    expect(crossed.boundary.uncombusts[0]).toMatchObject({ planet: "Mars", success: true });
    expect(crossed.boundary.necessity).toEqual([]);
    expect(state.Mars.affliction).toBe(ceiling);
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

  it("leaves lit and unfielded planets unchanged without consuming rolls or mutating state", () => {
    const state = blankSideState();
    state.Moon.affliction = 24;
    state.Mars.affliction = combustionCeiling(prince.chart.planets.Mars);
    const rng = vi.fn(() => 0);
    const crossed = rollMapBoundary(prince.chart, state, ["Moon"], rng);
    expect(crossed.state).toEqual(state);
    expect(crossed.state).not.toBe(state);
    expect(crossed.state.Moon).not.toBe(state.Moon);
    expect(crossed.boundary).toEqual({ uncombusts: [], necessity: [] });
    expect(rng).not.toHaveBeenCalled();
  });

  it("uses the same boundary rule at every map depth", () => {
    const run = beginRun(prince.chart, 11);
    const early = rolloverMap(run, prince.chart, roster, 555);
    const late = rolloverMap({ ...run, mapsCompleted: 5 }, prince.chart, roster, 555);
    expect(late.state).toEqual(early.state);
    expect(late.map.boundary).toEqual(early.map.boundary);
  });

  it("rolloverMap crosses the boundary, records it on the new map, and replays deterministically", () => {
    const ceiling = combustionCeiling(prince.chart.planets.Moon) + 24;
    let run = beginRun(prince.chart, 11);
    run.gains.Moon.resolve = 24;
    run.gains.Moon.luck = 120;
    run = { ...run, state: { ...run.state, Moon: { affliction: ceiling } } };
    const next = rolloverMap(run, prince.chart, roster, 555);
    expect(next.map.boundary).toBeDefined();
    expect(next.map.boundary!.uncombusts).toHaveLength(1);
    expect(next.state.Moon.affliction).toBe(ceiling / 2);
    expect(next.map.boundary!.necessity).toEqual([]);
    // Same map seed → same crossing: the boundary is f(seed), like node content.
    const replay = rolloverMap(run, prince.chart, roster, 555);
    expect(replay.state).toEqual(next.state);
    expect(replay.map.boundary).toEqual(next.map.boundary);
  });
});
