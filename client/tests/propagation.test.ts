import { describe, expect, it } from "vitest";
import { computeProjectedEffects, type ComputeProjectedEffectsInput } from "@/game/projections";
import { getAspects } from "@/game/aspects";
import { PLANETS } from "@/game/data";
import { seededChart, blankSideState } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { beginRun } from "@/game/run";
import { beginCombatEncounter } from "@/game/encounter";
import { resolveTurn } from "@/game/turn";
import { createStubPrince } from "./fixtures";
import type { Chart, CombatEncounter, PlanetName, Run } from "@/game/types";

describe("propagation projections", () => {
  it("returns no effects when source planet is combusted", () => {
    const chart = seededChart(42);
    const opp = seededChart(99);
    const playerState = blankSideState();
    // At the ceiling = combusted (derived, STATE.md).
    playerState.Sun.affliction = combustionCeiling(chart.planets.Sun);
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
      roster: PLANETS,
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
      if (p !== "Mars") playerState[p].affliction = combustionCeiling(chart.planets[p]);
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
      roster: PLANETS,
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
      roster: PLANETS,
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
      roster: PLANETS,
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

// Only fielded planets conduct (MECHANICS §11.1): a ghost is drawn without its
// aspect web, so a hop into one would be a beat the player hears but cannot see.
describe("propagation — only the fielded roster conducts", () => {
  it("the projection reaches no planet outside the roster", () => {
    const chart = seededChart(7);
    const opp = seededChart(11);
    // Moon v Moon — the first encounter's matchup.
    const projected = computeProjectedEffects({
      playerChart: chart,
      opponentChart: opp,
      playerPlanet: "Moon",
      opponentPlanet: "Moon",
      playerValence: "Affliction",
      opponentValence: "Affliction",
      playerState: blankSideState(),
      opponentState: blankSideState(),
      playerAspects: getAspects(chart),
      opponentAspects: getAspects(opp),
      roster: ["Moon"],
    });
    expect(Object.keys(projected.self)).toEqual(["Moon"]);
    expect(Object.keys(projected.other)).toEqual(["Moon"]);
  });

  it("the resolver logs no hop into a ghost and leaves its affliction alone", () => {
    const prince = createStubPrince({ seed: 7 });
    const run = beginRun(42);
    const full = beginCombatEncounter({ run, opponentSeed: 99, lifetimeEncounterCount: 64 });
    // A planet with a web on both charts, so the full roster has somewhere to
    // ripple; the same fight, that planet against itself, at the two rosters.
    const aspected = (chart: Chart, p: PlanetName) => getAspects(chart).some((a) => a.from === p);
    const planet = PLANETS.find((p) => aspected(prince.chart, p) && aspected(full.opponentChart, p));
    if (!planet) throw new Error("seeds 7/99 share no aspected planet");
    const withRoster = (roster: PlanetName[]): Run => {
      const sequence = [...full.sequence];
      sequence[full.turnIndex] = planet;
      const enc: CombatEncounter = { ...full, roster, sequence };
      return { ...run, encounter: enc };
    };
    const rippling = resolveTurn(withRoster([...full.roster]), prince.chart, planet, "Affliction", () => 0)!;
    expect(rippling.log.propagation.length).toBeGreaterThan(0);

    const solo = withRoster([planet]);
    const contained = resolveTurn(solo, prince.chart, planet, "Affliction", () => 0)!;
    expect(contained.log.propagation).toEqual([]);
    const soloEnc = solo.encounter as CombatEncounter;
    for (const p of PLANETS) {
      if (p === planet) continue;
      expect(contained.run.state[p].affliction).toBe(run.state[p].affliction);
      expect(contained.encounter.opponentState[p].affliction).toBe(soloEnc.opponentState[p].affliction);
    }
  });
});
