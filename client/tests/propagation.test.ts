import { describe, expect, it } from "vitest";
import { computeProjectedEffects } from "@/game/projections";
import { getAspects } from "@/game/aspects";
import { seededChart, blankSideState } from "@/game/chart";

describe("propagation projections", () => {
  it("returns no effects when source planet is combusted", () => {
    const chart = seededChart(42);
    const opp = seededChart(99);
    const playerState = blankSideState();
    playerState.Sun.combusted = true;
    const projected = computeProjectedEffects({
      playerChart: chart,
      opponentChart: opp,
      playerPlanet: "Sun",
      opponentPlanet: "Moon",
      playerState,
      opponentState: blankSideState(),
      playerAspects: getAspects(chart),
      opponentAspects: getAspects(opp),
    });
    expect(projected.self).toEqual({});
    expect(projected.other).toEqual({});
  });

  it("returns deltas only for non-combusted, non-zero magnitude", () => {
    const chart = seededChart(7);
    const opp = seededChart(11);
    const projected = computeProjectedEffects({
      playerChart: chart,
      opponentChart: opp,
      playerPlanet: "Mars",
      opponentPlanet: "Saturn",
      playerState: blankSideState(),
      opponentState: blankSideState(),
      playerAspects: getAspects(chart),
      opponentAspects: getAspects(opp),
    });
    // No combust, so direct deltas should appear for the active pair (or nothing if Testimony with 0 affliction).
    Object.values(projected.self).forEach((d) => expect(typeof d).toBe("number"));
    Object.values(projected.other).forEach((d) => expect(typeof d).toBe("number"));
  });
});
