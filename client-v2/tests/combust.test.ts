import { describe, expect, it } from "vitest";
import { combustionProbability, maybeCombust } from "@/game/combust";
import type { Dignity, PlanetPlacement, PlanetState } from "@/game/types";

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
  it("zero affliction → zero probability", () => {
    expect(combustionProbability(placement(2), state(0))).toBe(0);
  });
  it("already combusted → zero probability", () => {
    expect(combustionProbability(placement(2), state(20, true))).toBe(0);
  });
  it("ratio = affliction / (durability * 10), Neutral dignity factor 1.0", () => {
    expect(combustionProbability(placement(2), state(10))).toBeCloseTo(0.5, 5);
  });
  it("clamps at 0.95 max", () => {
    expect(combustionProbability(placement(1), state(50))).toBeCloseTo(0.95, 5);
  });
  it("Domicile factor 0.75 reduces probability", () => {
    const p = combustionProbability(placement(2, "Domicile"), state(10));
    expect(p).toBeCloseTo(0.5 * 0.75, 5);
  });
  it("Fall factor 1.3 increases probability", () => {
    const p = combustionProbability(placement(2, "Fall"), state(10));
    expect(p).toBeCloseTo(Math.min(0.95, 0.5 * 1.3), 5);
  });
});

describe("maybeCombust", () => {
  it("commits combustion when roll lands under probability", () => {
    const s = state(10); // p = 0.5 with durability 2
    const result = maybeCombust(placement(2), s, () => 0.1);
    expect(result).toBe(true);
    expect(s.combusted).toBe(true);
  });
  it("does not commit when roll lands above probability", () => {
    const s = state(10);
    const result = maybeCombust(placement(2), s, () => 0.9);
    expect(result).toBe(false);
    expect(s.combusted).toBe(false);
  });
});
