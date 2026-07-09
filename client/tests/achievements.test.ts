import { describe, expect, it } from "vitest";
import { earnedBits, isCanonicalPattern, unlockedAchievements } from "@/game/achievements";
import { beginRun, newMapState, MAPS_PER_RUN } from "@/game/run";
import { princeReducer } from "@/state/prince-reducer";
import { createStubPrince } from "./fixtures";

describe("achievements v1", () => {
  it("a completed run earns the full passage; a lit chart adds unscorched", () => {
    const run = { ...beginRun(1), mapsCompleted: MAPS_PER_RUN };
    const bits = earnedBits(run);
    expect(bits & 1).toBe(1); // full-passage
    expect((bits >> 2) & 1).toBe(1); // unscorched (blank state = all lit)
  });

  it("a combusted-out run earns neither completion mark", () => {
    const run = beginRun(2);
    run.state.Moon = { affliction: 20, combusted: true };
    const bits = earnedBits({ ...run, mapsCompleted: 2 });
    expect(bits & 1).toBe(0);
    expect((bits >> 2) & 1).toBe(0);
  });

  it("witnessing the canonical tree earns its mark", () => {
    // Find a seed producing the canonical [1,2,2,1,2,1,1] pattern (1/32 odds).
    let seed = 0;
    let map = newMapState(0);
    for (seed = 1; seed < 400; seed++) {
      map = newMapState(seed);
      if (isCanonicalPattern(map.graph)) break;
    }
    expect(isCanonicalPattern(map.graph)).toBe(true);
    const run = { ...beginRun(3), map };
    expect((earnedBits(run) >> 1) & 1).toBe(1);
  });

  it("the reducer OR-merges bits idempotently", () => {
    const p = createStubPrince({ achievements: 0b001 });
    const next = princeReducer(p, { kind: "earnAchievements", bits: 0b101 });
    expect(next?.achievements).toBe(0b101);
    // Same bits again → same object (no-op).
    expect(princeReducer(next, { kind: "earnAchievements", bits: 0b101 })).toBe(next);
    expect(unlockedAchievements(0b101).map((a) => a.id)).toEqual(["full-passage", "unscorched"]);
  });
});
