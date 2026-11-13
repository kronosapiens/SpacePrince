import { describe, expect, it, vi } from "vitest";
import { playEncounter, type PlayContext } from "@/eval/play";
import { beginRun, enterNode, isOver, newMapState, rolloverMap, shouldRolloverMap, FIRST_MAP_SEED, MAPS_PER_RUN } from "@/game/run";
import { houseSign } from "@/game/chart";
import { combustionCeiling, isCombusted } from "@/game/combust";
import { relationalTurnRng, resolveTurn } from "@/game/turn";
import { beginRelationalEncounter, encounterRuler } from "@/game/encounter";
import { hashString, mulberry32 } from "@/game/rng";
import { unlockedPlanets } from "@/game/unlocks";
import { nodeRuler, rollNodeContent, seedRuler } from "@/game/map-content";
import { eligibleNext, ROOT_NODE_ID, TERMINAL_NODE_ID } from "@/game/map-gen";
import { PLANETS } from "@/game/data";
import { getScenario, pickScenario } from "@/data/narrative-scenarios";
import type { RelationalEncounter, NarrativeEncounter, NodeContent, Run, PlanetName } from "@/game/types";
import { createStubPrince } from "./fixtures";

describe("Run loop integration", () => {
  it("resolves a relational encounter and persists run state across turns", () => {
    const prince = createStubPrince({ seed: 7 });
    const run = beginRun(prince.chart, 42);
    const enc = beginRelationalEncounter({
      run,
      opponentSeed: 99,
      lifetimeRelationalEncounterCount: prince.numRelationalEncounters,
    });
    let r: Run = { ...run, encounter: enc };
    const rng = mulberry32(123);
    let safety = 0;
    while (r.encounter && r.encounter.kind === "relational" && !r.encounter.resolved && safety++ < 30) {
      const playerPlanet = (unlockedPlanets(prince.numRelationalEncounters).filter(
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
    const map = newMapState(123);
    for (const node of map.graph.nodes) {
      if (node.id === ROOT_NODE_ID) {
        expect(map.rolledNodes[node.id]).toBeUndefined();
      } else {
        expect(map.rolledNodes[node.id]).toBeDefined();
      }
    }
    expect(newMapState(123).rolledNodes).toEqual(map.rolledNodes);
  });

  it("the first map puts four relational encounters on every route, ruled Moon, Mercury, Venus, Moon", () => {
    const { graph, rolledNodes } = newMapState(FIRST_MAP_SEED);
    expect(graph.pattern).toEqual([1, 1, 1, 2, 2, 1, 1]);
    // Encounter n starts with n relational encounters completed; house scenes do not count.
    expect(["2C", "3C", "6C", "7C"].map((id, completed) => {
      const content = rolledNodes[id]!;
      return content.kind === "relational" && seedRuler(content.opponentSeed, unlockedPlanets(completed));
    })).toEqual(["Moon", "Mercury", "Venus", "Moon"]);
    expect(["4L", "4R", "5L", "5R"].map((id) => {
      const content = rolledNodes[id]!;
      return content.kind === "narrative" && content.house;
    })).toEqual([3, 5, 10, 7]);
  });

  it("gives every seed an unlocked ruler, which an unlock changes only to the newly unlocked planet", () => {
    const ladder = [0, 1, 2, 4, 8, 16, 32].map((count) => unlockedPlanets(count));
    for (let seed = 0; seed < 500; seed++) {
      const rulers = ladder.map((unlocked) => seedRuler(seed, unlocked));
      rulers.forEach((ruler, step) => {
        expect(ladder[step]).toContain(ruler);
        if (step > 0 && ruler !== rulers[step - 1]) expect(ruler).toBe(ladder[step]!.at(-1));
      });
    }
  });

  it("meets an Other whose ruler is the one the map showed for the node", () => {
    for (const count of [0, 1, 2, 4, 8, 16, 32]) {
      const prince = createStubPrince({ numRelationalEncounters: count });
      const run = beginRun(prince.chart, 1_000 + count, count);
      const relationalNodes = Object.entries(run.map.rolledNodes).filter(([, content]) => content.kind === "relational");
      expect(relationalNodes.length).toBeGreaterThan(0);
      for (const [nodeId, content] of relationalNodes) {
        if (content.kind !== "relational") continue;
        const entered = enterNode({ run, chart: prince.chart, nodeId, lifetimeRelationalEncounterCount: count });
        expect(encounterRuler(entered.encounter as RelationalEncounter)).toBe(nodeRuler(content, unlockedPlanets(count)));
      }
    }
  });

  it("keeps the ruler a node started under after a later unlock", () => {
    const atEntry = unlockedPlanets(0);
    // A seed whose ruler differs between the planets unlocked at entry and all seven.
    const opponentSeed = Array.from({ length: 20 }, (_, seed) => seed).find(
      (seed) => seedRuler(seed, atEntry) !== seedRuler(seed, PLANETS),
    )!;
    const prince = createStubPrince({ numRelationalEncounters: 0 });
    const run = beginRun(prince.chart, 42, 0);
    const nodeId = Object.keys(run.map.rolledNodes)[0]!;
    run.map.rolledNodes[nodeId] = { kind: "relational", opponentSeed };
    const entered = enterNode({ run, chart: prince.chart, nodeId, lifetimeRelationalEncounterCount: 0 });
    const content = entered.map.rolledNodes[nodeId]!;
    if (content.kind !== "relational") throw new Error("Expected relational");
    expect(nodeRuler(content, PLANETS)).toBe(seedRuler(opponentSeed, atEntry));
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

  it("relational length equals the map number; the opponent fields the player's tier (mirror)", () => {
    const run = beginRun(createStubPrince().chart, 42);
    const begin = (lifetimeRelationalEncounterCount: number, mapsCompleted = 0) =>
      beginRelationalEncounter({
        run: { ...run, mapsCompleted },
        opponentSeed: 99,
        lifetimeRelationalEncounterCount,
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
    const roster = unlockedPlanets(prince.numRelationalEncounters);
    let r = beginRun(prince.chart, 9);
    // Six rollovers: each archives the current map and begins a fresh one,
    // never ending the run.
    for (let i = 0; i < MAPS_PER_RUN - 1; i++) {
      r = rolloverMap(r, prince.chart, roster, 100 + i);
      expect(isOver(r, prince.chart, prince.numRelationalEncounters)).toBe(false);
      expect(r.events).toHaveLength(i + 1);
      expect(r.mapsCompleted).toBe(i + 1);
    }
    // On the seventh map now (events hold six). Completing it ends the run by
    // completion: the final map stays current and is NOT archived.
    const finalMap = r.map;
    r = rolloverMap(r, prince.chart, roster, 999);
    expect(isOver(r, prince.chart, prince.numRelationalEncounters)).toBe(true);
    expect(r.mapsCompleted).toBe(MAPS_PER_RUN);
    expect(r.events).toHaveLength(MAPS_PER_RUN - 1);
    expect(r.map).toBe(finalMap);
    // The archive and current map together hold all seven maps.
    expect([...r.events.map((e) => e.map), r.map]).toHaveLength(MAPS_PER_RUN);
  });

  it("isOver true iff every fielded player planet is combusted", () => {
    const prince = createStubPrince({ seed: 13 });
    const run = beginRun(prince.chart, 1);
    expect(isOver(run, prince.chart, prince.numRelationalEncounters)).toBe(false);
    const dead = { ...run, state: { ...run.state } };
    for (const p of PLANETS) {
      dead.state[p] = { affliction: combustionCeiling(prince.chart.planets[p]) };
    }
    expect(isOver(dead, prince.chart, prince.numRelationalEncounters)).toBe(true);
  });
});

describe("Shared run transitions", () => {
  const prince = createStubPrince();
  const run = beginRun(prince.chart, 42, prince.numRelationalEncounters);
  const nodeOf = (kind: NodeContent["kind"]) =>
    Object.keys(run.map.rolledNodes).find((id) => run.map.rolledNodes[id]!.kind === kind)!;
  const enter = (r: Run, nodeId: string, encounterIdSeed?: number) =>
    enterNode({ run: r, chart: prince.chart, nodeId, lifetimeRelationalEncounterCount: prince.numRelationalEncounters, encounterIdSeed });

  it("entering a node marks it visited and retains deterministic default draws", () => {
    const relationalId = nodeOf("relational");
    const { opponentSeed } = run.map.rolledNodes[relationalId] as { opponentSeed: number };
    const relational = enter(run, relationalId);
    expect(relational.map.currentNodeId).toBe(relationalId);
    expect(relational.map.visitedNodeIds).toEqual([...run.map.visitedNodeIds, relationalId]);
    const { selfNecessity, ...other } = relational.encounter as RelationalEncounter;
    expect(selfNecessity!.length).toBeGreaterThan(0);
    expect(other).toEqual(
      beginRelationalEncounter({ run, opponentSeed, lifetimeRelationalEncounterCount: prince.numRelationalEncounters }),
    );

    // Check every narrative node of a few runs against its actual house sign.
    for (const r of [42, 43, 44].map((seed) => beginRun(prince.chart, seed, prince.numRelationalEncounters))) {
      for (const [nodeId, content] of Object.entries(r.map.rolledNodes)) {
        if (content.kind !== "narrative") continue;
        const { house } = content;
        const { scenarioId } = pickScenario(house, houseSign(prince.chart, house), [], mulberry32(hashString(`${r.id}_${house}_${nodeId}`)));
        const narrative = enter(r, nodeId);
        expect(narrative.encounter).toMatchObject({ kind: "narrative", house, scenarioId });
        expect(narrative.seenScenarioIds).toEqual([scenarioId]);
        // Once seen, another matching scene is available.
        expect(enter({ ...r, seenScenarioIds: [scenarioId] }, nodeId).encounter).not.toMatchObject({ scenarioId });
      }
    }
  });

  it("entry seeds vary openings independently of map content and later-turn draws", () => {
    const before = structuredClone(run);
    // Forecasts and deterministic callers can supply the same opening independently of run identity.
    const other: Run = { ...run, id: "run_other", seed: run.seed + 1 };
    const relationalId = nodeOf("relational");
    const draws = Array.from({ length: 8 }, (_, seed) => enter(run, relationalId, seed));
    const encounters = draws.map((draw) => draw.encounter as RelationalEncounter);
    for (const draw of draws) {
      // Entry leaves every node as rolled, except that the entered node records its ruler.
      expect(draw.map.rolledNodes).toEqual({
        ...run.map.rolledNodes,
        [relationalId]: { ...run.map.rolledNodes[relationalId], ruler: encounterRuler(encounters[0]!) },
      });
      expect(draw.map.graph).toEqual(run.map.graph);
      expect(draw.map.seed).toBe(run.map.seed);
      expect((draw.encounter as RelationalEncounter).opponentChart).toEqual(encounters[0]!.opponentChart);
    }
    expect(new Set(encounters.map((enc) => `${enc.sequence[0]}_${enc.opponentActions[0]}`)).size).toBeGreaterThan(1);
    expect(new Set(encounters.map((enc) => JSON.stringify(enc.necessity))).size).toBeGreaterThan(1);
    expect(new Set(encounters.map((enc) => JSON.stringify(enc.selfNecessity))).size).toBeGreaterThan(1);
    expect(enter(run, relationalId, 7)).toEqual(draws[7]);
    expect({ ...enter(other, relationalId, 7).encounter, id: encounters[7]!.id }).toEqual(encounters[7]);
    const laterDraws = encounters.map((enc) => {
      const rng = relationalTurnRng(run, { ...enc, turnIndex: 1 });
      return [rng(), rng(), rng()];
    });
    expect(laterDraws.every((values) => JSON.stringify(values) === JSON.stringify(laterDraws[0]))).toBe(true);

    const narrativeId = nodeOf("narrative");
    const scenarios = (r: Run) => [0, 1, 2, 3, 4, 5, 6, 7].map(
      (seed) => (enter(r, narrativeId, seed).encounter as NarrativeEncounter).scenarioId,
    );
    expect(new Set(scenarios(run)).size).toBeGreaterThan(1);
    expect(scenarios(other)).toEqual(scenarios(run));
    const seenScenarioIds: string[] = [];
    for (let seed = 0; seed < 5; seed++) {
      const next = enter({ ...run, seenScenarioIds }, narrativeId, seed);
      const encounter = next.encounter as NarrativeEncounter;
      expect(getScenario(encounter.scenarioId)).toMatchObject({
        house: encounter.house, sign: houseSign(prince.chart, encounter.house),
      });
      expect(seenScenarioIds).not.toContain(encounter.scenarioId);
      expect(next.state).toEqual(run.state); // Narrative entry applies no Necessity.
      expect(next.map.rolledNodes).toEqual(run.map.rolledNodes);
      seenScenarioIds.push(encounter.scenarioId);
    }
    expect(run).toEqual(before);
  });

  it("a relational encounter ends on its last turn, or on the turn its run ends, and records its outcome on the map", () => {
    const entered = enter({ ...run, mapsCompleted: 1 }, nodeOf("relational"));
    const turn = (r: Run) =>
      resolveTurn(r, prince.chart, "Moon", "Testimony", relationalTurnRng(r, r.encounter as RelationalEncounter))!;
    const first = turn(entered);
    expect(first.encounterEnded).toBe(false);
    expect(first.run.map.outcomes).toEqual({});
    const last = turn(first.run);
    expect(last.encounterEnded).toBe(true);
    expect(last.run.map.outcomes[entered.map.currentNodeId]).toMatchObject({
      kind: "relational",
      summary: `Encounter · ${last.encounter.opponentChart.name}`,
    });

    // Every planet but the Moon is out, and the first blow takes the Moon too.
    const enc = entered.encounter as RelationalEncounter;
    const nearlySpent: Run = {
      ...entered,
      state: Object.fromEntries(PLANETS.map((p) => [p, {
        ...entered.state[p],
        affliction: combustionCeiling(prince.chart.planets[p]) - (p === "Moon" ? 1 : 0),
      }])) as Run["state"],
      // This manually constructed starting state has no recorded opening sweep.
      encounter: { ...enc, selfNecessity: undefined, opponentActions: enc.opponentActions.map((a, i) => (i === 0 ? "Affliction" : a)) },
    };
    const fatal = turn(nearlySpent);
    expect(fatal.runEnded).toBe(true);
    expect(fatal.encounter).toMatchObject({ turnIndex: 1, resolved: true });
    expect(fatal.run.map.outcomes[entered.map.currentNodeId]).toMatchObject({ kind: "relational", combusts: ["Moon"] });
  });

  it("resolves a full entry wipe with zero Light, an outcome, and no action", () => {
    const chart = structuredClone(prince.chart);
    for (const p of PLANETS) {
      chart.planets[p].base.luck = 0;
      chart.planets[p].buffs.luck = 0;
    }
    const wounded = structuredClone(run);
    wounded.light = 123;
    for (const p of PLANETS) wounded.state[p].affliction = combustionCeiling(prince.chart.planets[p]) - 1;
    wounded.state.Sun.affliction++; // Already combusted before this encounter.
    const before = structuredClone(wounded), nodeId = nodeOf("relational");
    const entered = enterNode({ run: wounded, chart, nodeId, lifetimeRelationalEncounterCount: prince.numRelationalEncounters });
    expect(entered.encounter).toMatchObject({ kind: "relational", resolved: true, turnIndex: 0, log: [] });
    expect(entered.light).toBe(123);
    expect(entered.map.outcomes[nodeId]).toMatchObject({ kind: "relational", lightDelta: 0, combusts: PLANETS.filter((p) => p !== "Sun") });
    const unused = vi.fn(() => { throw new Error("An entry wipe has no action"); });
    const play: PlayContext = {
      prince: { ...prince, chart }, trial: { chartSeed: 7, gameSeed: 42, strategy: "survival", strategySeed: 0 },
      policy: { route: unused, relational: unused, narrative: unused }, rng: unused, turnRng: unused,
    };
    expect(playEncounter(play, entered, unused)).toBe(entered);
    expect(resolveTurn(entered, chart, "Moon", "Testimony", unused)).toBeNull();
    expect(unused).not.toHaveBeenCalled();
    expect(isOver(entered, chart, prince.numRelationalEncounters)).toBe(true);
    expect(wounded).toEqual(before);
  });

  it("records entry and later losses once, including planets whose opening Fortune blocked the draw", () => {
    const chart = structuredClone(prince.chart);
    chart.planets.Moon.sign = "Aries";
    chart.planets.Mercury.sign = "Taurus";
    chart.planets.Venus.sign = "Gemini";
    chart.planets.Moon.base.luck = 0;
    chart.planets.Moon.buffs.luck = 0;
    for (const planet of ["Mercury", "Venus"] as const) {
      chart.planets[planet].base.luck = 120;
      chart.planets[planet].buffs.luck = 0;
    }
    const wounded = { ...beginRun(chart, 42, 2), mapsCompleted: 2 };
    wounded.state.Moon.affliction = combustionCeiling(chart.planets.Moon) - 1;
    const nodeId = Object.keys(wounded.map.rolledNodes).find((id) => wounded.map.rolledNodes[id]!.kind === "relational")!;
    let current = enterNode({ run: wounded, chart, nodeId, lifetimeRelationalEncounterCount: 2 });
    const encounter = current.encounter as RelationalEncounter;
    expect(encounter.selfNecessity!.filter(({ blocked }) => blocked)).toEqual([
      { planet: "Mercury", amount: 0, blocked: true, draw: expect.any(Number) },
      { planet: "Venus", amount: 0, blocked: true, draw: expect.any(Number) },
    ]);
    expect(isCombusted(chart.planets.Moon, current.state.Moon)).toBe(true);
    expect(encounter.resolved).toBe(false);
    expect(current.map.outcomes[nodeId]).toBeUndefined();
    // Fix later wounds and the incoming magnitude to exercise all three loss stages.
    current.state.Venus.affliction = combustionCeiling(chart.planets.Venus) - 12;
    current.state.Mercury.affliction = combustionCeiling(chart.planets.Mercury) - 24;
    encounter.sequence = ["Moon", "Moon", "Moon"];
    encounter.opponentActions = ["Affliction", "Affliction", "Affliction"];
    encounter.opponentChart.planets.Moon.base.affliction = 12;
    encounter.opponentChart.planets.Moon.buffs.affliction = 0;
    let light = 0;
    for (const planet of ["Venus", "Mercury", "Mercury"] as const) {
      const result = resolveTurn(current, chart, planet, "Testimony", () => 0)!;
      current = result.run;
      light += result.log.lightGain;
    }
    expect(current.encounter).toMatchObject({ resolved: true, turnIndex: 3 });
    expect(current.map.outcomes[nodeId]).toMatchObject({ lightDelta: light, combusts: ["Moon", "Mercury", "Venus"] });
  });

  it("rolls over only from the cleared terminal node, and full combustion ends the run first", () => {
    const atExit: Run = { ...run, map: { ...run.map, currentNodeId: TERMINAL_NODE_ID } };
    const spent: Run = { ...atExit, state: { ...atExit.state } };
    for (const p of PLANETS) spent.state[p] = { affliction: combustionCeiling(prince.chart.planets[p]) };
    const rolls = (r: Run) => shouldRolloverMap(r, prince.chart, prince.numRelationalEncounters);
    expect(rolls(run)).toBe(false);
    expect(rolls(enter(run, TERMINAL_NODE_ID))).toBe(false);
    expect(rolls(atExit)).toBe(true);
    expect(rolls(spent)).toBe(false);
  });
});
