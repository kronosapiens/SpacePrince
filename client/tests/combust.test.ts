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
  // ceiling = durability × 20 × dignityMult; p = min(1, affliction / ceiling).
  // dignityMult: Domicile 1.2, Exaltation 1.1, Neutral 1.0, Detriment 0.9, Fall 0.8.
  // durability 8, Neutral → ceiling 160.

  it("zero affliction → zero probability", () => {
    expect(combustionProbability(placement(8), state(0))).toBe(0);
  });

  it("already combusted → zero probability", () => {
    expect(combustionProbability(placement(8), state(80, true))).toBe(0);
  });

  it("any standing affliction carries risk — no safe band", () => {
    // durability 8 → ceiling 160; affliction 16 → 0.10.
    expect(combustionProbability(placement(8), state(16))).toBeCloseTo(0.1, 5);
  });

  it("affliction reads as a fraction of the ceiling", () => {
    // ceiling 160; affliction 80 → 0.50.
    expect(combustionProbability(placement(8), state(80))).toBeCloseTo(0.5, 5);
  });

  it("caps at 1.0 once affliction reaches the ceiling", () => {
    expect(combustionProbability(placement(8), state(160))).toBe(1);
    expect(combustionProbability(placement(8), state(200))).toBe(1);
  });

  it("dignity scales the ceiling — better dignity, lower risk", () => {
    const aff = 96; // durability 8 → neutral ceiling 160
    const fall = combustionProbability(placement(8, "Fall"), state(aff)); // 96/128
    const detriment = combustionProbability(placement(8, "Detriment"), state(aff)); // 96/144
    const neutral = combustionProbability(placement(8, "Neutral"), state(aff)); // 96/160
    const exaltation = combustionProbability(placement(8, "Exaltation"), state(aff)); // 96/176
    const domicile = combustionProbability(placement(8, "Domicile"), state(aff)); // 96/192
    expect(fall).toBeCloseTo(0.75, 5);
    expect(neutral).toBeCloseTo(0.6, 5);
    expect(domicile).toBeCloseTo(0.5, 5);
    expect(fall).toBeGreaterThan(detriment);
    expect(detriment).toBeGreaterThan(neutral);
    expect(neutral).toBeGreaterThan(exaltation);
    expect(exaltation).toBeGreaterThan(domicile);
  });
});

describe("maybeCombust", () => {
  it("commits combustion when the roll lands under probability", () => {
    // durability 8 → ceiling 160; affliction 80 → p 0.50.
    const s = state(80);
    expect(maybeCombust(placement(8), s, () => 0.1)).toBe(true);
    expect(s.combusted).toBe(true);
  });

  it("does not commit when the roll lands above probability", () => {
    const s = state(80);
    expect(maybeCombust(placement(8), s, () => 0.9)).toBe(false);
    expect(s.combusted).toBe(false);
  });
});
