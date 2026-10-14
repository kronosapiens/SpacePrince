import { describe, expect, it } from "vitest";
import { getScenario, NARRATIVE_SCENARIOS, pickScenario, SCENARIOS_BY_HOUSE } from "@/data/narrative-scenarios";
import {
  anyCombusted, applyOutcomes, availableSelections, buildNarrativeContext, joyPresent, joyStrong, offeredOptions,
  previewOption, resolveNarrative, resolveTargets, rulerStrong, requiresPlanet, withOccupants,
  type NarrativeScenario, type Occupant, type Outcome,
} from "@/game/narrative";
import { joyChoice } from "@/data/narrative-scenarios";
import { NARRATIVE_ECONOMY } from "@/data/economy";
import { runChart } from "@/game/chart";
import { beginNarrativeEncounter } from "@/game/encounter";
import { combustionCeiling } from "@/game/combust";
import { PLANETS } from "@/game/data";
import { beginRun } from "@/game/run";
import { mulberry32 } from "@/game/rng";
import { unlockedPlanets } from "@/game/unlocks";
import { describeOption, occupantLine } from "@/copy/narrative";
import { createStubPrince } from "./fixtures";

function setup(id = "self-still-water", numEncounters = 64) {
  const prince = createStubPrince({ numEncounters });
  const scenario = getScenario(id);
  const run = { ...beginRun(prince.chart, 42, numEncounters), light: 120 };
  run.encounter = beginNarrativeEncounter({ run, house: scenario.house, scenarioId: id });
  const context = () => buildNarrativeContext({ prince, run, house: scenario.house, unlocked: unlockedPlanets(numEncounters) });
  const option = (optionId: string) => scenario.options.find((o) => o.id === optionId)!;
  const darken = (p: typeof PLANETS[number]) => { run.state[p].affliction = combustionCeiling(prince.chart.planets[p]); };
  return { prince, run, scenario, context, option, darken };
}

const HOUSE_ONLY = NARRATIVE_SCENARIOS.filter((s) => !s.sign);

