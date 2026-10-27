import { describe, expect, it } from "vitest";
import { getScenario } from "@/data/narrative-scenarios";
import {
  applyOutcomes, availableSelections, narrativeContext, joyPresent, offeredOptions,
  previewOption, resolveNarrative, resolveTargets, withOccupants,
  type NarrativeScenario, type Occupant, type Outcome,
} from "@/game/narrative";
import { joyChoice, trade, L } from "@/data/narrative/shared";
import { runChart } from "@/game/chart";
import { beginNarrativeEncounter } from "@/game/encounter";
import { combustionCeiling } from "@/game/combust";
import { PLANETS, SIGNS } from "@/game/data";
import { beginRun } from "@/game/run";
import { describeOption, occupantLine } from "@/copy/narrative";
import { createStubPrince } from "./fixtures";
import { INTERACTION_SCENE } from "./narrative-fixture";

function setup(input: string | NarrativeScenario = INTERACTION_SCENE, numEncounters = 64) {
  const scenario = typeof input === "string" ? getScenario(input) : input;
  const prince = createStubPrince({ numEncounters });
  prince.chart.ascendantSign = SIGNS[(SIGNS.indexOf(scenario.sign) - scenario.house + 13) % 12]!;
  // Keep these unit tests free of occupant adjustments unless one is explicitly added.
  for (const p of PLANETS) prince.chart.planets[p].sign = scenario.sign === "Aries" ? "Taurus" : "Aries";
  const run = { ...beginRun(prince.chart, 42, numEncounters), light: 120 };
  run.encounter = beginNarrativeEncounter({ run, house: scenario.house, scenarioId: scenario.scenarioId });
  const context = () => narrativeContext(prince, run, scenario.house);
  const option = (optionId: string) => scenario.options.find((o) => o.id === optionId)!;
  const darken = (p: typeof PLANETS[number]) => { run.state[p].affliction = combustionCeiling(prince.chart.planets[p]); };
  return { prince, run, scenario, context, option, darken };
}

const A = (delta: number, target: "chosen" | "allUnlocked" = "chosen"): Outcome => ({ kind: "affliction", target, delta });
const RESOLVE: Outcome = { kind: "gain", target: "chosen", stat: "resolve", amount: 12 };

