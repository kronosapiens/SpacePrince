import { describe, expect, it } from "vitest";
import { computeDirectExchange, getPolarity } from "@/game/combat";
import type { ElementType, PlanetStats } from "@/game/types";

describe("getPolarity", () => {
  // Element qualities: Fire=Hot+Dry, Air=Hot+Wet, Water=Cold+Wet, Earth=Cold+Dry
  // Same element → 2 shared → Testimony.
  // 1 shared (one quality) → Friction. 0 shared → Affliction.
  const cases: Array<[ElementType, ElementType, "Testimony" | "Friction" | "Affliction"]> = [
    ["Fire", "Fire", "Testimony"],
    ["Fire", "Air", "Friction"],   // share Hot
    ["Fire", "Earth", "Friction"], // share Dry
    ["Fire", "Water", "Affliction"],
    ["Air", "Air", "Testimony"],
    ["Air", "Water", "Friction"],  // share Wet
    ["Air", "Earth", "Affliction"],
    ["Water", "Water", "Testimony"],
    ["Water", "Earth", "Friction"], // share Cold
    ["Earth", "Earth", "Testimony"],
  ];

  for (const [a, b, expected] of cases) {
    it(`${a} × ${b} = ${expected}`, () => {
      expect(getPolarity(a, b)).toBe(expected);
      expect(getPolarity(b, a)).toBe(expected);
    });
  }
});

describe("computeDirectExchange", () => {
  const player: PlanetStats = { damage: 3, healing: 2, durability: 0, luck: 0 };
  const opp: PlanetStats = { damage: 4, healing: 1, durability: 0, luck: 0 };

  it("Affliction doubles damage on both sides", () => {
    const x = computeDirectExchange("Affliction", player, opp);
    expect(x.playerToOpponent).toBe(6);  // 3 * 2
    expect(x.opponentToPlayer).toBe(8);  // 4 * 2
  });
  it("Friction uses raw damage (multiplier 1)", () => {
    const x = computeDirectExchange("Friction", player, opp);
    expect(x.playerToOpponent).toBe(3);
    expect(x.opponentToPlayer).toBe(4);
  });
  it("Testimony uses healing on both sides at multiplier 1", () => {
    const x = computeDirectExchange("Testimony", player, opp);
    expect(x.playerToOpponent).toBe(2);
    expect(x.opponentToPlayer).toBe(1);
  });
});
