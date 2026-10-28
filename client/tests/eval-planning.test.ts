import { describe, expect, it } from "vitest";
import { combatActions, type PlayContext } from "@/eval/play";
import { entryLeafValue, evaluateCombat, nextAnnouncements, preferred, type Candidate } from "@/eval/planning";
import { POLICIES, survivalPolicy } from "@/eval/policies";
import { combustionCeiling } from "@/game/combust";
import { beginCombatEncounter } from "@/game/encounter";
import { eligibleNext, TERMINAL_NODE_ID } from "@/game/map-gen";
import { hashString, mulberry32, pickWeighted } from "@/game/rng";
import { beginRun, MAPS_PER_RUN } from "@/game/run";
import { combatTurnRng } from "@/game/turn";
import type { CombatEncounter, Run } from "@/game/types";
import { createStubPrince } from "./fixtures";

function fixture(seed = 2) {
  const prince = createStubPrince();
  const run: Run = { ...beginRun(prince.chart, seed, prince.numEncounters), mapsCompleted: 2 };
  const encounter = beginCombatEncounter({ run, opponentSeed: seed + 10, lifetimeEncounterCount: prince.numEncounters });
  run.encounter = encounter;
  const play: PlayContext = {
    trial: { chartSeed: 7, gameSeed: seed, strategy: "survival", strategySeed: 0 },
    prince, policy: survivalPolicy, rng: mulberry32(91), turnRng: combatTurnRng,
  };
  return { run, encounter, play };
}

function leaf(capacity: number, luck = 60) {
  const result = fixture();
  const { run, encounter, play } = result;
  encounter.resolved = true;
  encounter.roster = ["Moon"];
  play.prince.chart.planets.Moon.base = { affliction: 12, testimony: 12, resolve: 120, luck };
  play.prince.chart.planets.Moon.buffs = { affliction: 0, testimony: 0, resolve: 0, luck: 0 };
  run.state.Moon.affliction = 120 - capacity;
  run.light = 37;
  return result;
}