describe("single-decision narrative", () => {
  it("adds revival without replacing the ordinary choices", () => {
    const { scenario, context, darken } = setup("home-libra-mara");
    const offered = () => offeredOptions(scenario, context()).map((o) => o.id);
    expect(offered()).toEqual(["pass", "name", "thank"]);
    darken("Venus");
    expect(offered()).toEqual(["pass", "name", "revive", "thank"]);
  });

  it("requires the full price before healing and leaves failed purchases untouched", () => {
    const { run, context, option } = setup("home-libra-mara", 0);
    run.state.Moon.affliction = 12;
    run.light = 12;
    const before = structuredClone(run);
    expect(previewOption(run, context(), option("pass"), { chosen: "Moon" })).toEqual({ ok: false, reason: "Requires 24 Light; you have 12." });
    expect(run).toEqual(before);
    run.light = 24;
    const preview = previewOption(run, context(), option("pass"), { chosen: "Moon" });
    if (!preview.ok) throw new Error(preview.reason);
    expect(preview.success.light).toBe(0);
    expect(preview.success.state.Moon.affliction).toBe(0);
    expect(run.state.Moon.affliction).toBe(12);
    expect(describeOption(context(), option("pass"), { chosen: "Moon" })).toBe("Testify 24 on Moon · Lose 24 Light");
  });

  it("keeps authored group recovery amounts independent of current resources", () => {
    const { run, context, option } = setup("home-pisces-flood");
    run.state.Sun.affliction = 10;
    run.state.Moon.affliction = 48;
    for (const light of [0, 5, 120]) {
      run.light = light;
      expect(describeOption(context(), option("loft"))).toBe("Testify 12 on each lit planet · Lose 48 Light");
    }
  });

  it("does not sell healing to a clean or combusted target", () => {
    const { run, context, option, darken } = setup("home-libra-mara", 0);
    run.state.Moon.affliction = 0;
    expect(previewOption(run, context(), option("pass"), { chosen: "Moon" }).ok).toBe(false);
    darken("Moon");
    expect(previewOption(run, context(), option("pass"), { chosen: "Moon" }).ok).toBe(false);
  });

  it("ordinary Light losses clamp to zero, separately from purchases", () => {
    const { run, context } = setup();
    run.light = 12;
    const loss = applyOutcomes(run, context(), [L(-24)]);
    expect(loss.ok && loss.run.light).toBe(0);
    const gain = applyOutcomes(run, context(), [L(36)]);
    expect(gain.ok && gain.run.light).toBe(48);
    expect(applyOutcomes(run, context(), [L(36)], {}, 24).ok).toBe(false);
  });

  it("rejects locked or combusted costs before awarding Light", () => {
    const { run, prince, scenario, context, option, darken } = setup(INTERACTION_SCENE, 0);
    expect(previewOption(run, context(), option("work"), { chosen: "Venus" }).ok).toBe(false);
    darken("Moon");
    expect(resolveNarrative(run, prince, scenario, "work", { chosen: "Moon" })).toBeNull();
    expect(run.light).toBe(120);
  });

  it("requires the full affliction cost, allowing exact-ceiling combustion", () => {
    const { run, context, option, prince } = setup();
    const ceiling = combustionCeiling(prince.chart.planets.Saturn);
    run.state.Saturn.affliction = ceiling - 24;
    expect(previewOption(run, context(), option("work"), { chosen: "Saturn" }).ok).toBe(false);
    run.state.Saturn.affliction = ceiling - 48;
    const preview = previewOption(run, context(), option("work"), { chosen: "Saturn" });
    expect(preview.ok && preview.success.state.Saturn.affliction).toBe(ceiling);
    expect(describeOption(context(), option("work"), { chosen: "Saturn" })).toBe("Afflict 48 on Saturn · Gain 48 Light");
  });

  it("healthiest means greatest remaining combustion margin", () => {
    const { prince, run, context } = setup();
    prince.chart.planets.Moon.base.resolve = 24;
    prince.chart.planets.Moon.buffs.resolve = 0;
    prince.chart.planets.Saturn.base.resolve = 120;
    prince.chart.planets.Saturn.buffs.resolve = 0;
    run.state.Saturn.affliction = 72;
    const ctx = { ...context(), unlocked: ["Moon", "Saturn"] as typeof PLANETS[number][] };
    expect(resolveTargets("healthiest", ctx)).toEqual(["Saturn"]);
  });

  it("revives only a selected extinguished planet at half ceiling for the full price", () => {
    const { run, prince, context, option, darken } = setup("home-libra-mara");
    darken("Venus");
    run.light = 168;
    expect(previewOption(run, context(), option("revive"), { chosen: "Venus" }).ok).toBe(false);
    run.light = 180;
    expect(availableSelections(run, context(), option("revive"))).toEqual([{ chosen: "Venus" }]);
    expect(previewOption(run, context(), option("revive"), { chosen: "Moon" }).ok).toBe(false);
    expect(previewOption(run, context(), option("revive")).ok).toBe(false);
    const paid = previewOption(run, context(), option("revive"), { chosen: "Venus" });
    expect(paid.ok && paid.success.light).toBe(0);
    expect(paid.ok && paid.success.state.Venus.affliction).toBe(combustionCeiling(prince.chart.planets.Venus) / 2);
    expect(run.state.Venus.affliction).toBe(combustionCeiling(prince.chart.planets.Venus));
  });

  it("adds the joy choice only while its planet is unlocked, lit, and below the threshold", () => {
    const scenario: NarrativeScenario = {
      ...INTERACTION_SCENE, house: 1,
      options: [trade("leave", "Leave.", []), joyChoice("joy", "Ask Mercury.", [A(-12)])],
    };
    const { run, prince, context, darken } = setup(scenario, 0);
    const offered = () => offeredOptions(scenario, context()).map((o) => o.id);
    expect(offered()).toEqual(["leave"]);
    expect(resolveNarrative(run, prince, scenario, "joy", { chosen: "Moon" })).toBeNull();
    prince.numEncounters = 1;
    run.state.Mercury.affliction = 0;
    expect(offered()).toEqual(["leave", "joy"]);
    prince.chart.planets.Mercury.dignity = "Fall";
    expect(joyPresent(context())).toBe(true);
    run.gains.Mercury.resolve = 120;
    run.state.Mercury.affliction = 95;
    expect(offered()).toEqual(["leave", "joy"]);
    run.state.Mercury.affliction = 96;
    expect(offered()).toEqual(["leave"]);
    run.gains.Mercury.resolve = 0;
    darken("Mercury");
    expect(offered()).toEqual(["leave"]);
  });

  it("records the result once and rejects resolved, missing, or mismatched encounters", () => {
    const { run, prince, scenario } = setup();
    const next = resolveNarrative(run, prince, scenario, "gift", {})!;
    expect(next.encounter?.resolved).toBe(true);
    expect(next.encounter?.kind === "narrative" && next.encounter.resolutionText).toBe("Accept the gift.");
    expect(next.map.outcomes[run.map.currentNodeId]?.lightDelta).toBe(12);
    expect(resolveNarrative(next, prince, scenario, "gift", {})).toBeNull();
    expect(resolveNarrative({ ...run, encounter: null }, prince, scenario, "gift", {})).toBeNull();
    expect(resolveNarrative(run, prince, getScenario("home-libra-mara"), "gift", {})).toBeNull();
    expect(resolveNarrative(run, prince, scenario, "invented", {})).toBeNull();
    expect(prince.numEncounters).toBe(64);
  });
});

