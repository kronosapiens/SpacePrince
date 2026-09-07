import { describe, expect, it } from "vitest";
import { getScenario, NARRATIVE_SCENARIOS, pickScenario, SCENARIOS_BY_HOUSE } from "@/data/narrative-scenarios";
import { HOUSES } from "@/data/houses";
import { applyOutcomes, availableSelections, buildNarrativeContext, joyPresent, joyStrong, previewOption, resolveNarrative, resolveTargets, rulerStrong, requiresPlanet } from "@/game/narrative";
import { beginNarrativeEncounter } from "@/game/encounter";
import { combustionCeiling } from "@/game/combust";
import { PLANETS } from "@/game/data";
import { beginRun } from "@/game/run";
import { mulberry32 } from "@/game/rng";
import { unlockedPlanets } from "@/game/unlocks";
import { describeOption } from "@/copy/narrative";
import { createStubPrince } from "./fixtures";

function setup(id = "self-still-water", numEncounters = 64) {
  const prince = createStubPrince({ numEncounters });
  const scenario = getScenario(id);
  const run = { ...beginRun(42, numEncounters), light: 120 };
  run.encounter = beginNarrativeEncounter({ run, house: scenario.house, scenarioId: id, fragmentId: "test-fragment" });
  const context = () => {
    const house = HOUSES[scenario.house - 1]!;
    return buildNarrativeContext({ prince, run, joyPlanet: house.joy, rulerPlanet: house.ruler, unlocked: unlockedPlanets(numEncounters) });
  };
  const option = (optionId: string) => scenario.options.find((o) => o.id === optionId)!;
  const darken = (p: typeof PLANETS[number]) => { run.state[p].affliction = combustionCeiling(prince.chart.planets[p]); };
  return { prince, run, scenario, context, option, darken };
}

describe("single-decision narrative", () => {
  it("has two distinct scenes per house, unique choices, consequences, and lattice amounts", () => {
    expect(NARRATIVE_SCENARIOS).toHaveLength(24);
    expect(new Set(NARRATIVE_SCENARIOS.map((s) => s.scenarioId)).size).toBe(24);
    for (const scenarios of Object.values(SCENARIOS_BY_HOUSE)) expect(scenarios).toHaveLength(2);
    for (const scene of NARRATIVE_SCENARIOS) {
      expect(new Set(scene.options.map((o) => o.id)).size).toBe(scene.options.length);
      for (const option of scene.options) {
        expect((option.cost ?? 0) % 12).toBe(0);
        expect(option.result.text.length).toBeGreaterThan(10);
        for (const effect of option.result.effects) {
          expect(["affliction", "uncombust", "light"]).toContain(effect.kind);
          if ("delta" in effect) expect(effect.delta % 12).toBeCloseTo(0);
        }
      }
    }
  });

  it.each(NARRATIVE_SCENARIOS)("$scenarioId offers at most three choices across chart conditions", (scene) => {
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
    run.state.Moon.affliction = 24;
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
    expect(pickScenario(5, [scenes[0]!.scenarioId], mulberry32(1))).toBe(scenes[1]);
    expect(scenes).toContain(pickScenario(5, scenes.map((s) => s.scenarioId), mulberry32(1)));
  });

  it("requires the full price before healing and leaves failed purchases untouched", () => {
    const { run, context, option } = setup("self-still-water", 0);
    run.state.Moon.affliction = 48;
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
    expect(run.state.Moon.affliction).toBe(48);
    expect(describeOption(run, context(), option("rest"), { chosen: "Moon" })).toContain("Testify 48 on Moon");
  });

  it("does not sell healing to a clean or combusted target", () => {
    const { run, context, option, darken } = setup("self-still-water", 0);
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
    const ceiling = combustionCeiling(prince.chart.planets.Moon);
    run.state.Moon.affliction = ceiling - 24;
    expect(previewOption(run, context(), option("finish"), { chosen: "Moon" }).ok).toBe(false);
    run.state.Moon.affliction = ceiling - 48;
    const preview = previewOption(run, context(), option("finish"), { chosen: "Moon" });
    expect(preview.ok && preview.success.state.Moon.affliction).toBe(ceiling);
    expect(describeOption(run, context(), option("finish"), { chosen: "Moon" })).toContain("Moon combusts");
  });

  it("healthiest means greatest remaining combustion margin", () => {
    const { prince, run, context } = setup();
    const ctx = { ...context(), unlocked: ["Moon", "Saturn"] as typeof PLANETS[number][] };
    prince.chart.planets.Moon.base.durability = 12;
    prince.chart.planets.Moon.buffs.durability = 0;
    prince.chart.planets.Saturn.base.durability = 60;
    prince.chart.planets.Saturn.buffs.durability = 0;
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
    expect(next.seenFragmentIds).toEqual(["test-fragment"]);
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
          const offered = scene.options.filter((o) => !o.visibleIf || o.visibleIf(ctx));
          expect(offered.some((o) => availableSelections(run, ctx, o).length), `${scene.scenarioId}/${count}/${condition}`).toBe(true);
          for (const option of offered) {
            for (const selection of availableSelections(run, ctx, option)) {
              expect(Object.values(selection).every((p) => roster.includes(p))).toBe(true);
              expect(Object.keys(selection)).toHaveLength(requiresPlanet(option) ? 1 : 0);
              const preview = previewOption(run, ctx, option, selection);
              if (!preview.ok) throw new Error(preview.reason);
              const next = resolveNarrative(run, prince, scene, option.id, selection)!;
              expect(next.state).toEqual(preview.success.state);
              expect(next.light).toBe(preview.success.light);
              for (const p of PLANETS) if (!roster.includes(p)) expect(next.state[p]).toEqual(run.state[p]);
            }
          }
        }
      }
    }
  });
});