describe("combat planning", () => {
  it("reduces the zero-allowance immediate rule to existing survival choices", () => {
    for (const seed of [1, 2, 5, 14, 32]) {
      const { run, encounter, play } = fixture(seed);
      const actions = combatActions(run, play.prince.chart, encounter);
      const original = survivalPolicy.combat({ ...play, rng: mulberry32(91) }, run, actions);
      const planned = pickWeighted(preferred(evaluateCombat(play, run, actions)), mulberry32(91)).action;
      expect(planned).toEqual(original);
      expect(POLICIES["combat-immediate"].combat({ ...play, rng: mulberry32(91) }, run, actions)).toEqual(original);
      expect(POLICIES["narrative-immediate"].combat({ ...play, rng: mulberry32(91) }, run, actions)).toEqual(original);
    }
  });

  it("spends only the allowed capacity for Light while preserving survival and lit planets", () => {
    const candidate = (capacity: number, light: number, lit = 7, alive = 1): Candidate => {
      const value = { alive, lit, capacity, light };
      return { action: { planet: "Sun", verb: "Affliction" }, immediate: value, value };
    };
    const values = [candidate(100, 0), candidate(88, 20), candidate(87, 40), candidate(120, 100, 6), candidate(200, 200, 7, 0.9)];
    expect(preferred(values, 12)).toEqual([values[1]]);
    expect(preferred(values, 0)).toEqual([values[0]]);
  });

  it("enumerates only living fielded opponents with uniform planets and stat-weighted verbs", () => {
    const { run, encounter } = fixture();
    encounter.roster = ["Moon", "Mercury", "Venus"];
    for (const planet of encounter.roster) {
      encounter.opponentChart.planets[planet].base = { affliction: 12, testimony: 36, resolve: 120, luck: 12 };
      encounter.opponentChart.planets[planet].buffs = { affliction: 0, testimony: 0, resolve: 0, luck: 0 };
    }
    encounter.opponentChart.planets.Mercury.base = { affliction: 36, testimony: 12, resolve: 120, luck: 12 };
    encounter.opponentState.Venus.affliction = 120;
    const draws = nextAnnouncements(run);
    expect(draws.map(({ run: next, probability }) => {
      const enc = next.encounter as CombatEncounter;
      return [enc.sequence[enc.turnIndex], enc.opponentActions[enc.turnIndex], probability];
    })).toEqual([
      ["Moon", "Affliction", 1 / 8], ["Moon", "Testimony", 3 / 8],
      ["Mercury", "Affliction", 3 / 8], ["Mercury", "Testimony", 1 / 8],
    ]);
  });

  it("never reads hidden future draws or consumes RNG while evaluating either leaf rule", () => {
    const { run, encounter, play } = fixture(5);
    encounter.sequence = encounter.sequence.slice(0, 2);
    encounter.opponentActions = encounter.opponentActions.slice(0, 2);
    const actions = combatActions(run, play.prince.chart, encounter);
    const before = structuredClone(run);
    const hidden = structuredClone(run);
    hidden.seed += 123;
    hidden.id = "hidden_other_run";
    const other = hidden.encounter as CombatEncounter;
    other.id = "hidden_other_encounter";
    other.sequence[1] = "Mars";
    other.opponentActions[1] = "Affliction";
    const noRng = () => { throw new Error("Evaluation must not read live or tie draws"); };
    for (const anticipateEntry of [false, true]) {
      const options = { horizon: 2 as const, capacityAllowance: 12, anticipateEntry };
      const expected = evaluateCombat(play, run, actions, options);
      expect(evaluateCombat({ ...play, rng: noRng, turnRng: noRng }, hidden, actions, options)).toEqual(expected);
    }
    expect(run).toEqual(before);
    expect(play.rng()).toBe(mulberry32(91)());
  });

  it("matches a hand-calculated two-turn expectation and uses entry anticipation only after resolution", () => {
    const { run, encounter, play } = fixture();
    encounter.roster = ["Moon"];
    encounter.sequence = ["Moon", "Moon"];
    encounter.opponentActions = ["Testimony", "Testimony"];
    encounter.opponentChart.ascendantSign = "Cancer";
    for (const placement of [play.prince.chart.planets.Moon, encounter.opponentChart.planets.Moon]) {
      placement.base = { affliction: 12, testimony: 12, resolve: 120, luck: 60 };
      placement.buffs = { affliction: 0, testimony: 0, resolve: 0, luck: 0 };
    }
    run.state.Moon.affliction = 12;
    encounter.opponentState.Moon.affliction = 12;
    const actions = [{ planet: "Moon" as const, verb: "Testimony" as const }];
    // Testify earns 12 Light and the Other heals our 12. Next turn equally
    // afflicts 12 or heals zero: expected capacity is 114. A later opening
    // costs 24 on half the draws, giving 102 with entry anticipation.
    const immediate = evaluateCombat(play, run, actions, { anticipateEntry: true })[0]!;
    expect(immediate.value).toEqual({ alive: 1, lit: 1, capacity: 120, light: 12 });
    const defensive = evaluateCombat(play, run, actions, { horizon: 2 })[0]!;
    expect(defensive.value).toEqual({ alive: 1, lit: 1, capacity: 114, light: 12 });
    const entry = evaluateCombat(play, run, actions, { horizon: 2, anticipateEntry: true })[0]!;
    expect(entry.value.alive).toBeCloseTo(1);
    expect(entry.value.lit).toBeCloseTo(1);
    expect(entry.value.capacity).toBeCloseTo(102);
    expect(entry.value.light).toBe(12);
  });
});