describe("accepted house-and-sign scenes", () => {
  const terms = (occupants: Occupant[]) => Object.fromEntries(getScenario("home-capricorn-salting").options
    .map((o) => withOccupants(o, occupants))
    .map((o) => [o.id, { cost: o.cost ?? 0, effects: o.result.effects }]));
  const mercury: Occupant = { planet: "Mercury", dignity: "Neutral" };
  const saturn: Occupant = { planet: "Saturn", dignity: "Domicile" };
  const moon: Occupant = { planet: "Moon", dignity: "Detriment" };
  it.each([
    { occupants: [], cook: [24, -24], salt: 12, revive: 180 },
    { occupants: [mercury], cook: [24, -24], salt: 12, revive: 180 },
    { occupants: [saturn], cook: [0, -24], salt: 0, revive: 156 },
    { occupants: [moon], cook: [48, -24], salt: 24, revive: 204 },
    { occupants: [saturn, moon], cook: [24, -24], salt: 12, revive: 180 },
  ])("planets in the house set the Capricorn terms: $occupants.length occupant(s)", ({ occupants, cook, salt, revive }) => {
    const t = terms(occupants);
    expect(t.cook).toEqual({ cost: cook[0], effects: [A(cook[1]!)] });
    expect(t.salt).toEqual({ cost: 0, effects: [A(salt), RESOLVE] });
    expect(t.revive!.cost).toBe(revive);
    expect(t.hang).toEqual({ cost: 0, effects: [] });
  });

  it("changes only existing costs and leaves gifts unchanged", () => {
    const leo = getScenario("home-leo-harvest").options.find((o) => o.id === "place")!;
    expect(withOccupants(leo, [mercury])).toEqual(leo);
    expect(withOccupants(leo, [saturn]).result.effects).toEqual([A(24), { kind: "light", delta: 132 }]);
    const loft = getScenario("home-pisces-flood").options.find((o) => o.id === "loft")!;
    expect(withOccupants(loft, [mercury])).toEqual(loft);
    const gift = { id: "gift", text: "Rest.", result: { effects: [A(-24), RESOLVE] } };
    for (const occupant of [mercury, saturn, moon]) expect(withOccupants(gift, [occupant])).toEqual(gift);
    const walk = { id: "walk", text: "Walk on.", result: { effects: [{ kind: "light", delta: -12 } as Outcome] } };
    expect(withOccupants(walk, [saturn]).result.effects).toEqual([{ kind: "light", delta: 0 }]);
    expect(withOccupants(walk, [moon]).result.effects).toEqual([{ kind: "light", delta: -36 }]);
  });

  it("commits on the house's terms and names the occupants on screen", () => {
    const { prince, run, scenario, context } = setup("home-capricorn-salting");
    prince.chart.ascendantSign = "Libra"; // house IV holds Capricorn
    for (const p of PLANETS) prince.chart.planets[p].sign = "Aries";
    Object.assign(prince.chart.planets.Saturn, { sign: "Capricorn", dignity: "Domicile" });
    run.state.Moon.affliction = 36;
    expect(occupantLine(context().occupants)).toBe("Saturn is in this house: the terms are better.");
    expect(describeOption(context(), offeredOptions(scenario, context()).find((o) => o.id === "salt")!)).toBe("+12 Resolve on a chosen planet");
    const next = resolveNarrative(run, prince, scenario, "cook", { chosen: "Moon" })!;
    expect(next.light).toBe(run.light);
    expect(next.state.Moon.affliction).toBe(12);
    Object.assign(prince.chart.planets.Moon, { sign: "Capricorn", dignity: "Detriment" });
    expect(occupantLine(context().occupants)).toBe("Moon and Saturn are in this house: the terms are unchanged.");
  });

  it("applies a stat gain after the effects before it, against the ceiling they left", () => {
    const { prince, run, context } = setup("home-capricorn-salting");
    const ceiling = combustionCeiling(prince.chart.planets.Moon);
    const salt = [A(12), RESOLVE];
    run.state.Moon.affliction = ceiling - 12; // the take lands on the ceiling, so nothing is left to raise
    expect(applyOutcomes(run, context(), salt, { chosen: "Moon" }).ok).toBe(false);
    expect(applyOutcomes(run, context(), [RESOLVE, A(12)], { chosen: "Moon" }).ok).toBe(true);
    run.state.Moon.affliction = ceiling - 24;
    const applied = applyOutcomes(run, context(), salt, { chosen: "Moon" });
    if (!applied.ok) throw new Error(applied.reason);
    expect(applied.run.gains.Moon.resolve).toBe(12);
    expect(run.gains.Moon.resolve).toBe(0);
    expect(combustionCeiling(runChart(prince.chart, applied.run).planets.Moon)).toBe(ceiling + 12);
    expect(describeOption(context(), { id: "salt", text: "", result: { effects: salt } }, { chosen: "Moon" }))
      .toBe("Afflict 12 on Moon · +12 Resolve");
  });

  it("records the option's own text when it carries no result text", () => {
    const { run, prince, scenario } = setup("home-libra-mara");
    const next = resolveNarrative(run, prince, scenario, "thank", {})!;
    expect(next.encounter?.kind === "narrative" && next.encounter.resolutionText).toBe("Thank Mara by name.");
    expect(next.map.outcomes[run.map.currentNodeId]?.summary).toBe("Home · Thank Mara by name.");
  });
});
