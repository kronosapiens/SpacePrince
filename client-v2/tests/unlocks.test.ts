import { describe, expect, it } from "vitest";
import { thresholdCrossedBy, unlockedPlanets } from "@/game/unlocks";

describe("unlockedPlanets — Macrobian schedule", () => {
  it("0 encounters → empty (chart is ghosts)", () => {
    expect(unlockedPlanets(0)).toEqual([]);
  });
  it("1 encounter → Moon", () => {
    expect(unlockedPlanets(1)).toEqual(["Moon"]);
  });
  it("2 encounters → Moon, Mercury", () => {
    expect(unlockedPlanets(2)).toEqual(["Moon", "Mercury"]);
  });
  it("3 encounters → still Moon, Mercury (next is 4)", () => {
    expect(unlockedPlanets(3)).toEqual(["Moon", "Mercury"]);
  });
  it("4 encounters → +Venus", () => {
    expect(unlockedPlanets(4)).toEqual(["Moon", "Mercury", "Venus"]);
  });
  it("8 encounters → +Sun", () => {
    expect(unlockedPlanets(8)).toEqual(["Moon", "Mercury", "Venus", "Sun"]);
  });
  it("16 encounters → +Mars", () => {
    expect(unlockedPlanets(16)).toEqual(["Moon", "Mercury", "Venus", "Sun", "Mars"]);
  });
  it("32 encounters → +Jupiter", () => {
    expect(unlockedPlanets(32)).toEqual(["Moon", "Mercury", "Venus", "Sun", "Mars", "Jupiter"]);
  });
  it("64 encounters → all 7", () => {
    expect(unlockedPlanets(64)).toHaveLength(7);
  });
  it("dev unlock-all → all 7 regardless", () => {
    expect(unlockedPlanets(0, true)).toHaveLength(7);
  });
});

describe("thresholdCrossedBy", () => {
  it("0 → 1 returns Moon", () => {
    expect(thresholdCrossedBy(0, 1)).toBe("Moon");
  });
  it("1 → 2 returns Mercury", () => {
    expect(thresholdCrossedBy(1, 2)).toBe("Mercury");
  });
  it("3 → 4 returns Venus", () => {
    expect(thresholdCrossedBy(3, 4)).toBe("Venus");
  });
  it("63 → 64 returns Saturn", () => {
    expect(thresholdCrossedBy(63, 64)).toBe("Saturn");
  });
  it("12 → 13 returns null (no threshold crossed)", () => {
    expect(thresholdCrossedBy(12, 13)).toBeNull();
  });
});
