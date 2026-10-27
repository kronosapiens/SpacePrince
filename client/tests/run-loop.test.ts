import { describe, expect, it } from "vitest";
import { beginRun, enterNode, isOver, newMapState, rolloverMap, shouldRolloverMap, MAPS_PER_RUN } from "@/game/run";
import { chartRuler, seededChart } from "@/game/chart";
import { combustionCeiling, isCombusted } from "@/game/combust";
import { combatTurnRng, resolveTurn } from "@/game/turn";
import { beginCombatEncounter, encounterRuler } from "@/game/encounter";
import { hashString, mulberry32 } from "@/game/rng";
import { unlockedPlanets } from "@/game/unlocks";
import { rollNodeContent } from "@/game/map-content";
import { eligibleNext, ROOT_NODE_ID, TERMINAL_NODE_ID } from "@/game/map-gen";
import { PLANETS } from "@/game/data";
import { pickScenario } from "@/data/narrative-scenarios";
import type { CombatEncounter, NarrativeEncounter, NodeContent, Run, PlanetName } from "@/game/types";
import { createStubPrince } from "./fixtures";

describe("Run loop integration", () => {
  it("resolves a combat encounter and persists run state across turns", () => {
    const prince = createStubPrince({ seed: 7 });
    const run = beginRun(prince.chart, 42);
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
      run: beginRun(createStubPrince().chart, 42, 0),
      opponentSeed: rejectedSeed,
      lifetimeEncounterCount: 0,
    });
    expect(encounterRuler(encounter)).toBe("Moon");
    expect(encounter.opponentChart.id).not.toBe(`chart_${rejectedSeed}`);
  });

  it("eligibleNext returns 1-edge neighbors at layer ≥ current, never backward", () => {
    const run = beginRun(createStubPrince().chart, 17);
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
    const run = beginRun(createStubPrince().chart, 17);
    const startId = run.map.currentNodeId;
    const firstNeighbor = eligibleNext(run.map.graph, startId, [])[0]!;
    // After "visiting" firstNeighbor, calling eligibleNext from it with a
    // visited list containing the start should not propose stepping back.
    const next = eligibleNext(run.map.graph, firstNeighbor, [startId, firstNeighbor]);
    expect(next).not.toContain(startId);
    expect(next).not.toContain(firstNeighbor);
  });

  it("combat length equals the map number; the opponent fields the player's tier (mirror)", () => {
    const run = beginRun(createStubPrince().chart, 42);
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
    let r = beginRun(prince.chart, 9);
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
    // The archive and current map together hold all seven maps.
    expect([...r.events.map((e) => e.map), r.map]).toHaveLength(MAPS_PER_RUN);
  });

  it("isOver true iff every fielded player planet is combusted", () => {
    const prince = createStubPrince({ seed: 13 });
    const run = beginRun(prince.chart, 1);
    expect(isOver(run, prince.chart, prince.numEncounters)).toBe(false);
    const dead = { ...run, state: { ...run.state } };
    for (const p of PLANETS) {
      dead.state[p] = { affliction: combustionCeiling(prince.chart.planets[p]) };
    }
    expect(isOver(dead, prince.chart, prince.numEncounters)).toBe(true);
  });
});

