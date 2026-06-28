import { describe, expect, it } from "vitest";
import { princeReducer } from "@/state/prince-reducer";
import { beginRun } from "@/game/run";
import { createStubPrince } from "./fixtures";

describe("princeReducer", () => {
  it("mint replaces null state", () => {
    const p = createStubPrince();
    expect(princeReducer(null, { kind: "mint", prince: p })).toBe(p);
  });

  it("clear nulls the state", () => {
    const p = createStubPrince();
    expect(princeReducer(p, { kind: "clear" })).toBeNull();
  });

  it("non-mint/clear actions on null state are no-ops", () => {
    expect(princeReducer(null, { kind: "incrementEncounters" })).toBeNull();
  });

  it("incrementEncounters bumps by one", () => {
    const p = createStubPrince({ numEncounters: 3 });
    expect(princeReducer(p, { kind: "incrementEncounters" })?.numEncounters).toBe(4);
  });

  it("setEncounters sets the value, clamped at zero", () => {
    const p = createStubPrince({ numEncounters: 3 });
    expect(princeReducer(p, { kind: "setEncounters", count: 99 })?.numEncounters).toBe(99);
    expect(princeReducer(p, { kind: "setEncounters", count: -5 })?.numEncounters).toBe(0);
  });

  it("startRun appends a run to the tail", () => {
    const p = createStubPrince();
    const a = beginRun(1);
    const b = beginRun(2);
    const afterA = princeReducer(p, { kind: "startRun", run: a })!;
    expect(afterA.runs).toEqual([a]);
    const afterB = princeReducer(afterA, { kind: "startRun", run: b })!;
    expect(afterB.runs).toEqual([a, b]);
  });

  it("commitRun replaces the tail run, leaving earlier runs untouched", () => {
    const p = createStubPrince();
    const a = beginRun(1);
    const b = beginRun(2);
    let state = princeReducer(p, { kind: "startRun", run: a })!;
    state = princeReducer(state, { kind: "startRun", run: b })!;
    const bMoved = { ...b, distance: 42 };
    const after = princeReducer(state, { kind: "commitRun", run: bMoved })!;
    expect(after.runs).toEqual([a, bMoved]);
  });

  it("commitRun is a no-op when there are no runs", () => {
    const p = createStubPrince();
    const after = princeReducer(p, { kind: "commitRun", run: beginRun(1) })!;
    expect(after.runs).toEqual([]);
  });
});