describe("next-entry expectation", () => {
  it.each([
    [6, 60, 0.5, 3], [12, 60, 0.5, 6], [24, 60, 2 / 3, 14],
    [36, 60, 5 / 6, 24], [48, 60, 1, 36], [12, 0, 0, 0], [6, 120, 1, 6],
  ])("values capacity %i with luck %i using complete Fortune blocking", (capacity, luck, survives, remaining) => {
    const { run, play } = leaf(capacity, luck);
    const value = entryLeafValue(run, play.prince.chart);
    expect(value.alive).toBeCloseTo(survives);
    expect(value.lit).toBeCloseTo(survives);
    expect(value.capacity).toBeCloseTo(remaining);
    expect(value.light).toBe(37);
  });

  it("includes gained Resolve and Fortune, combines independent survival, and ignores dead or unfielded planets", () => {
    const { run, encounter, play } = leaf(0, 0);
    encounter.roster = ["Moon", "Mercury", "Venus"];
    const chart = play.prince.chart;
    run.gains.Moon.resolve = 12;
    run.gains.Moon.luck = 60;
    chart.planets.Mercury.base = { affliction: 12, testimony: 12, resolve: 120, luck: 60 };
    chart.planets.Mercury.buffs = { affliction: 0, testimony: 0, resolve: 0, luck: 0 };
    run.state.Mercury.affliction = 108;
    run.state.Venus.affliction = combustionCeiling(chart.planets.Venus);
    const before = structuredClone(run);
    // Each of two lit planets survives with probability 1/2 and capacity 12.
    expect(entryLeafValue(run, chart)).toEqual({ alive: 0.75, lit: 1, capacity: 12, light: 37 });
    expect(run).toEqual(before);
  });

  it("does not charge unresolved encounters, already dead rosters, or a completed final map", () => {
    const { run, encounter, play } = leaf(6);
    const unchanged = { alive: 1, lit: 1, capacity: 6, light: 37 };
    encounter.resolved = false;
    expect(entryLeafValue(run, play.prince.chart)).toEqual(unchanged);
    encounter.resolved = true;
    run.mapsCompleted = MAPS_PER_RUN;
    expect(entryLeafValue(run, play.prince.chart)).toEqual(unchanged);
    run.mapsCompleted = MAPS_PER_RUN - 1;
    run.map.currentNodeId = TERMINAL_NODE_ID;
    expect(entryLeafValue(run, play.prince.chart)).toEqual(unchanged);
    run.mapsCompleted = 0;
    run.state.Moon.affliction = 120;
    expect(entryLeafValue(run, play.prince.chart)).toEqual({ alive: 0, lit: 0, capacity: 0, light: 37 });
  });
});

describe("planning route controls", () => {
  it("keeps survival forecast continuation and narratives fixed", () => {
    const { run, play } = fixture();
    const mapRun = { ...run, encounter: null };
    const ids = eligibleNext(mapRun.map.graph, mapRun.map.currentNodeId, mapRun.map.visitedNodeIds);
    const policy = POLICIES["two-turn-capacity-12"];
    const guarded = { ...policy, combat: () => { throw new Error("Recursive planning forecast"); } };
    expect(policy.route({ ...play, policy: guarded }, mapRun, ids))
      .toBe(survivalPolicy.route({ ...play, rng: mulberry32(91) }, mapRun, ids));
    for (const policy of Object.values(POLICIES).slice(3)) expect(policy.narrative).toBe(survivalPolicy.narrative);
  });

  it("prefers the named encounter kind before shortest distance and falls back when that kind is absent", () => {
    const { run, play } = fixture(61);
    const ids = ["2R", "3C"];
    run.map.rolledNodes["2R"] = { kind: "combat", opponentSeed: 99 };
    run.map.rolledNodes["3C"] = { kind: "narrative", house: 4 };
    const noForecast = () => { throw new Error("Simple routes need no forecasts or strategy draws"); };
    const context = { ...play, rng: noForecast, turnRng: noForecast, policy: { route: noForecast, combat: noForecast, narrative: noForecast } };
    for (const name of ["combat-immediate", "combat-two-turn", "combat-two-turn-entry-aware"] as const) {
      expect(POLICIES[name].route(context, run, ids)).toBe("2R");
    }
    expect(POLICIES["narrative-immediate"].route(context, run, ids)).toBe("3C");
    run.map.rolledNodes["3C"] = { kind: "combat", opponentSeed: 99 };
    expect(POLICIES["combat-immediate"].route(context, run, ids)).toBe("3C");
    expect(POLICIES["narrative-immediate"].route(context, run, ids)).toBe("3C");
  });

  it("uses the historical shared route tie stream independently of combat choices", () => {
    const { run, play } = fixture(61);
    const ids = ["2L", "2R"];
    for (const id of ids) run.map.rolledNodes[id] = { kind: "combat", opponentSeed: 99 };
    const expected = pickWeighted(ids, mulberry32(hashString(`difficulty_route_7_61_3_${run.map.currentNodeId}`)));
    for (const name of ["combat-immediate", "combat-two-turn", "combat-two-turn-entry-aware", "narrative-immediate"] as const) {
      const context = { ...play, trial: { ...play.trial, strategy: name, strategySeed: 99 }, rng: () => 0.999 };
      expect(POLICIES[name].route(context, { ...run, id: "other", seed: 999 }, ids)).toBe(expected);
    }
  });
});
