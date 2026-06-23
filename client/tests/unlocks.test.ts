import { describe, expect, it } from "vitest";
import { thresholdCrossedBy, unlockedPlanets } from "@/game/unlocks";

describe("unlockedPlanets — Macrobian schedule", () => {
  it("0 encounters → Moon (present from the first encounter)", () => {
    expect(unlockedPlanets(0)).toEqual(["Moon"]);
  });
  it("1 encounter → +Mercury", () => {
    expect(unlockedPlanets(1)).toEqual(["Moon", "Mercury"]);
  });
  it("2 encounters → +Venus", () => {
    expect(unlockedPlanets(2)).toEqual(["Moon", "Mercury", "Venus"]);
  });
  it("3 encounters → still three (next is 4)", () => {
    expect(unlockedPlanets(3)).toEqual(["Moon", "Mercury", "Venus"]);
  });
  it("4 encounters → +Sun", () => {
    expect(unlockedPlanets(4)).toEqual(["Moon", "Mercury", "Venus", "Sun"]);
  });
  it("8 encounters → +Mars", () => {
    expect(unlockedPlanets(8)).toEqual(["Moon", "Mercury", "Venus", "Sun", "Mars"]);
  });
  it("16 encounters → +Jupiter", () => {
    expect(unlockedPlanets(16)).toEqual(["Moon", "Mercury", "Venus", "Sun", "Mars", "Jupiter"]);
  });
  it("32 encounters → all 7 (+Saturn)", () => {
    expect(unlockedPlanets(32)).toHaveLength(7);
  });
  it("dev unlock-all → all 7 regardless", () => {
    expect(unlockedPlanets(0, true)).toHaveLength(7);
  });
});

describe("thresholdCrossedBy", () => {
  it("0 → 1 unlocks Mercury (the Moon is start-unlocked, never crossed)", () => {
    expect(thresholdCrossedBy(0, 1)).toBe("Mercury");
  });
  it("1 → 2 returns Venus", () => {
    expect(thresholdCrossedBy(1, 2)).toBe("Venus");
  });
  it("3 → 4 returns Sun", () => {
    expect(thresholdCrossedBy(3, 4)).toBe("Sun");
  });
  it("31 → 32 returns Saturn", () => {
    expect(thresholdCrossedBy(31, 32)).toBe("Saturn");
  });
  it("12 → 13 returns null (no threshold crossed)", () => {
    expect(thresholdCrossedBy(12, 13)).toBeNull();
  });
});
