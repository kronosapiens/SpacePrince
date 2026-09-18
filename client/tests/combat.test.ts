import { describe, expect, it } from "vitest";
import { computeDirectExchange, drawValence } from "@/game/combat";
import type { PlanetStats } from "@/game/types";

describe("drawValence", () => {
  const mostlyAffliction: PlanetStats = { affliction: 3, testimony: 1, resolve: 0, luck: 0 };

  it("draws afflict in proportion to the affliction share", () => {
    // P(afflict) = 3 / (3 + 1) = 0.75. rng below the threshold → Affliction.
    expect(drawValence(mostlyAffliction, () => 0)).toBe("Affliction");
    expect(drawValence(mostlyAffliction, () => 0.74)).toBe("Affliction");
    // At/above the threshold → Testimony.
    expect(drawValence(mostlyAffliction, () => 0.75)).toBe("Testimony");
    expect(drawValence(mostlyAffliction, () => 0.99)).toBe("Testimony");
  });

  it("defaults to Affliction when both action stats are zero", () => {
    const inert: PlanetStats = { affliction: 0, testimony: 0, resolve: 0, luck: 0 };
    expect(drawValence(inert, () => 0.5)).toBe("Affliction");
  });
});

describe("computeDirectExchange", () => {
  const player: PlanetStats = { affliction: 3, testimony: 2, resolve: 0, luck: 0 };
  const opp: PlanetStats = { affliction: 4, testimony: 1, resolve: 0, luck: 0 };

  it("afflict uses the raw affliction stat (no matchup multiplier)", () => {
    const x = computeDirectExchange("Affliction", "Affliction", player, opp);
    expect(x.playerToOpponent).toBe(3);
    expect(x.opponentToPlayer).toBe(4);
  });

  it("testify uses the testimony stat", () => {
    const x = computeDirectExchange("Testimony", "Testimony", player, opp);
    expect(x.playerToOpponent).toBe(2);
    expect(x.opponentToPlayer).toBe(1);
  });

  it("each side's valence is independent", () => {
    // Player afflicts (affliction), opponent testifies (testimony).
    const x = computeDirectExchange("Affliction", "Testimony", player, opp);
    expect(x.playerToOpponent).toBe(3);
    expect(x.opponentToPlayer).toBe(1);
  });
});
