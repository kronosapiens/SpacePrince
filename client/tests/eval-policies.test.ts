import { afterEach, describe, expect, it, vi } from "vitest";
import * as catalogue from "@/data/narrative-scenarios";
import { combatActions, narrativeOptions, snapshot, type Policy, type PlayContext } from "@/eval/play";
import { forecast, lightPolicy, survivalPolicy } from "@/eval/policies";
import { A, L, scene as defineScene, trade } from "@/data/narrative/shared";
import { getScenario, SCENARIOS_BY_HOUSE } from "@/data/narrative-scenarios";
import { combustionCeiling } from "@/game/combust";
import { PLANETS } from "@/game/data";
import { beginCombatEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { eligibleNext } from "@/game/map-gen";
import { mulberry32 } from "@/game/rng";
import { beginRun, enterNode } from "@/game/run";
import { combatTurnRng } from "@/game/turn";
import type { CombatEncounter, PlanetName, Prince, Run } from "@/game/types";
import { createStubPrince } from "./fixtures";

const context = (prince: Prince, policy: Policy): PlayContext => ({
  trial: { chartSeed: 7, gameSeed: 2, strategy: "survival", strategySeed: 0 },
  prince, policy, rng: mulberry32(1), turnRng: combatTurnRng,
});

describe("strategic policies", () => {
  afterEach(() => vi.restoreAllMocks());
  const prince = createStubPrince();
  // Three candidates of both kinds, on a map whose combats run three turns.
  const run: Run = { ...beginRun(prince.chart, 2, prince.numEncounters), mapsCompleted: 2 };
  const nodeIds = eligibleNext(run.map.graph, run.map.currentNodeId, run.map.visitedNodeIds);
  const combatId = nodeIds.find((id) => run.map.rolledNodes[id]!.kind === "combat")!;

  it("forecasts routes from what the map shows, never the live arrival or turn draws", () => {
    const hidden: Run = { ...run, id: "run_other", seed: run.seed + 1 };
    const liveDraw = (r: Run) => {
      const entered = enterNode({ run: r, chart: prince.chart, nodeId: combatId, lifetimeEncounterCount: prince.numEncounters });
      return combatTurnRng(entered, entered.encounter as CombatEncounter)();
    };
    expect(liveDraw(hidden)).not.toBe(liveDraw(run));
    for (const policy of [survivalPolicy, lightPolicy]) {
      const estimates = (r: Run) => nodeIds.map((id) => forecast(context(prince, policy), r, id));
      expect(estimates(hidden)).toEqual(estimates(run));
      expect(policy.route(context(prince, policy), hidden, nodeIds)).toBe(policy.route(context(prince, policy), run, nodeIds));
    }
    // The live combat opening keys on the visible opponent seed, so only sampled arrivals vary it.
    const openings = new Set<string>();
    const recorder: Policy = {
      ...survivalPolicy,
      combat: (play, r, actions) => {
        const enc = r.encounter as CombatEncounter;
        if (enc.turnIndex === 0) openings.add(JSON.stringify([enc.necessity, enc.sequence[0], enc.opponentActions[0]]));
        return survivalPolicy.combat(play, r, actions);
      },
    };
    forecast(context(prince, recorder), run, combatId);
    expect(openings.size).toBeGreaterThan(1);
  });

  it("forecasts without touching the live run or the strategy's own stream", () => {
    const before = structuredClone(run);
    const play = context(prince, survivalPolicy);
    for (const id of nodeIds) forecast(play, run, id);
    survivalPolicy.route(context(prince, survivalPolicy), run, nodeIds);
    expect(run).toEqual(before);
    expect(play.rng()).toBe(mulberry32(1)());
  });

  it("ranks narrative choices by each strategy's criteria", () => {
    const chooser = createStubPrince({ seed: 3 });
    chooser.chart.ascendantSign = "Cancer";
    for (const p of PLANETS) chooser.chart.planets[p].sign = "Aries";
    const scenario = defineScene("fixture-policy", 4, "Libra", "A job offers two shifts or an exit.", [
      trade("finish", "Work the full shift.", [A("chosen", 48), L(48)]),
      trade("rough", "Work a short shift.", [A("chosen", 24), L(24)]),
      trade("sleep", "Decline the work.", []),
    ]);
    vi.spyOn(catalogue, "getScenario").mockReturnValue(scenario);
    const scene = (state: (r: Run) => void): Run => {
      const r = beginRun(chooser.chart, 1, chooser.numEncounters);
      for (const p of PLANETS) r.state[p].affliction = 0;
      state(r);
      return { ...r, encounter: beginNarrativeEncounter({ run: r, house: scenario.house, scenarioId: scenario.scenarioId }) };
    };
    const choose = (policy: Policy, r: Run) =>
      policy.narrative(context(chooser, policy), r, narrativeOptions(r, chooser, scenario));

    const fresh = scene(() => {});
    expect(choose(survivalPolicy, fresh)).toMatchObject({ optionId: "sleep" });
    expect(choose(lightPolicy, fresh)).toMatchObject({ optionId: "finish" });

    // Saturn is the last lit planet, and finishing would combust it exactly.
    const lastLight = scene((r) => {
      for (const p of PLANETS) r.state[p].affliction = combustionCeiling(chooser.chart.planets[p]);
      r.state.Saturn.affliction -= 48;
    });
    expect(choose(lightPolicy, lastLight)).toEqual({ optionId: "rough", selection: { chosen: "Saturn" } });
  });

  it("ranks combat actions by each strategy's criteria", () => {
    // Every planet sits 6 short of combusting, against a testifying Venus. Venus
    // afflicting keeps all seven lit (32 Light). Sun and Moon afflicting gain the
    // most (84) but combust a planet without ending the run; the Sun leaves more capacity.
    const r = beginRun(prince.chart, 1, prince.numEncounters);
    for (const p of PLANETS) r.state[p].affliction = combustionCeiling(prince.chart.planets[p]) - 6;
    const encounter = beginCombatEncounter({ run: r, opponentSeed: 99, lifetimeEncounterCount: prince.numEncounters });
    encounter.sequence = ["Venus"];
    encounter.opponentActions = ["Testimony"];
    const turn: Run = { ...r, encounter };
    const choose = (policy: Policy) => policy.combat(context(prince, policy), turn, combatActions(turn, prince.chart, encounter));
    expect(choose(survivalPolicy)).toEqual({ planet: "Venus", verb: "Affliction" });
    expect(choose(lightPolicy)).toEqual({ planet: "Sun", verb: "Affliction" });

    // Against an afflicting Sun, Mars and Saturn afflicting earn the same 112
    // Light: Mars keeps all seven lit, Saturn leaves more capacity but loses a
    // planet. Light ranks lit planets before capacity.
    const even = beginRun(prince.chart, 14, prince.numEncounters);
    const afflictions = { Moon: 24, Mercury: 42, Venus: 36, Sun: 42, Mars: 18, Jupiter: 42, Saturn: 90 };
    for (const p of PLANETS) even.state[p].affliction = afflictions[p];
    const evenEncounter = beginCombatEncounter({ run: even, opponentSeed: 14, lifetimeEncounterCount: prince.numEncounters });
    expect([evenEncounter.sequence[0], evenEncounter.opponentActions[0]]).toEqual(["Sun", "Affliction"]);
    const evenTurn: Run = { ...even, encounter: evenEncounter };
    expect(lightPolicy.combat(context(prince, lightPolicy), evenTurn, combatActions(evenTurn, prince.chart, evenEncounter)))
      .toEqual({ planet: "Mars", verb: "Affliction" });
  });

  it("uses run gains when selecting planets and valuing narrative growth", () => {
    const chooser = createStubPrince();
    chooser.chart.ascendantSign = "Libra";
    for (const p of PLANETS) chooser.chart.planets[p].sign = "Aries";
    Object.assign(chooser.chart.planets.Saturn, { sign: "Capricorn", dignity: "Domicile" });
    const r = beginRun(chooser.chart, 1, chooser.numEncounters);
    for (const p of PLANETS) r.state[p].affliction = combustionCeiling(chooser.chart.planets[p]);
    r.gains.Moon.resolve = 12;
    const combat = beginCombatEncounter({ run: r, opponentSeed: 5, lifetimeEncounterCount: chooser.numEncounters });
    expect(combatActions(r, chooser.chart, combat).map(a => a.planet)).toEqual(["Moon", "Moon"]);

    const scenario = getScenario("home-capricorn-salting");
    r.encounter = beginNarrativeEncounter({ run: r, house: 4, scenarioId: scenario.scenarioId });
    const options = narrativeOptions(r, chooser, scenario).filter(({option}) => ["salt", "hang"].includes(option.id));
    const play = { ...context(chooser, survivalPolicy), rng: () => 0.99 };
    expect(survivalPolicy.narrative(play, r, options)).toEqual({ optionId: "salt", selection: { chosen: "Moon" } });
    expect(snapshot(r).gains.Moon.resolve).toBe(12);
  });

  it("routes by forecasting each candidate's encounter", () => {
    // Fix the authored offer so this policy test remains independent of which
    // scene the expanding catalogue would randomly select.
    const useMara = (r: Run): Run => {
      r.seenScenarioIds = SCENARIOS_BY_HOUSE[4]!.filter((s) => s.sign === "Libra" && s.scenarioId !== "home-libra-mara").map((s) => s.scenarioId);
      for (const [id, content] of Object.entries(r.map.rolledNodes)) {
        if (content.kind === "narrative") r.map.rolledNodes[id] = { kind: "narrative", house: 4 };
      }
      return r;
    };
    const ceiling = (p: PlanetName) => combustionCeiling(prince.chart.planets[p]);
    const at = (mapsCompleted: number, affliction: (p: PlanetName) => number): Run => {
      const r = { ...beginRun(prince.chart, 13, prince.numEncounters), mapsCompleted };
      for (const p of PLANETS) r.state[p].affliction = affliction(p);
      return useMara(r);
    };
    const healthy = at(0, () => 0);
    const ids = eligibleNext(healthy.map.graph, healthy.map.currentNodeId, healthy.map.visitedNodeIds);
    expect(ids.map((id) => healthy.map.rolledNodes[id]!.kind)).toEqual(["combat", "combat", "narrative"]);
    const route = (policy: Policy, r: Run) => policy.route(context(prince, policy), r, ids);

    // Only the Moon is lit, one point from combusting: the three-turn combats
    // usually end the run, the scene never does.
    const spent = at(2, (p) => ceiling(p) - (p === "Moon" ? 1 : 0));
    expect(route(survivalPolicy, spent)).toBe("3C");
    expect(route(lightPolicy, spent)).toBe("3C");
    // From full health every candidate is survived; the scene offers recovery
    // for survival and Light for accepting a burden.
    expect(route(survivalPolicy, healthy)).toBe("3C");
    expect(route(lightPolicy, healthy)).toBe("3C");

    // Two scenes forecast alike; survival takes the one nearer the map's exit.
    const tied = useMara(beginRun(prince.chart, 61, prince.numEncounters));
    const estimate = (id: string) => forecast(context(prince, survivalPolicy), tied, id);
    expect(estimate("2R")).toEqual(estimate("3C"));
    expect(survivalPolicy.route(context(prince, survivalPolicy), tied, ["3C", "2R"])).toBe("3C");
  });
});
