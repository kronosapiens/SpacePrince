import { describe, expect, it, vi } from "vitest";
import { getScenario, NARRATIVE_SCENARIOS, pickScenario, SCENARIOS_BY_HOUSE } from "@/data/narrative-scenarios";
import { HOUSES } from "@/data/houses";
import { applyOutcomes, availableSelections, buildNarrativeContext, conditioningPlanet, joyPresent, joyStrong, previewOption, resolveNarrative, resolveTargets, rulerStrong, selectionSlots, wagerOdds } from "@/game/narrative";
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
        for (const result of [option.result, ...(option.failure ? [option.failure] : [])]) {
          expect(result.text.length).toBeGreaterThan(10);
          for (const effect of result.effects) {
            if ("delta" in effect) expect(effect.delta % 12).toBeCloseTo(0);
            if (effect.kind === "transfer") expect(effect.amount % 12).toBe(0);
          }
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
    expect(resolveNarrative(run, prince, scenario, "bed", { chosen: "Moon" }, () => 0)).toBeNull();
    const revived = resolveNarrative(run, prince, scenario, "shelter", { chosen: "Venus" }, () => 0)!;
    expect(revived.state.Venus.affliction).toBe(combustionCeiling(prince.chart.planets.Venus) / 2);
    expect(revived.light).toBe(run.light - 60);
    darken("Moon");
    expect(offered()).toEqual(["bed", "hearth", "move"]);
  });

  it("offers both revival methods and an exit at the rite, with a fallback when everyone is lit", () => {
    const { scenario, context, darken } = setup("transformation-rite");
    const offered = () => scenario.options.filter((o) => !o.visibleIf || o.visibleIf(context())).map((o) => o.id);
    expect(offered()).toEqual(["offer", "leave"]);
    darken("Venus");
    expect(offered()).toEqual(["rite", "exchange", "leave"]);
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
    expect(describeOption(run, context(), option("rest"), { chosen: "Moon" })).toContain("relieve 48 affliction");
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
    const rng = vi.fn(() => 0);
    expect(resolveNarrative(run, prince, scenario, "finish", { chosen: "Moon" }, rng)).toBeNull();
    expect(rng).not.toHaveBeenCalled();
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

  it("transfers exact affliction between distinct lit planets", () => {
    const { run, context, option, darken } = setup("relationships-stranger");
    run.state.Moon.affliction = 48;
    const preview = previewOption(run, context(), option("shift"), { chosen: "Moon", recipient: "Saturn" });
    expect(preview.ok).toBe(true);
    if (!preview.ok) throw new Error(preview.reason);
    expect(preview.success.state.Moon.affliction).toBe(12);
    expect(preview.success.state.Saturn.affliction).toBe(36);
    expect(preview.success.light).toBe(run.light);
    expect(previewOption(run, context(), option("shift"), { chosen: "Moon", recipient: "Moon" }).ok).toBe(false);
    expect(previewOption(run, context(), option("shift"), { chosen: "Saturn", recipient: "Moon" }).ok).toBe(false);
    darken("Saturn");
    expect(previewOption(run, context(), option("shift"), { chosen: "Moon", recipient: "Saturn" }).ok).toBe(false);
  });

  it("revives a selected planet at half ceiling for a full price or a living sacrifice", () => {
    const { run, prince, context, option, darken } = setup("transformation-rite");
    darken("Venus");
    run.light = 0;
    expect(previewOption(run, context(), option("rite"), { chosen: "Venus" }).ok).toBe(false);
    const exchanged = previewOption(run, context(), option("exchange"), { chosen: "Moon", recipient: "Venus" });
    expect(exchanged.ok).toBe(true);
    if (!exchanged.ok) throw new Error(exchanged.reason);
    expect(exchanged.success.state.Moon.affliction).toBe(combustionCeiling(prince.chart.planets.Moon));
    expect(exchanged.success.state.Venus.affliction).toBe(combustionCeiling(prince.chart.planets.Venus) / 2);
    expect(exchanged.success.light).toBe(0);
    run.light = 84;
    const paid = previewOption(run, context(), option("rite"), { chosen: "Venus" });
    expect(paid.ok && paid.success.light).toBe(0);
    expect(paid.ok && paid.success.state.Venus.affliction).toBe(exchanged.success.state.Venus.affliction);
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

  it("uses lit, unlocked Fortune with a deterministic fallback", () => {
    const { context, darken } = setup("creativity-dice");
    expect(conditioningPlanet(context())).toBe("Venus");
    darken("Venus");
    expect(conditioningPlanet(context())).toBe("Sun");
    darken("Sun");
    expect(conditioningPlanet(context())).toBe("Moon");
    const early = setup("creativity-dice", 0);
    expect(wagerOdds(early.context())?.planet).toBe("Moon");
  });

  it("charges a single wager's stake on either outcome and rolls exactly once", () => {
    const { run, prince, scenario, context, option } = setup("creativity-dice");
    const preview = previewOption(run, context(), option("bet"));
    expect(preview.ok).toBe(true);
    if (!preview.ok) throw new Error(preview.reason);
    const win = vi.fn(() => 0);
    const miss = vi.fn(() => 0.999999);
    const won = resolveNarrative(run, prince, scenario, "bet", {}, win)!;
    const lost = resolveNarrative(run, prince, scenario, "bet", {}, miss)!;
    expect(won.light - run.light).toBe(60);
    expect(lost.light - run.light).toBe(-24);
    expect(won.state).toEqual(preview.success.state);
    expect(lost.state).toEqual(preview.failure!.state);
    expect(win).toHaveBeenCalledTimes(1);
    expect(miss).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid wager branch and hidden approach without consuming a roll", () => {
    const { run, prince, scenario, context, option } = setup("creativity-dice", 0);
    const rng = vi.fn(() => 0);
    run.state.Moon.affliction = combustionCeiling(prince.chart.planets.Moon) - 12;
    expect(previewOption(run, context(), option("dare"), { chosen: "Moon" }).ok).toBe(false);
    expect(resolveNarrative(run, prince, scenario, "dare", { chosen: "Moon" }, rng)).toBeNull();
    expect(resolveNarrative(run, prince, scenario, "play", { chosen: "Moon" }, rng)).toBeNull();
    expect(rng).not.toHaveBeenCalled();
  });

  it("records the result once and rejects resolved, missing, or mismatched encounters", () => {
    const { run, prince, scenario } = setup("livelihood-coin");
    const rng = vi.fn(() => 0);
    const next = resolveNarrative(run, prince, scenario, "take", {}, rng)!;
    expect(next.encounter?.resolved).toBe(true);
    expect(next.encounter?.kind === "narrative" && next.encounter.resolutionText).toBe(scenario.options[0]!.result.text);
    expect(next.map.outcomes[run.map.currentNodeId]?.lightDelta).toBe(12);
    expect(next.seenFragmentIds).toEqual(["test-fragment"]);
    expect(rng).not.toHaveBeenCalled();
    expect(resolveNarrative(next, prince, scenario, "take", {}, rng)).toBeNull();
    expect(resolveNarrative({ ...run, encounter: null }, prince, scenario, "take", {}, rng)).toBeNull();
    expect(resolveNarrative(run, prince, getScenario("home-hearth"), "take", {}, rng)).toBeNull();
    expect(resolveNarrative(run, prince, scenario, "invented", {}, rng)).toBeNull();
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
              expect(Object.keys(selection)).toHaveLength(selectionSlots(option).length);
              const preview = previewOption(run, ctx, option, selection);
              if (!preview.ok) throw new Error(preview.reason);
              const branches = [{ roll: 0, expected: preview.success }];
              if (preview.failure) branches.push({ roll: 0.999999, expected: preview.failure });
              for (const { roll, expected } of branches) {
                const next = resolveNarrative(run, prince, scene, option.id, selection, () => roll)!;
                expect(next.state).toEqual(expected.state);
                expect(next.light).toBe(expected.light);
                for (const p of PLANETS) if (!roster.includes(p)) expect(next.state[p]).toEqual(run.state[p]);
              }
            }
          }
        }
      }
    }
  });
});
