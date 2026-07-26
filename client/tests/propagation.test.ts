import { describe, expect, it } from "vitest";
import { computeProjectedEffects, type ComputeProjectedEffectsInput } from "@/game/projections";
import { getAspects } from "@/game/aspects";
import { seededChart, blankSideState } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";

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

  it("models phase order: an afflict that combusts the actor preempts its reply", () => {
    const chart = seededChart(42);
    const opp = seededChart(99);
    const opponentState = blankSideState();
    // One point of margin: any afflict combusts the actor on landing.
    opponentState.Moon.affliction = combustionCeiling(opp.planets.Moon) - 1;
    const base: ComputeProjectedEffectsInput = {
      playerChart: chart,
      opponentChart: opp,
      playerPlanet: "Sun",
      opponentPlanet: "Moon",
      playerValence: "Affliction",
      opponentValence: "Affliction",
      playerState: blankSideState(),
      opponentState,
      playerAspects: getAspects(chart),
      opponentAspects: getAspects(opp),
    };
    const exact = computeProjectedEffects(base);
    // The reply never lands, and the combusted actor conducts nothing onward.
    expect(exact.self).toEqual({});
    expect(Object.keys(exact.other)).toEqual(["Moon"]);
    // The conservative hover read still shows the blow landing.
    const hover = computeProjectedEffects({ ...base, modelPreemption: false });
    expect(Object.keys(hover.self).length).toBeGreaterThan(0);
  });

  it("a catcher combusted by the blow spares its neighbours the ripple", () => {
    const chart = seededChart(7);
    const opp = seededChart(11);
    const aspect = getAspects(chart)[0];
    if (!aspect) throw new Error("seed 7 chart has no aspects");
    const catcher = aspect.from;
    const base: ComputeProjectedEffectsInput = {
      playerChart: chart,
      opponentChart: opp,
      playerPlanet: catcher,
      opponentPlanet: "Saturn",
      playerValence: "Affliction",
      opponentValence: "Affliction",
      playerState: blankSideState(),
      opponentState: blankSideState(),
      playerAspects: getAspects(chart),
      opponentAspects: getAspects(opp),
    };
    // Untouched, the blow ripples past the catcher into its web.
    const rippling = computeProjectedEffects(base);
    expect(Object.keys(rippling.self).length).toBeGreaterThan(1);
    // At one point of margin the catcher combusts on landing and conducts nothing.
    const playerState = blankSideState();
    playerState[catcher].affliction = combustionCeiling(chart.planets[catcher]) - 1;
    const combusting = computeProjectedEffects({ ...base, playerState });
    expect(Object.keys(combusting.self)).toEqual([catcher]);
  });
});
