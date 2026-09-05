import { describe, expect, it } from "vitest";
import { beginRun, isOver, newMapState, rolloverMap, MAPS_PER_RUN } from "@/game/run";
import { chartRuler, seededChart } from "@/game/chart";
import { combustionCeiling, isCombusted } from "@/game/combust";
import { resolveTurn } from "@/game/turn";
import { beginCombatEncounter, encounterRuler } from "@/game/encounter";
import { mulberry32 } from "@/game/rng";
import { unlockedPlanets } from "@/game/unlocks";
import { applyOutcomes, buildNarrativeContext } from "@/game/narrative";
import { rollNodeContent } from "@/game/map-content";
import { eligibleNext, ROOT_NODE_ID } from "@/game/map-gen";
import { PLANETS } from "@/game/data";
import type { Run, PlanetName } from "@/game/types";
import { createStubPrince } from "./fixtures";

describe("Run loop integration", () => {
  it("resolves a combat encounter and persists run state across turns", () => {
    const prince = createStubPrince({ seed: 7 });
    const run = beginRun(42);
    const enc = beginCombatEncounter({
      run,
      opponentSeed: 99,
      lifetimeEncounterCount: prince.numEncounters,
    });
    let r: Run = { ...run, encounter: enc };
    const rng = mulberry32(123);
    let safety = 0;
    while (r.encounter && r.encounter.kind === "combat" && !r.encounter.resolved && safety++ < 30) {
      const playerPlanet = (unlockedPlanets(prince.numEncounters).filter(
        (p) => !isCombusted(prince.chart.planets[p], r.state[p]),
      )[0] ?? "Sun") as PlanetName;
      const result = resolveTurn(r, prince.chart, playerPlanet, "Affliction", rng);
      if (!result) break;
      r = result.run;
    }
    expect(r.encounter).not.toBeNull();
    expect((r.encounter as any).resolved).toBe(true);
  });

  it("frontier rolls produce ~50% narrative content over many seeds", () => {
    let narrative = 0;
    let total = 0;
    for (let seed = 0; seed < 1000; seed++) {
      const rng = mulberry32(seed);
      const c = rollNodeContent({ rng });
      total++;
      if (c.kind === "narrative") narrative++;
    }
    const ratio = narrative / total;
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.55);
  });

  it("a new map pre-rolls content for every node except the root, deterministically", () => {
    const combatRulers = unlockedPlanets(0);
    const map = newMapState(123, combatRulers);
    for (const node of map.graph.nodes) {
      if (node.id === ROOT_NODE_ID) {
        expect(map.rolledNodes[node.id]).toBeUndefined();
      } else {
        expect(map.rolledNodes[node.id]).toBeDefined();
      }
    }
    expect(newMapState(123, combatRulers).rolledNodes).toEqual(map.rolledNodes);
  });

  it("rejects combat charts whose rulers are not unlocked", () => {
    for (const count of [0, 1, 2, 4, 8, 16, 32]) {
      const eligible = unlockedPlanets(count);
      const map = newMapState(1_000 + count, eligible);
      const combatNodes = Object.values(map.rolledNodes).filter(
        (content) => content.kind === "combat",
      );
      expect(combatNodes.length).toBeGreaterThan(0);
      for (const content of combatNodes) {
        if (content.kind !== "combat") continue;
        expect(eligible).toContain(
          chartRuler(seededChart(content.opponentSeed, "Other")),
        );
      }
    }
  });

  it("rejection-samples direct encounter seeds against the current tier", () => {
    const rejectedSeed = Array.from({ length: 20 }, (_, seed) => seed).find(
      (seed) => chartRuler(seededChart(seed, "Other")) !== "Moon",
    )!;
    const encounter = beginCombatEncounter({
      run: beginRun(42, 0),
      opponentSeed: rejectedSeed,
      lifetimeEncounterCount: 0,
    });
    expect(encounterRuler(encounter)).toBe("Moon");
    expect(encounter.opponentChart.id).not.toBe(`chart_${rejectedSeed}`);
  });

  it("eligibleNext returns 1-edge neighbors at layer ≥ current, never backward", () => {
    const run = beginRun(17);
    const startId = run.map.currentNodeId;
    const startLayer = run.map.graph.nodes.find((n) => n.id === startId)!.layer;
    const next = eligibleNext(run.map.graph, startId, run.map.visitedNodeIds);
    expect(next.length).toBeGreaterThan(0);
    for (const id of next) {
      const node = run.map.graph.nodes.find((n) => n.id === id)!;
      expect(node.layer).toBeGreaterThanOrEqual(startLayer);
    }
  });

  it("eligibleNext excludes already-visited neighbors", () => {
    const run = beginRun(17);
    const startId = run.map.currentNodeId;
    const firstNeighbor = eligibleNext(run.map.graph, startId, [])[0]!;
    // After "visiting" firstNeighbor, calling eligibleNext from it with a
    // visited list containing the start should not propose stepping back.
    const next = eligibleNext(run.map.graph, firstNeighbor, [startId, firstNeighbor]);
    expect(next).not.toContain(startId);
    expect(next).not.toContain(firstNeighbor);
  });

  it("narrative outcomes can heal / harm / spend Light and uncombust", () => {
    const prince = createStubPrince({ seed: 11 });
    const sunCeiling = combustionCeiling(prince.chart.planets.Sun);
    let r = beginRun(5);
    r = { ...r, light: 10, state: { ...r.state } };
    r.state.Sun = { affliction: sunCeiling }; // at the ceiling = combusted (derived)

    const ctx = buildNarrativeContext({
      prince,
      run: r,
      joyPlanet: null,
      rulerPlanet: "Sun",
      unlocked: [...PLANETS],
    });
    r = applyOutcomes(r, prince, [
      { kind: "uncombust", target: "Sun" },
      { kind: "light", delta: -3 },
    ], ctx);
    // The rite returns the planet at half ceiling — back, but scarred (§10).
    expect(isCombusted(prince.chart.planets.Sun, r.state.Sun)).toBe(false);
    expect(r.state.Sun.affliction).toBe(sunCeiling / 2);
    expect(r.light).toBe(7);
  });

  it("narrative Light gathers, spends, and clamps at zero", () => {
    const prince = createStubPrince({ seed: 12 });
    const run = { ...beginRun(6), light: 10 };
    const ctx = buildNarrativeContext({
      prince,
      run,
      joyPlanet: null,
      rulerPlanet: "Moon",
      unlocked: [...PLANETS],
    });

    const gathered = applyOutcomes(run, prince, [{ kind: "light", delta: 12 }], ctx);
    expect(gathered.light).toBe(22);

    const spent = applyOutcomes(gathered, prince, [{ kind: "light", delta: -7 }], ctx);
    expect(spent.light).toBe(15);

    const depleted = applyOutcomes(spent, prince, [{ kind: "light", delta: -99 }], ctx);
    expect(depleted.light).toBe(0);
  });

  it("combat length equals the map number; the opponent fields the player's tier (mirror)", () => {
    const run = beginRun(42);
    const begin = (lifetimeEncounterCount: number, mapsCompleted = 0) =>
      beginCombatEncounter({
        run: { ...run, mapsCompleted },
        opponentSeed: 99,
        lifetimeEncounterCount,
      });

    // Length = mapsCompleted + 1 regardless of unlock tier (MECHANICS §11.1).
    for (const count of [0, 1, 2, 64]) {
      expect(begin(count).sequence).toHaveLength(1);
      expect(begin(count).opponentActions).toHaveLength(1);
    }
    for (const maps of [1, 3, MAPS_PER_RUN - 1]) {
      expect(begin(64, maps).sequence).toHaveLength(maps + 1);
      expect(begin(64, maps).opponentActions).toHaveLength(maps + 1);
    }
    // Mirrored roster: a tier-1 opponent fields only the Moon, sent on repeat.
    expect(begin(0).roster).toEqual(["Moon"]);
    expect(new Set(begin(0).sequence)).toEqual(new Set(["Moon"]));
    // Tier-2 fields Moon + Mercury.
    expect(begin(1).roster).toEqual(["Moon", "Mercury"]);
  });

  it("a run ends by completion when the seventh map is finished", () => {
    const prince = createStubPrince({ seed: 3 });
    const roster = unlockedPlanets(prince.numEncounters);
    let r = beginRun(9);
    // Six rollovers: each archives the current map and begins a fresh one,
    // never ending the run.
    for (let i = 0; i < MAPS_PER_RUN - 1; i++) {
      r = rolloverMap(r, prince.chart, roster, 100 + i);
      expect(isOver(r, prince.chart, prince.numEncounters)).toBe(false);
      expect(r.events).toHaveLength(i + 1);
      expect(r.mapsCompleted).toBe(i + 1);
    }
    // On the seventh map now (events hold six). Completing it ends the run by
    // completion: the final map stays current and is NOT archived.
    const finalMap = r.map;
    r = rolloverMap(r, prince.chart, roster, 999);
    expect(isOver(r, prince.chart, prince.numEncounters)).toBe(true);
    expect(r.mapsCompleted).toBe(MAPS_PER_RUN);
    expect(r.events).toHaveLength(MAPS_PER_RUN - 1);
    expect(r.map).toBe(finalMap);
    // End-of-Run reads events + current map → exactly seven maps.
    expect([...r.events.map((e) => e.map), r.map]).toHaveLength(MAPS_PER_RUN);
  });

  it("isOver true iff every fielded player planet is combusted", () => {
    const prince = createStubPrince({ seed: 13 });
    const run = beginRun(1);
    expect(isOver(run, prince.chart, prince.numEncounters)).toBe(false);
    const dead = { ...run, state: { ...run.state } };
    for (const p of PLANETS) {
      dead.state[p] = { affliction: combustionCeiling(prince.chart.planets[p]) };
    }
    expect(isOver(dead, prince.chart, prince.numEncounters)).toBe(true);
  });
});
