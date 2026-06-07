import { describe, expect, it } from "vitest";
import { combustionProbability, maybeCombust } from "@/game/combust";
import type { Dignity, PlanetPlacement, PlanetState } from "@/game/types";

// Effective durability = base.durability (buffs are zero in these fixtures).
function placement(durability: number, dignity: Dignity = "Neutral"): PlanetPlacement {
  return {
    planet: "Sun",
    sign: "Leo",
    element: "Fire",
    modality: "Fixed",
    dignity,
    base: { damage: 0, healing: 0, durability, luck: 0 },
    buffs: { damage: 0, healing: 0, durability: 0, luck: 0 },
  };
}

function state(affliction: number, combusted = false): PlanetState {
  return { affliction, combusted };
}

describe("combustionProbability", () => {
  // functional = max(0, affliction − durability × dignityMult); p = min(1, functional / 100).
  // dignityMult: Domicile 3, Exaltation 2.5, Neutral 2, Detriment 1.5, Fall 1.

  it("zero affliction → zero probability", () => {
    expect(combustionProbability(placement(8), state(0))).toBe(0);
  });

  it("already combusted → zero probability", () => {
    expect(combustionProbability(placement(8), state(80, true))).toBe(0);
  });

  it("affliction within the durability offset → zero (the safe zone)", () => {
    // Neutral, durability 8 → offset 16; affliction 15 < 16.
    expect(combustionProbability(placement(8), state(15))).toBe(0);
  });

  it("functional affliction reads directly as a percent", () => {
    // Neutral, durability 8 → offset 16; functional 56 − 16 = 40 → 0.40.
    expect(combustionProbability(placement(8), state(56))).toBeCloseTo(0.4, 5);
  });

  it("caps at 1.0", () => {
    // functional 200 − 16 = 184 → min(1, 1.84) = 1.
    expect(combustionProbability(placement(8), state(200))).toBe(1);
  });

  it("higher dignity offsets more (lower risk) for the same affliction", () => {
    const aff = 56;
    const fall = combustionProbability(placement(8, "Fall"), state(aff)); // offset 8 → 0.48
    const neutral = combustionProbability(placement(8, "Neutral"), state(aff)); // offset 16 → 0.40
    const domicile = combustionProbability(placement(8, "Domicile"), state(aff)); // offset 24 → 0.32
    expect(fall).toBeCloseTo(0.48, 5);
    expect(neutral).toBeCloseTo(0.4, 5);
    expect(domicile).toBeCloseTo(0.32, 5);
    expect(fall).toBeGreaterThan(neutral);
    expect(neutral).toBeGreaterThan(domicile);
  });

  it("half-step dignities (Exaltation 2.5, Detriment 1.5) stay integer-clean", () => {
    // durability 8 → Exaltation offset 20 (functional 36), Detriment offset 12 (functional 44).
    expect(combustionProbability(placement(8, "Exaltation"), state(56))).toBeCloseTo(0.36, 5);
    expect(combustionProbability(placement(8, "Detriment"), state(56))).toBeCloseTo(0.44, 5);
  });
});

describe("maybeCombust", () => {
  it("commits combustion when the roll lands under probability", () => {
    // Neutral, durability 8 → offset 16; functional 66 − 16 = 50 → p 0.50.
    const s = state(66);
    expect(maybeCombust(placement(8), s, () => 0.1)).toBe(true);
    expect(s.combusted).toBe(true);
  });

  it("does not commit when the roll lands above probability", () => {
    const s = state(66);
    expect(maybeCombust(placement(8), s, () => 0.9)).toBe(false);
    expect(s.combusted).toBe(false);
  });
});
