import { describe, expect, it } from "vitest";
import { combustionCeiling, isCombusted, newlyCombusted, uncombust, wouldCombust } from "@/game/combust";
import { derivePlacements, seededChart } from "@/game/chart";
import { getEffectiveStatsFromPlacement } from "@/game/combat";
import type { PlanetPlacement, PlanetState } from "@/game/types";

// Fixtures supply Resolve directly.
function placement(resolve: number): PlanetPlacement {
  return {
    planet: "Sun",
    sign: "Leo",
    element: "Fire",
    modality: "Fixed",
    dignity: "Neutral",
    base: { affliction: 0, testimony: 0, resolve, luck: 0 },
    buffs: { affliction: 0, testimony: 0, resolve: 0, luck: 0 },
  };
}

function state(affliction: number): PlanetState {
  return { affliction };
}

describe("combustionCeiling", () => {
  it("is base Resolve plus placement bonuses", () => {
    const planet = placement(48);
    planet.buffs.resolve = 12;
    expect(combustionCeiling(planet)).toBe(60);
    expect(combustionCeiling(placement(24))).toBe(24);
  });
});

describe("isCombusted", () => {
  // Combustion is derived, never stored (STATE.md): affliction caps at the
  // ceiling, so at-the-ceiling *is* combusted.
  it("false at zero and below the ceiling — a recoverable margin", () => {
    expect(isCombusted(placement(48), state(0))).toBe(false);
    expect(isCombusted(placement(48), state(47))).toBe(false);
  });

  it("true the moment affliction reaches the ceiling", () => {
    expect(isCombusted(placement(48), state(48))).toBe(true);
    expect(isCombusted(placement(48), state(60))).toBe(true);
  });
});

describe("wouldCombust", () => {
  it("true when the blow reaches the ceiling, false while margin remains", () => {
    expect(wouldCombust(placement(60), state(12), 48)).toBe(true);  // 12+48 = 60
    expect(wouldCombust(placement(60), state(11), 48)).toBe(false); // 11+48 = 59
  });

  it("a strong Mars combusts a clean ordinary Moon while a sturdy Saturn survives", () => {
    const { planets } = derivePlacements({
      longitudes: { Sun: 0, Moon: 60, Mercury: 60, Venus: 30, Mars: 0, Jupiter: 120, Saturn: 30 },
      ascendantLongitude: 0,
      isDiurnal: true,
    });
    const affliction = getEffectiveStatsFromPlacement(planets.Mars).affliction;
    expect(wouldCombust(planets.Moon, state(0), affliction)).toBe(true);
    expect(wouldCombust(planets.Saturn, state(0), affliction)).toBe(false);
  });

  it("a combusted planet or a zero blow never warns", () => {
    expect(wouldCombust(placement(60), state(60), 48)).toBe(false);
    expect(wouldCombust(placement(60), state(59), 0)).toBe(false);
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
    const s = state(48);
    uncombust(placement(48), s);
    expect(isCombusted(placement(48), s)).toBe(false);
    expect(s.affliction).toBe(24);
  });
});
