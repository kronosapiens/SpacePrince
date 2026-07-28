import { describe, expect, it } from "vitest";
import { computeDirectExchange, drawValence } from "@/game/combat";
import type { PlanetStats } from "@/game/types";

describe("drawValence", () => {
  const mostlyImpact: PlanetStats = { impact: 3, witness: 1, durability: 0, luck: 0 };

  it("draws afflict in proportion to the impact share", () => {
    // P(afflict) = 3 / (3 + 1) = 0.75. rng below the threshold → Affliction.
    expect(drawValence(mostlyImpact, () => 0)).toBe("Affliction");
    expect(drawValence(mostlyImpact, () => 0.74)).toBe("Affliction");
    // At/above the threshold → Testimony.
    expect(drawValence(mostlyImpact, () => 0.75)).toBe("Testimony");
    expect(drawValence(mostlyImpact, () => 0.99)).toBe("Testimony");
  });

  it("defaults to Affliction when both action stats are zero", () => {
    const inert: PlanetStats = { impact: 0, witness: 0, durability: 0, luck: 0 };
    expect(drawValence(inert, () => 0.5)).toBe("Affliction");
  });
});

describe("computeDirectExchange", () => {
  const player: PlanetStats = { impact: 3, witness: 2, durability: 0, luck: 0 };
  const opp: PlanetStats = { impact: 4, witness: 1, durability: 0, luck: 0 };

  it("afflict uses the raw impact stat (no matchup multiplier)", () => {
    const x = computeDirectExchange("Affliction", "Affliction", player, opp);
    expect(x.playerToOpponent).toBe(3);
    expect(x.opponentToPlayer).toBe(4);
  });

  it("testify uses the witness stat", () => {
    const x = computeDirectExchange("Testimony", "Testimony", player, opp);
    expect(x.playerToOpponent).toBe(2);
    expect(x.opponentToPlayer).toBe(1);
  });

  it("each side's valence is independent", () => {
    // Player afflicts (impact), opponent testifies (witness).
    const x = computeDirectExchange("Affliction", "Testimony", player, opp);
    expect(x.playerToOpponent).toBe(3);
    expect(x.opponentToPlayer).toBe(1);
  });
});
