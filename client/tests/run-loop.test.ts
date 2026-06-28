import { describe, expect, it } from "vitest";
import { beginRun, isRunOver, rolloverMap, MAPS_PER_RUN } from "@/game/run";
import { resolveTurn } from "@/game/turn";
import { beginCombatEncounter } from "@/game/encounter";
import { mulberry32 } from "@/game/rng";
import { unlockedPlanets } from "@/game/unlocks";
import { applyOutcomes, buildNarrativeContext } from "@/game/narrative";
import { rollNodeContent } from "@/game/map-content";
import { eligibleNext } from "@/game/map-gen";
import { PLANETS } from "@/game/data";
import type { RunState, PlanetName } from "@/game/types";
import { createStubProfile } from "./fixtures";

describe("Run loop integration", () => {
  it("resolves a combat encounter and persists run state across turns", () => {
    const profile = createStubProfile({ seed: 7 });
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
      const result = resolveTurn(r, profile.chart, playerPlanet, "Affliction", rng);
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
    const profile = createStubProfile({ seed: 7 });
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
    const profile = createStubProfile({ seed: 7 });
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
    const profile = createStubProfile({ seed: 11 });
    let r = beginRun(profile, 5);
    r = { ...r, runDistance: 10, perPlanetState: { ...r.perPlanetState } };
    r.perPlanetState.Sun = { affliction: 5, combusted: true };

    const ctx = buildNarrativeContext({
      profile,
      run: r,
      joyPlanet: null,
      rulerPlanet: "Sun",
      unlocked: [...PLANETS],
    });
    r = applyOutcomes(r, profile, [
      { kind: "uncombust", target: "Sun" },
      { kind: "distance", delta: -3 },
    ], ctx);
    expect(r.perPlanetState.Sun.combusted).toBe(false);
    expect(r.perPlanetState.Sun.affliction).toBe(0);
    expect(r.runDistance).toBe(7);
  });

  it("combat is always 3 turns; the opponent fields the player's tier (mirror)", () => {
    const profile = createStubProfile({ seed: 7 });
    const run = beginRun(profile, 42);
    const begin = (lifetimeEncounterCount: number) =>
      beginCombatEncounter({ run, opponentSeed: 99, lifetimeEncounterCount });

    // Fixed three turns regardless of unlock tier (MECHANICS §11.1).
    for (const count of [0, 1, 2, 64]) {
      expect(begin(count).sequence).toHaveLength(3);
      expect(begin(count).opponentActions).toHaveLength(3);
    }
    // Mirrored roster: a tier-1 opponent fields only the Moon, sent on repeat.
    expect(begin(0).roster).toEqual(["Moon"]);
    expect(new Set(begin(0).sequence)).toEqual(new Set(["Moon"]));
    // Tier-2 fields Moon + Mercury.
    expect(begin(1).roster).toEqual(["Moon", "Mercury"]);
  });

  it("a run ends by completion when the seventh map is finished", () => {
    const profile = createStubProfile({ seed: 3 });
    let r = beginRun(profile, 9);
    // Six rollovers: each archives the current map and begins a fresh one,
    // never ending the run.
    for (let i = 0; i < MAPS_PER_RUN - 1; i++) {
      r = rolloverMap(r, 100 + i);
      expect(r.over).toBe(false);
      expect(r.mapHistory).toHaveLength(i + 1);
    }
    // On the seventh map now (mapHistory holds six). Completing it ends the run
    // by completion: the final map stays in place, history is untouched.
    const finalMap = r.currentMap;
    r = rolloverMap(r, 999);
    expect(r.over).toBe(true);
    expect(r.mapHistory).toHaveLength(MAPS_PER_RUN - 1);
    expect(r.currentMap).toBe(finalMap);
    // End-of-Run reads mapHistory + currentMap → exactly seven maps.
    expect([...r.mapHistory, r.currentMap]).toHaveLength(MAPS_PER_RUN);
  });

  it("isRunOver true iff every player planet is combusted", () => {
    const profile = createStubProfile({ seed: 13 });
    const run = beginRun(profile, 1);
    expect(isRunOver(run)).toBe(false);
    const dead = { ...run };
    dead.perPlanetState = { ...run.perPlanetState };
    for (const p of PLANETS) dead.perPlanetState[p] = { affliction: 10, combusted: true };
    expect(isRunOver(dead)).toBe(true);
  });
});
