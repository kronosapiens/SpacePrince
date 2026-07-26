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
  // ceiling = durability × 5 (MECHANICS §10); durability is a multiple of 12,
  // so ceilings land on the 60-lattice. Dignity no longer feeds it.
  it("is durability × 5", () => {
    expect(combustionCeiling(placement(48))).toBe(240);
    expect(combustionCeiling(placement(12))).toBe(60);
  });
});

describe("shouldCombust", () => {
  it("zero affliction never combusts", () => {
    expect(shouldCombust(placement(48), state(0))).toBe(false);
  });

  it("below the ceiling is a safe, recoverable margin", () => {
    expect(shouldCombust(placement(48), state(239))).toBe(false);
  });

  it("combusts the moment affliction reaches the ceiling", () => {
    expect(shouldCombust(placement(48), state(240))).toBe(true);
    expect(shouldCombust(placement(48), state(300))).toBe(true);
  });

  it("an already-combusted planet does not re-trigger", () => {
    expect(shouldCombust(placement(48), state(300, true))).toBe(false);
  });
});

describe("wouldCombust", () => {
  it("true when the blow reaches the ceiling, false while margin remains", () => {
    expect(wouldCombust(placement(12), state(12), 48)).toBe(true);  // 12+48 = 60
    expect(wouldCombust(placement(12), state(11), 48)).toBe(false); // 11+48 = 59
  });

  it("a fragile planet can be flagged from zero affliction", () => {
    // Min ceiling 60 sits under the top blows (up to 72), so a fresh planet can warn.
    expect(wouldCombust(placement(12), state(0), 60)).toBe(true);
  });

  it("a combusted planet or a zero blow never warns", () => {
    expect(wouldCombust(placement(12), state(12, true), 48)).toBe(false);
    expect(wouldCombust(placement(12), state(59), 0)).toBe(false);
  });
});

describe("applyCombust", () => {
  it("commits combustion at/above the ceiling and reports it", () => {
    const s = state(240);
    expect(applyCombust(placement(48), s)).toBe(true);
    expect(s.combusted).toBe(true);
  });

  it("leaves a sub-ceiling planet untouched", () => {
    const s = state(239);
    expect(applyCombust(placement(48), s)).toBe(false);
    expect(s.combusted).toBe(false);
  });
});

describe("uncombust", () => {
  it("returns the planet at half its ceiling — back, but scarred (§10)", () => {
    const s = state(240, true);
    uncombust(placement(48), s);
    expect(s.combusted).toBe(false);
    expect(s.affliction).toBe(120);
  });
});
