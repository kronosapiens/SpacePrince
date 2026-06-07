import { describe, expect, it } from "vitest";
import { computeDirectExchange, drawValence } from "@/game/combat";
import type { PlanetStats } from "@/game/types";

describe("drawValence", () => {
  const mostlyDamage: PlanetStats = { damage: 3, healing: 1, durability: 0, luck: 0 };

  it("draws afflict in proportion to the damage share", () => {
    // P(afflict) = 3 / (3 + 1) = 0.75. rng below the threshold → Affliction.
    expect(drawValence(mostlyDamage, () => 0)).toBe("Affliction");
    expect(drawValence(mostlyDamage, () => 0.74)).toBe("Affliction");
    // At/above the threshold → Testimony.
    expect(drawValence(mostlyDamage, () => 0.75)).toBe("Testimony");
    expect(drawValence(mostlyDamage, () => 0.99)).toBe("Testimony");
  });

  it("defaults to Affliction when both action stats are zero", () => {
    const inert: PlanetStats = { damage: 0, healing: 0, durability: 0, luck: 0 };
    expect(drawValence(inert, () => 0.5)).toBe("Affliction");
  });
});

describe("computeDirectExchange", () => {
  const player: PlanetStats = { damage: 3, healing: 2, durability: 0, luck: 0 };
  const opp: PlanetStats = { damage: 4, healing: 1, durability: 0, luck: 0 };

  it("afflict uses the raw damage stat (no matchup multiplier)", () => {
    const x = computeDirectExchange("Affliction", "Affliction", player, opp);
    expect(x.playerToOpponent).toBe(3);
    expect(x.opponentToPlayer).toBe(4);
  });

  it("testify uses the healing stat", () => {
    const x = computeDirectExchange("Testimony", "Testimony", player, opp);
    expect(x.playerToOpponent).toBe(2);
    expect(x.opponentToPlayer).toBe(1);
  });

  it("each side's valence is independent", () => {
    // Player afflicts (damage), opponent testifies (healing).
    const x = computeDirectExchange("Affliction", "Testimony", player, opp);
    expect(x.playerToOpponent).toBe(3);
    expect(x.opponentToPlayer).toBe(1);
  });
});
