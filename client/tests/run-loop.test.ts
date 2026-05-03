import { describe, expect, it } from "vitest";
import { beginRun, isRunOver } from "@/game/run";
import { resolveTurn } from "@/game/turn";
import { beginCombatEncounter } from "@/game/encounter";
import { seededChart } from "@/game/chart";
import { mulberry32 } from "@/game/rng";
import { unlockedPlanets } from "@/game/unlocks";
import { applyOutcomes } from "@/game/narrative";
import { rollNodeContent } from "@/game/map-content";
import { eligibleNext } from "@/game/map-gen";
import { PLANETS } from "@/game/data";
import type { Profile, RunState, PlanetName } from "@/game/types";

function makeStubProfile(seed = 7, lifetimeCount = 64): Profile {
  return {
    id: `stub_${seed}`,
    name: "Stub",
    birthData: { iso: "2000-01-01T00:00:00Z", lat: 0, lon: 0 },
    chart: seededChart(seed, "Stub"),
    lifetimeEncounterCount: lifetimeCount, // unlock all 7 planets for the run-loop test
    scarsLevel: 0,
    createdAt: 0,
    schemaVersion: 1,
  };
}

describe("Run loop integration", () => {
  it("resolves a combat encounter and persists run state across turns", () => {
    const profile = makeStubProfile(7);
    const run = beginRun(profile, 42);
    const enc = beginCombatEncounter({
      run,
      opponentSeed: 99,
      lifetimeEncounterCount: profile.lifetimeEncounterCount,
    });
    let r: RunState = { ...run, currentEncounter: enc };
    const rng = mulberry32(123);
    let safety = 0;
    while (r.currentEncounter && r.currentEncounter.kind === "combat" && !r.currentEncounter.resolved && safety++ < 30) {
      const playerPlanet = (unlockedPlanets(profile.lifetimeEncounterCount).filter(
        (p) => !r.perPlanetState[p].combusted,
      )[0] ?? "Sun") as PlanetName;
      const result = resolveTurn(r, profile.chart, playerPlanet, rng);
      if (!result) break;
      r = result.run;
    }
    expect(r.currentEncounter).not.toBeNull();
    expect((r.currentEncounter as any).resolved).toBe(true);
  });

  it("frontier rolls produce ~50% narrative content over many seeds", () => {
    let narrative = 0;
    let total = 0;
    for (let seed = 0; seed < 1000; seed++) {
      const rng = mulberry32(seed);
      const c = rollNodeContent({ rng, lastNarrativeHouse: null });
      total++;
      if (c.kind === "narrative") narrative++;
    }
    const ratio = narrative / total;
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.55);
  });

  it("eligibleNext returns 1-edge neighbors at layer ≥ current, never backward", () => {
    const profile = makeStubProfile(7);
    const run = beginRun(profile, 17);
    const startId = run.currentMap.currentNodeId;
    const startLayer = run.currentMap.graph.nodes.find((n) => n.id === startId)!.layer;
    const next = eligibleNext(run.currentMap.graph, startId, run.currentMap.visitedNodeIds);
    expect(next.length).toBeGreaterThan(0);
    for (const id of next) {
      const node = run.currentMap.graph.nodes.find((n) => n.id === id)!;
      expect(node.layer).toBeGreaterThanOrEqual(startLayer);
    }
  });

  it("eligibleNext excludes already-visited neighbors", () => {
    const profile = makeStubProfile(7);
    const run = beginRun(profile, 17);
    const startId = run.currentMap.currentNodeId;
    const firstNeighbor = eligibleNext(run.currentMap.graph, startId, [])[0]!;
    // After "visiting" firstNeighbor, calling eligibleNext from it with a
    // visited list containing the start should not propose stepping back.
    const next = eligibleNext(run.currentMap.graph, firstNeighbor, [startId, firstNeighbor]);
    expect(next).not.toContain(startId);
    expect(next).not.toContain(firstNeighbor);
  });

  it("narrative outcomes can heal / harm / spend distance and uncombust", () => {
    const profile = makeStubProfile(11);
    let r = beginRun(profile, 5);
    r = { ...r, runDistance: 10, perPlanetState: { ...r.perPlanetState } };
    r.perPlanetState.Sun = { affliction: 5, combusted: true };

    r = applyOutcomes(r, profile, [
      { kind: "uncombust", planet: "Sun" },
      { kind: "distance", delta: -3 },
    ]);
    expect(r.perPlanetState.Sun.combusted).toBe(false);
    expect(r.perPlanetState.Sun.affliction).toBe(0);
    expect(r.runDistance).toBe(7);
  });

  it("isRunOver true iff every player planet is combusted", () => {
    const profile = makeStubProfile(13);
    const run = beginRun(profile, 1);
    expect(isRunOver(run)).toBe(false);
    const dead = { ...run };
    dead.perPlanetState = { ...run.perPlanetState };
    for (const p of PLANETS) dead.perPlanetState[p] = { affliction: 10, combusted: true };
    expect(isRunOver(dead)).toBe(true);
  });
});
