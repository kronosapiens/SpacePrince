import { describe, expect, it } from "vitest";
import { turnScore } from "@/game/score";
import type { Polarity, PropagationEntry } from "@/game/types";

const prop = (side: "self" | "other", polarity: Polarity, delta: number): PropagationEntry => ({
  side,
  source: "Sun",
  target: "Moon",
  delta,
  polarity,
  note: "",
});

describe("turnScore — resolution on the opponent's chart only", () => {
  it("affliction created scores nothing", () => {
    // Player afflicts: 5 lands on the opponent. Setup, not resolution.
    expect(turnScore(5, "Affliction", [])).toBe(0);
  });

  it("scores the player resolving the opponent", () => {
    // Player testifies; 5 of the opponent's affliction is resolved.
    expect(turnScore(5, "Testimony", [])).toBe(5);
  });

  it("counts opponent-side testimony propagation, ignores affliction propagation", () => {
    expect(
      turnScore(0, "Affliction", [prop("other", "Testimony", -4), prop("other", "Affliction", 6)]),
    ).toBe(4);
  });

  it("ignores self-side testimony — personal chart is survival, not score", () => {
    // The opponent healing the player (or an inversion rippling testimony
    // through the player's own web) extends the run; it earns no Distance.
    expect(turnScore(0, "Affliction", [prop("self", "Testimony", -3)])).toBe(0);
  });

  it("sums direct resolution and opponent-side testimony propagation", () => {
    expect(
      turnScore(5, "Testimony", [prop("other", "Testimony", -2), prop("self", "Testimony", -9)]),
    ).toBe(7);
  });
});