describe("single-decision narrative", () => {
  it("has two house-only scenes per house, unique choices, consequences, and lattice amounts", () => {
    expect(HOUSE_ONLY).toHaveLength(24);
    expect(new Set(NARRATIVE_SCENARIOS.map((s) => s.scenarioId)).size).toBe(NARRATIVE_SCENARIOS.length);
    for (let house = 1; house <= 12; house++) expect(HOUSE_ONLY.filter((s) => s.house === house)).toHaveLength(2);
    for (const scene of NARRATIVE_SCENARIOS) {
      expect(new Set(scene.options.map((o) => o.id)).size).toBe(scene.options.length);
      for (const option of scene.options) {
        expect((option.cost ?? 0) % 12).toBe(0);
        if (!scene.sign) expect(option.result.text!.length).toBeGreaterThan(10);
        for (const effect of option.result.effects) {
          if ("delta" in effect) expect(effect.delta % 12).toBeCloseTo(0);
          if (effect.kind === "gain") expect(effect.amount % 12).toBe(0);
        }
      }
    }
  });

  it.each(HOUSE_ONLY)("$scenarioId offers at most three choices across chart conditions", (scene) => {
    for (const count of [0, 1, 2, 4, 8, 16, 32]) {
      const { prince, run, context, darken } = setup(scene.scenarioId, count);
      for (const dignity of ["Neutral", "Domicile", "Exaltation", "Detriment", "Fall"] as const) {
        for (const p of PLANETS) prince.chart.planets[p].dignity = dignity;
        for (const affliction of [0, 95, 96, Infinity]) {
          for (const darkPlanet of [null, ...unlockedPlanets(count)]) {
            for (const p of PLANETS) {
              run.state[p].affliction = Math.min(affliction, combustionCeiling(prince.chart.planets[p]));
            }
            if (darkPlanet) darken(darkPlanet);
            const ctx = context();
            const offered = scene.options.filter((o) => !o.visibleIf || o.visibleIf(ctx));
            expect(offered.length, `${count}/${dignity}/${affliction}/${darkPlanet}`).toBeLessThanOrEqual(3);
            expect(offered.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("replaces focused Home recovery with revival and rejects the replaced offer", () => {
    const { prince, run, scenario, context, darken } = setup("home-hearth");
    prince.chart.planets.Moon.dignity = "Domicile";
    const offered = () => scenario.options.filter((o) => !o.visibleIf || o.visibleIf(context())).map((o) => o.id);
    expect(offered()).toEqual(["bed", "hearth", "move"]);
    run.state.Moon.affliction = 12;
    darken("Venus");
    expect(offered()).toEqual(["shelter", "hearth", "move"]);
    expect(resolveNarrative(run, prince, scenario, "bed", { chosen: "Moon" })).toBeNull();
    const revived = resolveNarrative(run, prince, scenario, "shelter", { chosen: "Venus" })!;
    expect(revived.state.Venus.affliction).toBe(combustionCeiling(prince.chart.planets.Venus) / 2);
    expect(revived.light).toBe(run.light - 60);
    darken("Moon");
    expect(offered()).toEqual(["bed", "hearth", "move"]);
  });

  it("offers paid revival, rest, and an exit at the rite, with work when everyone is lit", () => {
    const { scenario, context, darken } = setup("transformation-rite");
    const offered = () => scenario.options.filter((o) => !o.visibleIf || o.visibleIf(context())).map((o) => o.id);
    expect(offered()).toEqual(["offer", "rest", "leave"]);
    darken("Venus");
    expect(offered()).toEqual(["rite", "rest", "leave"]);
  });

  it("prefers unseen scenarios and recycles an exhausted house", () => {
    const scenes = SCENARIOS_BY_HOUSE[5]!;
    expect(pickScenario(5, "Leo", [scenes[0]!.scenarioId], mulberry32(1))).toBe(scenes[1]);
    expect(scenes).toContain(pickScenario(5, "Leo", scenes.map((s) => s.scenarioId), mulberry32(1)));
  });

  it("requires the full price before healing and leaves failed purchases untouched", () => {
    const { run, context, option } = setup("self-still-water", 0);
    run.state.Moon.affliction = 12;
    run.light = 12;
    const before = structuredClone(run);
    expect(previewOption(run, context(), option("rest"), { chosen: "Moon" })).toEqual({ ok: false, reason: "Requires 24 Light; you have 12." });
    expect(run).toEqual(before);
    run.light = 24;
    const preview = previewOption(run, context(), option("rest"), { chosen: "Moon" });
    expect(preview.ok).toBe(true);
    if (!preview.ok) throw new Error(preview.reason);
    expect(preview.success.light).toBe(0);
    expect(preview.success.state.Moon.affliction).toBe(0);
    expect(run.state.Moon.affliction).toBe(12);
    expect(describeOption(context(), option("rest"), { chosen: "Moon" })).toBe("Testify 60 on Moon · Lose 24 Light");
  });

  it.each([
    { scene: "home-hearth", id: "hearth", text: "Testify 24 on each lit planet · Lose 24 Light" },
    { scene: "hidden-weight", id: "wait", text: "Lose 12 Light" },
  ])("keeps $scene's authored amounts independent of current resources", ({ scene, id, text }) => {
    const { run, context, option } = setup(scene);
    run.state.Sun.affliction = 10;
    run.state.Moon.affliction = 48;
    for (const light of [0, 5, 120]) {
      run.light = light;
      expect(describeOption(context(), option(id))).toBe(text);
    }
  });

  it("does not sell healing to a clean or combusted target", () => {
    const { run, context, option, darken } = setup("self-still-water", 0);
    run.state.Moon.affliction = 0;
    expect(previewOption(run, context(), option("rest"), { chosen: "Moon" }).ok).toBe(false);
    darken("Moon");
    expect(previewOption(run, context(), option("rest"), { chosen: "Moon" }).ok).toBe(false);
  });

  it("ordinary Light losses clamp to zero, separately from purchases", () => {
    const { run, context } = setup();
    run.light = 12;
    const loss = applyOutcomes(run, context(), [{ kind: "light", delta: -24 }]);
    expect(loss.ok && loss.run.light).toBe(0);
    const gain = applyOutcomes(run, context(), [{ kind: "light", delta: 36 }]);
    expect(gain.ok && gain.run.light).toBe(48);
  });

  it("rejects locked or combusted costs before awarding Light", () => {
    const { run, prince, scenario, context, option, darken } = setup("creativity-song", 0);
    expect(previewOption(run, context(), option("finish"), { chosen: "Venus" }).ok).toBe(false);
    darken("Moon");
    expect(resolveNarrative(run, prince, scenario, "finish", { chosen: "Moon" })).toBeNull();
    expect(run.light).toBe(120);
  });

  it("requires the full affliction cost, allowing exact-ceiling combustion", () => {
    const { run, context, option, prince } = setup("creativity-song");
    const ceiling = combustionCeiling(prince.chart.planets.Saturn);
    run.state.Saturn.affliction = ceiling - 24;
    expect(previewOption(run, context(), option("finish"), { chosen: "Saturn" }).ok).toBe(false);
    run.state.Saturn.affliction = ceiling - 48;
    const preview = previewOption(run, context(), option("finish"), { chosen: "Saturn" });
    expect(preview.ok && preview.success.state.Saturn.affliction).toBe(ceiling);
    expect(describeOption(context(), option("finish"), { chosen: "Saturn" })).toBe("Afflict 48 on Saturn · Gain 48 Light");
  });

  it("healthiest means greatest remaining combustion margin", () => {
    const { prince, run, context } = setup();
    const ctx = { ...context(), unlocked: ["Moon", "Saturn"] as typeof PLANETS[number][] };
    prince.chart.planets.Moon.base.resolve = 24;
    prince.chart.planets.Moon.buffs.resolve = 0;
    prince.chart.planets.Saturn.base.resolve = 120;
    prince.chart.planets.Saturn.buffs.resolve = 0;
    run.state.Saturn.affliction = 72;
    expect(resolveTargets("healthiest", ctx)).toEqual(["Saturn"]);
  });

  it("revives only a selected extinguished planet at half ceiling for the full price", () => {
    const { run, prince, context, option, darken } = setup("transformation-rite");
    darken("Venus");
    run.light = 72;
    expect(previewOption(run, context(), option("rite"), { chosen: "Venus" }).ok).toBe(false);
    run.light = 84;
    expect(availableSelections(run, context(), option("rite"))).toEqual([{ chosen: "Venus" }]);
    expect(previewOption(run, context(), option("rite"), { chosen: "Moon" }).ok).toBe(false);
    expect(previewOption(run, context(), option("rite")).ok).toBe(false);
    const paid = previewOption(run, context(), option("rite"), { chosen: "Venus" });
    expect(paid.ok && paid.success.light).toBe(0);
    expect(paid.ok && paid.success.state.Venus.affliction).toBe(combustionCeiling(prince.chart.planets.Venus) / 2);
    expect(run.state.Venus.affliction).toBe(combustionCeiling(prince.chart.planets.Venus));
  });

  it("conditions options on both dignity and the planet's current state", () => {
    const { prince, run, context, darken } = setup();
    prince.chart.planets.Mercury.dignity = "Domicile";
    expect(joyStrong(context())).toBe(true);
    run.state.Mercury.affliction = 96;
    expect(joyPresent(context())).toBe(false);
    run.state.Mercury.affliction = 0;
    prince.chart.planets.Mercury.dignity = "Fall";
    expect(joyPresent(context())).toBe(true);
    expect(joyStrong(context())).toBe(false);
    prince.chart.planets.Mars.dignity = "Exaltation";
    expect(rulerStrong(context())).toBe(true);
    darken("Mars");
    expect(rulerStrong(context())).toBe(false);
  });

  it("rejects hidden choices and unaffordable work before awarding anything", () => {
    const { run, prince, scenario, context, option } = setup("creativity-dice", 0);
    run.state.Moon.affliction = combustionCeiling(prince.chart.planets.Moon) - 12;
    expect(previewOption(run, context(), option("work"), { chosen: "Moon" }).ok).toBe(false);
    expect(resolveNarrative(run, prince, scenario, "work", { chosen: "Moon" })).toBeNull();
    expect(resolveNarrative(run, prince, scenario, "play", { chosen: "Moon" })).toBeNull();
    expect(run.light).toBe(120);
  });

  it("records the result once and rejects resolved, missing, or mismatched encounters", () => {
    const { run, prince, scenario } = setup("livelihood-coin");
    const next = resolveNarrative(run, prince, scenario, "take", {})!;
    expect(next.encounter?.resolved).toBe(true);
    expect(next.encounter?.kind === "narrative" && next.encounter.resolutionText).toBe(scenario.options[0]!.result.text);
    expect(next.map.outcomes[run.map.currentNodeId]?.lightDelta).toBe(12);
    expect(resolveNarrative(next, prince, scenario, "take", {})).toBeNull();
    expect(resolveNarrative({ ...run, encounter: null }, prince, scenario, "take", {})).toBeNull();
    expect(resolveNarrative(run, prince, getScenario("home-hearth"), "take", {})).toBeNull();
    expect(resolveNarrative(run, prince, scenario, "invented", {})).toBeNull();
    expect(prince.numEncounters).toBe(64); // advancement belongs to encounter clear
  });

  it("keeps every house playable at every unlock tier and validates every preview against commit", () => {
    for (const count of [0, 1, 2, 4, 8, 16, 32]) {
      for (const scene of NARRATIVE_SCENARIOS) {
        for (const condition of ["clean", "afflicted", "one-dark"] as const) {
          const { run, prince, context, darken } = setup(scene.scenarioId, count);
          const roster = unlockedPlanets(count);
          if (condition !== "clean") for (const p of roster) run.state[p].affliction = 24;
          if (condition === "one-dark" && roster.length > 1) darken(roster[roster.length - 1]!);
          const ctx = context();
          const offered = offeredOptions(scene, ctx);
          expect(offered.some((o) => availableSelections(run, ctx, o).length), `${scene.scenarioId}/${count}/${condition}`).toBe(true);
          for (const option of offered) {
            for (const selection of availableSelections(run, ctx, option)) {
              expect(Object.values(selection).every((p) => roster.includes(p))).toBe(true);
              expect(Object.keys(selection)).toHaveLength(requiresPlanet(option) ? 1 : 0);
              const preview = previewOption(run, ctx, option, selection);
              if (!preview.ok) throw new Error(preview.reason);
              const next = resolveNarrative(run, prince, scene, option.id, selection)!;
              expect(next.state).toEqual(preview.success.state);
              expect(next.gains).toEqual(preview.success.gains);
              expect(next.light).toBe(preview.success.light);
              for (const p of PLANETS) if (!roster.includes(p)) expect(next.state[p]).toEqual(run.state[p]);
            }
          }
        }
      }
    }
  });
});

const SIGNED = NARRATIVE_SCENARIOS.filter((s) => s.sign);
const A = (delta: number, target: "chosen" | "allUnlocked" = "chosen"): Outcome => ({ kind: "affliction", target, delta });
const RESOLVE: Outcome = { kind: "gain", target: "chosen", stat: "resolve", amount: 12 };

describe("house-and-sign scenes", () => {
  it.each(SIGNED)("$scenarioId offers trades and a walk-away, adds joy and revival only under their predicates, and always leaves a choice", (scene) => {
    const standard = scene.options.filter((o) => !o.visibleIf);
    expect(standard).toHaveLength(3);
    expect(standard.some((o) => !o.cost && o.result.effects.every((e) => e.kind === "light" && e.delta < 0))).toBe(true);
    for (const o of scene.options) {
      if (o.visibleIf === anyCombusted) {
        expect(o).toMatchObject({ cost: NARRATIVE_ECONOMY.revive.cost, result: { effects: [{ kind: "uncombust", target: "chosen" }] } });
      } else expect([undefined, joyPresent]).toContain(o.visibleIf);
    }
    const cases = [[0, "clean"], [0, "afflicted"], [32, "clean"], [32, "afflicted"], [32, "partly combusted"]] as const;
    for (const [count, condition] of cases) {
      const { run, context, darken } = setup(scene.scenarioId, count);
      run.light = 0;
      const roster = unlockedPlanets(count);
      if (condition !== "clean") for (const p of roster) run.state[p].affliction = 24;
      if (condition === "partly combusted") roster.slice(1).forEach(darken);
      const ctx = context();
      const offered = offeredOptions(scene, ctx);
      expect(offered).toHaveLength(3 + Number(joyPresent(ctx)) + Number(anyCombusted(ctx)));
      expect(offered.some((o) => availableSelections(run, ctx, o).length), `${count}/${condition}`).toBe(true);
    }
  });

  it("offers a joy choice only while the house's joy is present", () => {
    const base = getScenario("home-capricorn-salting");
    const scene: NarrativeScenario = {
      ...base, scenarioId: "fixture-joy", house: 1,
      options: [...base.options, joyChoice("joy", "Ask Mercury.", [A(-12)])],
    };
    const prince = createStubPrince();
    const run = beginRun(prince.chart, 42, 64);
    const offered = (count: number) =>
      offeredOptions(scene, buildNarrativeContext({ prince, run, house: 1, unlocked: unlockedPlanets(count) })).map((o) => o.id);
    expect(offered(0)).not.toContain("joy");
    run.state.Mercury.affliction = 0;
    expect(offered(64)).toContain("joy");
    run.state.Mercury.affliction = 96;
    expect(offered(64)).not.toContain("joy");
  });

  it("selects by house and sign, then by house, then recycles in the same order", () => {
    const house = SCENARIOS_BY_HOUSE[4]!;
    const capricorn = getScenario("home-capricorn-salting");
    expect(pickScenario(4, "Capricorn", [], mulberry32(1))).toBe(capricorn);
    const fallback = new Set(Array.from({ length: 40 }, (_, seed) => pickScenario(4, "Capricorn", [capricorn.scenarioId], mulberry32(seed))));
    expect([...fallback].sort((a, b) => a.scenarioId.localeCompare(b.scenarioId)))
      .toEqual(house.filter((s) => s !== capricorn).sort((a, b) => a.scenarioId.localeCompare(b.scenarioId)));
    expect(pickScenario(4, "Capricorn", house.map((s) => s.scenarioId), mulberry32(1))).toBe(capricorn);
  });

  const terms = (occupants: Occupant[]) => Object.fromEntries(getScenario("home-capricorn-salting").options
    .map((o) => withOccupants(o, occupants))
    .map((o) => [o.id, { cost: o.cost ?? 0, effects: o.result.effects }]));
  const mercury: Occupant = { planet: "Mercury", dignity: "Neutral" };
  const saturn: Occupant = { planet: "Saturn", dignity: "Domicile" };
  const moon: Occupant = { planet: "Moon", dignity: "Detriment" };
  it.each([
    { occupants: [], cook: [24, -24], salt: 12, revive: 180 },
    { occupants: [mercury], cook: [36, -36], salt: 12, revive: 180 },
    { occupants: [saturn], cook: [12, -36], salt: 0, revive: 156 },
    { occupants: [moon], cook: [60, -36], salt: 24, revive: 204 },
    { occupants: [saturn, moon], cook: [36, -36], salt: 12, revive: 180 },
  ])("planets in the house set the Capricorn terms: $occupants.length occupant(s)", ({ occupants, cook, salt, revive }) => {
    const t = terms(occupants);
    expect(t.cook).toEqual({ cost: cook[0], effects: [A(cook[1]!)] });
    expect(t.salt).toEqual({ cost: 0, effects: [A(salt), RESOLVE] });
    expect(t.revive!.cost).toBe(revive);
    expect(t.hang).toEqual({ cost: 0, effects: [] });
  });

  it("scales Light with presence, steps losses with dignity, and leaves gains alone", () => {
    const leo = getScenario("home-leo-harvest").options.find((o) => o.id === "place")!;
    expect(withOccupants(leo, [mercury]).result.effects).toEqual([A(48), { kind: "light", delta: 180 }]);
    expect(withOccupants(leo, [saturn]).result.effects).toEqual([A(36), { kind: "light", delta: 180 }]);
    const loft = getScenario("home-pisces-flood").options.find((o) => o.id === "loft")!;
    expect(withOccupants(loft, [mercury])).toMatchObject({ cost: 96, result: { effects: [A(-24, "allUnlocked")] } });
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
    expect(next.light).toBe(run.light - 12);
    expect(next.state.Moon.affliction).toBe(0);
    Object.assign(prince.chart.planets.Moon, { sign: "Capricorn", dignity: "Detriment" });
    expect(occupantLine(context().occupants)).toBe("Moon and Saturn are in this house: the terms are larger.");
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
