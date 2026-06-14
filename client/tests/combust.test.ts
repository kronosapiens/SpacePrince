import { describe, expect, it } from "vitest";
import { applyCombust, combustionCeiling, shouldCombust } from "@/game/combust";
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
  // ceiling = durability × 20; dignity no longer feeds it (moved to houses).
  it("is durability × 20", () => {
    expect(combustionCeiling(placement(8))).toBe(160);
    expect(combustionCeiling(placement(2))).toBe(40);
  });
});

describe("shouldCombust", () => {
  it("zero affliction never combusts", () => {
    expect(shouldCombust(placement(8), state(0))).toBe(false);
  });

  it("below the ceiling is a safe, recoverable margin", () => {
    expect(shouldCombust(placement(8), state(159))).toBe(false);
  });

  it("combusts the moment affliction reaches the ceiling", () => {
    expect(shouldCombust(placement(8), state(160))).toBe(true);
    expect(shouldCombust(placement(8), state(200))).toBe(true);
  });

  it("an already-combusted planet does not re-trigger", () => {
    expect(shouldCombust(placement(8), state(200, true))).toBe(false);
  });
});

describe("applyCombust", () => {
  it("commits combustion at/above the ceiling and reports it", () => {
    const s = state(160);
    expect(applyCombust(placement(8), s)).toBe(true);
    expect(s.combusted).toBe(true);
  });

  it("leaves a sub-ceiling planet untouched", () => {
    const s = state(120);
    expect(applyCombust(placement(8), s)).toBe(false);
    expect(s.combusted).toBe(false);
  });
});
