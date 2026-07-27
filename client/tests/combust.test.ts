import { describe, expect, it } from "vitest";
import { combustionCeiling, isCombusted, newlyCombusted, uncombust, wouldCombust } from "@/game/combust";
import { seededChart } from "@/game/chart";
import type { PlanetPlacement, PlanetState } from "@/game/types";

// Effective durability = base.durability (buffs are zero in these fixtures).
function placement(durability: number): PlanetPlacement {
  return {
    planet: "Sun",
    sign: "Leo",
    element: "Fire",
    modality: "Fixed",
    dignity: "Neutral",
    base: { damage: 0, healing: 0, durability, luck: 0 },
    buffs: { damage: 0, healing: 0, durability: 0, luck: 0 },
  };
}

function state(affliction: number): PlanetState {
  return { affliction };
}

describe("combustionCeiling", () => {
  // ceiling = durability × 5 (MECHANICS §10); durability is a multiple of 12,
  // so ceilings land on the 60-lattice. Dignity no longer feeds it.
  it("is durability × 5", () => {
    expect(combustionCeiling(placement(48))).toBe(240);
    expect(combustionCeiling(placement(12))).toBe(60);
  });
});

describe("isCombusted", () => {
  // Combustion is derived, never stored (STATE.md): affliction caps at the
  // ceiling, so at-the-ceiling *is* combusted.
  it("false at zero and below the ceiling — a recoverable margin", () => {
    expect(isCombusted(placement(48), state(0))).toBe(false);
    expect(isCombusted(placement(48), state(239))).toBe(false);
  });

  it("true the moment affliction reaches the ceiling", () => {
    expect(isCombusted(placement(48), state(240))).toBe(true);
    expect(isCombusted(placement(48), state(300))).toBe(true);
  });
});

describe("wouldCombust", () => {
  it("true when the blow reaches the ceiling, false while margin remains", () => {
    expect(wouldCombust(placement(12), state(12), 48)).toBe(true);  // 12+48 = 60
    expect(wouldCombust(placement(12), state(11), 48)).toBe(false); // 11+48 = 59
  });

  it("a fragile planet can be flagged from zero affliction", () => {
    // Min ceiling 60 sits under the top blows (up to 72), so a fresh planet can warn.
    expect(wouldCombust(placement(12), state(0), 60)).toBe(true);
  });

  it("a combusted planet or a zero blow never warns", () => {
    expect(wouldCombust(placement(12), state(60), 48)).toBe(false);
    expect(wouldCombust(placement(12), state(59), 0)).toBe(false);
  });
});

describe("newlyCombusted", () => {
  it("reports only planets that crossed the ceiling between the two states", () => {
    const chart = seededChart(42);
    const before = {} as Record<string, PlanetState>;
    const after = {} as Record<string, PlanetState>;
    for (const p of Object.keys(chart.planets)) {
      before[p] = state(0);
      after[p] = state(0);
    }
    const sunCeiling = combustionCeiling(chart.planets.Sun);
    const moonCeiling = combustionCeiling(chart.planets.Moon);
    after.Sun = state(sunCeiling);                       // crossed
    before.Moon = state(moonCeiling);
    after.Moon = state(moonCeiling);                     // already out
    after.Mars = state(combustionCeiling(chart.planets.Mars) - 1); // wounded, live
    expect(newlyCombusted(chart, before as never, after as never)).toEqual(["Sun"]);
  });
});

describe("uncombust", () => {
  it("returns the planet at half its ceiling — back, but scarred (§10)", () => {
    const s = state(240);
    uncombust(placement(48), s);
    expect(isCombusted(placement(48), s)).toBe(false);
    expect(s.affliction).toBe(120);
  });
});