describe("Shared run transitions", () => {
  const prince = createStubPrince();
  const run = beginRun(prince.chart, 42, prince.numEncounters);
  const nodeOf = (kind: NodeContent["kind"]) =>
    Object.keys(run.map.rolledNodes).find((id) => run.map.rolledNodes[id]!.kind === kind)!;
  const enter = (r: Run, nodeId: string, encounterIdSeed?: number) =>
    enterNode({ run: r, nodeId, lifetimeEncounterCount: prince.numEncounters, encounterIdSeed });

  it("entering a node marks it visited and opens its encounter from the live seeds", () => {
    const combatId = nodeOf("combat");
    const { opponentSeed } = run.map.rolledNodes[combatId] as { opponentSeed: number };
    const combat = enter(run, combatId);
    expect(combat.map.currentNodeId).toBe(combatId);
    expect(combat.map.visitedNodeIds).toEqual([...run.map.visitedNodeIds, combatId]);
    expect(combat.encounter).toEqual(
      beginCombatEncounter({ run, opponentSeed, lifetimeEncounterCount: prince.numEncounters }),
    );

    // Each house holds two scenarios, so check every narrative node of a few runs.
    for (const r of [42, 43, 44].map((seed) => beginRun(prince.chart, seed, prince.numEncounters))) {
      for (const [nodeId, content] of Object.entries(r.map.rolledNodes)) {
        if (content.kind !== "narrative") continue;
        const { house } = content;
        const { scenarioId } = pickScenario(house, [], mulberry32(hashString(`${r.id}_${house}_${nodeId}`)));
        const narrative = enter(r, nodeId);
        expect(narrative.encounter).toMatchObject({ kind: "narrative", house, scenarioId });
        expect(narrative.seenScenarioIds).toEqual([scenarioId]);
        // No repeats: once seen, the house offers its other scenario.
        expect(enter({ ...r, seenScenarioIds: [scenarioId] }, nodeId).encounter).not.toMatchObject({ scenarioId });
      }
    }
  });

  it("an encounterIdSeed resamples arrival draws from what the map shows, never the live seeds", () => {
    const before = structuredClone(run);
    // Same map, different live seeds: a forecast must not tell the runs apart.
    const other: Run = { ...run, id: "run_other", seed: run.seed + 1 };
    const combatId = nodeOf("combat");
    const live = enter(run, combatId).encounter as CombatEncounter;
    const forecast = enter(run, combatId, 7).encounter as CombatEncounter;
    expect(forecast.opponentChart).toEqual(live.opponentChart);
    expect(forecast.necessity).not.toEqual(live.necessity);
    expect({ ...enter(other, combatId, 7).encounter, id: forecast.id }).toEqual(forecast);

    const narrativeId = nodeOf("narrative");
    const scenarios = (r: Run) => [0, 1, 2, 3, 4, 5, 6, 7].map(
      (seed) => (enter(r, narrativeId, seed).encounter as NarrativeEncounter).scenarioId,
    );
    expect(new Set(scenarios(run)).size).toBeGreaterThan(1);
    expect(scenarios(other)).toEqual(scenarios(run));
    expect(run).toEqual(before);
  });

  it("a combat ends on its last turn, or on the turn its run ends, and records its outcome on the map", () => {
    const entered = enter({ ...run, mapsCompleted: 1 }, nodeOf("combat"));
    const turn = (r: Run) =>
      resolveTurn(r, prince.chart, "Moon", "Testimony", combatTurnRng(r, r.encounter as CombatEncounter))!;
    const first = turn(entered);
    expect(first.encounterEnded).toBe(false);
    expect(first.run.map.outcomes).toEqual({});
    const last = turn(first.run);
    expect(last.encounterEnded).toBe(true);
    expect(last.run.map.outcomes[entered.map.currentNodeId]).toMatchObject({
      kind: "combat",
      summary: `Encounter · ${last.encounter.opponentChart.name}`,
    });

    // Every planet but the Moon is out, and the first blow takes the Moon too.
    const enc = entered.encounter as CombatEncounter;
    const nearlySpent: Run = {
      ...entered,
      state: Object.fromEntries(PLANETS.map((p) => [p, {
        ...entered.state[p],
        affliction: combustionCeiling(prince.chart.planets[p]) - (p === "Moon" ? 1 : 0),
      }])) as Run["state"],
      encounter: { ...enc, opponentActions: enc.opponentActions.map((a, i) => (i === 0 ? "Affliction" : a)) },
    };
    const fatal = turn(nearlySpent);
    expect(fatal.runEnded).toBe(true);
    expect(fatal.encounter).toMatchObject({ turnIndex: 1, resolved: true });
    expect(fatal.run.map.outcomes[entered.map.currentNodeId]).toMatchObject({ kind: "combat", combusts: ["Moon"] });
  });

  it("rolls over only from the cleared terminal node, and full combustion ends the run first", () => {
    const atExit: Run = { ...run, map: { ...run.map, currentNodeId: TERMINAL_NODE_ID } };
    const spent: Run = { ...atExit, state: { ...atExit.state } };
    for (const p of PLANETS) spent.state[p] = { affliction: combustionCeiling(prince.chart.planets[p]) };
    const rolls = (r: Run) => shouldRolloverMap(r, prince.chart, prince.numEncounters);
    expect(rolls(run)).toBe(false);
    expect(rolls(enter(run, TERMINAL_NODE_ID))).toBe(false);
    expect(rolls(atExit)).toBe(true);
    expect(rolls(spent)).toBe(false);
  });
});
