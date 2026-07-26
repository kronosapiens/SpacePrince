import { describe, expect, it } from "vitest";
import { applyCombust, combustionCeiling, shouldCombust, uncombust, wouldCombust } from "@/game/combust";
import type { PlanetPlacement, PlanetState } from "@/game/types";

// Effective durability = base.durability (buffs are zero in these fixtures).
function placement(durability: number): PlanetPlacement {
  return {
    planet: "Sun",
    sign: "Leo",
    element: "Fire",
    modality: "Fixed",
    dignity: "Neutral",
    base: { damage: 0, healing: 0, durability, luck: 0 },
    buffs: { damage: 0, healing: 0, durability: 0, luck: 0 },
  };
}

function state(affliction: number, combusted = false): PlanetState {
  return { affliction, combusted };
}

describe("combustionCeiling", () => {
  // ceiling = durability × 6 (MECHANICS §10); dignity no longer feeds it.
  it("is durability × 6", () => {
    expect(combustionCeiling(placement(8))).toBe(48);
    expect(combustionCeiling(placement(2))).toBe(12);
  });
});

describe("shouldCombust", () => {
  it("zero affliction never combusts", () => {
    expect(shouldCombust(placement(8), state(0))).toBe(false);
  });

  it("below the ceiling is a safe, recoverable margin", () => {
    expect(shouldCombust(placement(8), state(47))).toBe(false);
  });

  it("combusts the moment affliction reaches the ceiling", () => {
    expect(shouldCombust(placement(8), state(48))).toBe(true);
    expect(shouldCombust(placement(8), state(60))).toBe(true);
  });

  it("an already-combusted planet does not re-trigger", () => {
    expect(shouldCombust(placement(8), state(60, true))).toBe(false);
  });
});

describe("wouldCombust", () => {
  it("true when the blow reaches the ceiling, false while margin remains", () => {
    expect(wouldCombust(placement(2), state(4), 8)).toBe(true);  // 4+8 = 12
    expect(wouldCombust(placement(2), state(3), 8)).toBe(false); // 3+8 = 11
  });

  it("a fragile planet can be flagged from zero affliction", () => {
    // Min ceiling 12 meets the top blow exactly, so a fresh planet can warn.
    expect(wouldCombust(placement(2), state(0), 12)).toBe(true);
  });

  it("a combusted planet or a zero blow never warns", () => {
    expect(wouldCombust(placement(2), state(4, true), 8)).toBe(false);
    expect(wouldCombust(placement(2), state(11), 0)).toBe(false);
  });
});

describe("applyCombust", () => {
  it("commits combustion at/above the ceiling and reports it", () => {
    const s = state(48);
    expect(applyCombust(placement(8), s)).toBe(true);
    expect(s.combusted).toBe(true);
  });

  it("leaves a sub-ceiling planet untouched", () => {
    const s = state(47);
    expect(applyCombust(placement(8), s)).toBe(false);
    expect(s.combusted).toBe(false);
  });
});

describe("uncombust", () => {
  it("returns the planet at half its ceiling — back, but scarred (§10)", () => {
    const s = state(48, true);
    uncombust(placement(8), s);
    expect(s.combusted).toBe(false);
    expect(s.affliction).toBe(24);
  });
});
