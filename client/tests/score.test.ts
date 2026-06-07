import { describe, expect, it } from "vitest";
import { turnScore } from "@/game/score";
import type { Polarity, PropagationEntry } from "@/game/types";

const prop = (polarity: Polarity, delta: number): PropagationEntry => ({
  side: "self",
  source: "Sun",
  target: "Moon",
  delta,
  polarity,
  note: "",
});

describe("turnScore — testimony (resolution) only", () => {
  it("affliction created scores nothing", () => {
    // Both sides afflict: 5 to the opponent, 4 to the player. No resolution.
    expect(turnScore(4, 5, "Affliction", "Affliction", [])).toBe(0);
  });

  it("scores the player resolving the opponent", () => {
    // Player testifies; 5 of the opponent's affliction is resolved.
    expect(turnScore(0, 5, "Testimony", "Affliction", [])).toBe(5);
  });

  it("scores the opponent resolving the player", () => {
    // Opponent testifies; 3 of the player's affliction is resolved.
    expect(turnScore(3, 0, "Affliction", "Testimony", [])).toBe(3);
  });

  it("counts testimony propagation, ignores affliction propagation", () => {
    expect(
      turnScore(0, 0, "Affliction", "Affliction", [prop("Testimony", -4), prop("Affliction", 6)]),
    ).toBe(4);
  });

  it("sums direct resolution and testimony propagation, both sides", () => {
    expect(turnScore(3, 5, "Testimony", "Testimony", [prop("Testimony", -2)])).toBe(10);
  });
});
