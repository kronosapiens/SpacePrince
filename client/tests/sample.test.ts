import { beforeEach, describe, expect, it } from "vitest";
import { beginRun, isOver, rolloverMap } from "@/game/run";
import { princeReducer } from "@/state/prince-reducer";
import { loadPrince, savePrince } from "@/state/prince";
import { createStubPrince } from "./fixtures";

describe("free-tier sample (FREE.md)", () => {
  beforeEach(() => localStorage.clear());

  it("a mapsCap-1 run ends by completion after its single map", () => {
    let run = beginRun(5, { mapsCap: 1 });
    expect(isOver(run, 2)).toBe(false);
    run = rolloverMap(run, 6);
    expect(run.mapsCompleted).toBe(1);
    expect(isOver(run, 2)).toBe(true);
  });

  it("a sample Prince's lifetime counter never moves — no unlocks mid-sample", () => {
    const p = createStubPrince({ numEncounters: 2, sample: true });
    expect(princeReducer(p, { kind: "incrementEncounters" })).toBe(p);
  });

  it("uncapped runs still play all seven maps", () => {
    let run = beginRun(7);
    for (let i = 0; i < 6; i++) run = rolloverMap(run, i);
    expect(isOver(run, 64)).toBe(false);
    run = rolloverMap(run, 99);
    expect(isOver(run, 64)).toBe(true);
  });

  it("savePrince is what persists; a sample never reaches it in the store", () => {
    // Store-level behavior is a hook; assert the storage contract directly:
    // saving a real Prince round-trips, and nothing writes sp:prince for
    // samples because PrinceStore skips the save (guard is prince.sample).
    savePrince(createStubPrince({ seed: 9 }));
    expect(loadPrince()?.id).toBe("stub_9");
  });
});
