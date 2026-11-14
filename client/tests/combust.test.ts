import { describe, expect, it } from "vitest";
import { isCombusted, newlyCombusted, uncombust, wouldCombust } from "@/game/combust";
import { derivePlacements, seededChart } from "@/game/chart";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
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

function state(tension: number): PlanetState {
  return { tension };
}

describe("a planet's Resolve", () => {
  it("is base Resolve plus placement bonuses", () => {
    const planet = placement(48);
    planet.buffs.resolve = 12;
    expect(getEffectiveStatsFromPlacement(planet).resolve).toBe(60);
    expect(getEffectiveStatsFromPlacement(placement(24)).resolve).toBe(24);
  });
});

describe("isCombusted", () => {
  // Combustion is derived, never stored (STATE.md): tension caps at
  // Resolve, so at Resolve *is* combusted.
  it("false at zero and below Resolve — remaining Resolve to recover", () => {
    expect(isCombusted(placement(48), state(0))).toBe(false);
    expect(isCombusted(placement(48), state(47))).toBe(false);
  });

  it("true the moment tension reaches Resolve", () => {
    expect(isCombusted(placement(48), state(48))).toBe(true);
    expect(isCombusted(placement(48), state(60))).toBe(true);
  });
});

describe("wouldCombust", () => {
  it("true when the blow reaches Resolve, false while remaining Resolve stays above zero", () => {
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
  it("reports only planets that reached their Resolve between the two states", () => {
    const chart = seededChart(42);
    const before = {} as Record<string, PlanetState>;
    const after = {} as Record<string, PlanetState>;
    for (const p of Object.keys(chart.planets)) {
      before[p] = state(0);
      after[p] = state(0);
    }
    const sunResolve = getEffectiveStatsFromPlacement(chart.planets.Sun).resolve;
    const moonResolve = getEffectiveStatsFromPlacement(chart.planets.Moon).resolve;
    after.Sun = state(sunResolve);                       // crossed
    before.Moon = state(moonResolve);
    after.Moon = state(moonResolve);                     // already out
    after.Mars = state(getEffectiveStatsFromPlacement(chart.planets.Mars).resolve - 1); // wounded, live
    expect(newlyCombusted(chart, before as never, after as never)).toEqual(["Sun"]);
  });
});

describe("uncombust", () => {
  it("returns the planet at half its Resolve — back, but scarred (§10)", () => {
    const s = state(48);
    uncombust(placement(48), s);
    expect(isCombusted(placement(48), s)).toBe(false);
    expect(s.tension).toBe(24);
  });
});
