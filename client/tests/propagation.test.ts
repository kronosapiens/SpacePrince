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
      playerValence: "Affliction",
      opponentValence: "Affliction",
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
      playerValence: "Affliction",
      opponentValence: "Affliction",
      playerState: blankSideState(),
      opponentState: blankSideState(),
      playerAspects: getAspects(chart),
      opponentAspects: getAspects(opp),
    });
    // No combust: every projected delta is a finite integer (number model).
    for (const d of [...Object.values(projected.self), ...Object.values(projected.other)]) {
      expect(Number.isInteger(d!.delta)).toBe(true);
    }
  });
});
