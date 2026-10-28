import { afterEach, describe, expect, it, vi } from "vitest";
import * as catalogue from "@/data/narrative-scenarios";
import { A, G, scene, trade } from "@/data/narrative/shared";
import { playEncounter, snapshot, type PlayContext, type Policy, type Step } from "@/eval/play";
import { runChart } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { beginCombatEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { beginRun } from "@/game/run";
import { combatTurnRng } from "@/game/turn";
import { PLANETS } from "@/game/data";
import type { Prince, Run } from "@/game/types";
import { createStubPrince } from "./fixtures";

const policy: Policy = {
  route: (_play, _run, ids) => ids[0]!,
  combat: () => ({ planet: "Moon", verb: "Testimony" }),
  narrative: () => ({ optionId: "restore", selection: { chosen: "Venus" } }),
};
const context = (prince: Prince): PlayContext => ({ prince, policy,
  trial: { chartSeed: 7, gameSeed: 2, strategy: "random", strategySeed: 0 }, rng: () => .5, turnRng: combatTurnRng });
const capacity = (prince: Prince, run: Run, roster = PLANETS) => {
  const chart = runChart(prince.chart, run);
  return roster.reduce((sum, p) => sum + Math.max(0, combustionCeiling(chart.planets[p]) - run.state[p].affliction), 0);
};

describe("evaluation pressure ledger", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(["Affliction", "Testimony"] as const)("counts actual direct, propagated and inverted effects of %s", (verb) => {
    vi.spyOn(Date, "now").mockReturnValue(0);
    const prince = createStubPrince({ numEncounters: 2 });
    prince.chart.planets.Moon.sign = "Aries";
    prince.chart.planets.Mercury.sign = "Gemini";
    prince.chart.planets.Venus.sign = "Libra";
    const run = beginRun(prince.chart, 2, prince.numEncounters);
    run.gains.Moon.resolve = 12;
    const encounter = beginCombatEncounter({ run, opponentSeed: 99, lifetimeEncounterCount: prince.numEncounters });
    encounter.sequence = ["Moon"];
    encounter.opponentActions = [verb];
    encounter.opponentChart.planets.Moon.base.affliction = 36;
    encounter.opponentChart.planets.Moon.base.testimony = 36;
    encounter.opponentChart.planets.Moon.buffs.affliction = 0;
    encounter.opponentChart.planets.Moon.buffs.testimony = 0;
    for (const p of PLANETS) encounter.opponentState[p].affliction = 0;
    run.encounter = encounter;
    if (verb === "Testimony") {
      run.state.Moon.affliction = 12;
      run.state.Mercury.affliction = 12;
      run.state.Venus.affliction = combustionCeiling(prince.chart.planets.Venus) - 6;
    } else run.state.Venus.affliction = 24;
    const before = structuredClone(run), steps: Step[] = [];
    const next = playEncounter(context(prince), run, (step) => steps.push(step));
    expect(run).toEqual(before);
    expect(next).toEqual(playEncounter(context(prince), run));
    const step = steps[0]!;
    if (step.kind !== "turn") throw new Error("Expected a turn");
    expect(step.pressure).toEqual(verb === "Affliction"
      ? { damage: 42, healing: 18, directAffliction: 36, propagatedAffliction: 6, invertedTestimonyDamage: 0,
        directTestimony: 0, propagatedTestimony: 0, invertedAfflictionHealing: 18 }
      : { damage: 6, healing: 18, directAffliction: 0, propagatedAffliction: 0, invertedTestimonyDamage: 6,
        directTestimony: 12, propagatedTestimony: 6, invertedAfflictionHealing: 0 });
    expect(capacity(prince, next, encounter.roster) - capacity(prince, run, encounter.roster))
      .toBe(step.pressure.healing - step.pressure.damage);
    if (verb === "Testimony") expect(step.combusts).toEqual(["Venus"]);
  });

  it.each([{ revived: false, recovery: "ordinary healing" }, { revived: true, recovery: "revival recovery" }])("separates Resolve gains from $recovery", ({ revived }) => {
    const prince = createStubPrince();
    prince.chart.ascendantSign = "Aries";
    for (const p of PLANETS) prince.chart.planets[p].sign = "Taurus";
    const run = beginRun(prince.chart, 2, prince.numEncounters);
    run.gains.Venus.resolve = 24;
    const ceiling = combustionCeiling(runChart(prince.chart, run).planets.Venus);
    run.state.Venus.affliction = revived ? ceiling : 12;
    const scenario = scene("fixture-pressure", 1, "Aries", "Recover.", [trade("restore", "Recover.", [
      ...(revived ? [{ kind: "uncombust" as const, target: "chosen" as const }] : [A("chosen", -12)]),
      G("chosen", "resolve", 12),
    ])]);
    vi.spyOn(catalogue, "getScenario").mockReturnValue(scenario);
    run.encounter = beginNarrativeEncounter({ run, house: 1, scenarioId: scenario.scenarioId });
    const before = snapshot(run), steps: Step[] = [];
    const next = playEncounter(context(prince), run, (step) => steps.push(step));
    const step = steps[0]!;
    if (step.kind !== "narrative") throw new Error("Expected a narrative choice");
    expect(step.pressure).toEqual({ damage: 0, healing: revived ? 0 : 12, revivalRecovery: revived ? ceiling / 2 : 0, resolveGain: 12 });
    expect(step.revivals).toEqual(revived ? ["Venus"] : []);
    expect(capacity(prince, next) - capacity(prince, run)).toBe(step.pressure.healing + step.pressure.revivalRecovery + step.pressure.resolveGain);
    expect(snapshot(run)).toEqual(before);
  });
});
