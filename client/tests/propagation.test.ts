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

  it("skips combusted propagation targets and drops zero-delta afflictions", () => {
    const chart = seededChart(7);
    const opp = seededChart(11);
    // Every player planet except the struck one is combusted, so propagation
    // has nowhere to land: only Mars itself may project.
    const playerState = blankSideState();
    for (const p of Object.keys(playerState) as Array<keyof typeof playerState>) {
      if (p !== "Mars") playerState[p].combusted = true;
    }
    const projected = computeProjectedEffects({
      playerChart: chart,
      opponentChart: opp,
      playerPlanet: "Mars",
      opponentPlanet: "Saturn",
      playerValence: "Affliction",
      opponentValence: "Affliction",
      playerState,
      opponentState: blankSideState(),
      playerAspects: getAspects(chart),
      opponentAspects: getAspects(opp),
    });
    expect(Object.keys(projected.self)).toEqual(["Mars"]);
    for (const d of [...Object.values(projected.self), ...Object.values(projected.other)]) {
      expect(d!.delta !== 0 || d!.polarity === "Testimony").toBe(true);
    }
  });
});
