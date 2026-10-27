import { describe, expect, it } from "vitest";
import { NARRATIVE_ECONOMY } from "@/data/economy";
import { HOUSES } from "@/data/houses";
import { getScenario, NARRATIVE_SCENARIOS, pickScenario, SCENARIOS_BY_HOUSE } from "@/data/narrative-scenarios";
import { blankGains, blankSideState, derivePlacements, getDignity, runChart } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { PLANETS, SIGNS, UNLOCK_THRESHOLDS } from "@/game/data";
import { beginNarrativeEncounter } from "@/game/encounter";
import {
  anyCombusted, joyPresent, narrativeContext, previewOption, requiresPlanet, resolveNarrative,
  visibleOptions, type NarrativeScenario,
} from "@/game/narrative";
import { mulberry32 } from "@/game/rng";
import { beginRun } from "@/game/run";
import type { PlanetName, Prince, Run } from "@/game/types";
import { unlockedPlanets } from "@/game/unlocks";
import { createStubPrince } from "./fixtures";

const BASE_PRINCE = createStubPrince();
const BASE_RUN = beginRun(BASE_PRINCE.chart, 42, 64);
type Occupancy = "empty" | "favorable" | "adverse" | "neutral" | "balanced";
type Condition = "clean" | "injured" | "near combustion" | "one lit";

function chartFor(scene: NarrativeScenario, occupancy: Occupancy) {
  const signIndex = SIGNS.indexOf(scene.sign);
  const strong = PLANETS.find((p) => ["Domicile", "Exaltation"].includes(getDignity(p, scene.sign)))!;
  const weak = PLANETS.find((p) => ["Detriment", "Fall"].includes(getDignity(p, scene.sign)))!;
  const neutral = PLANETS.find((p) => getDignity(p, scene.sign) === "Neutral")!;
  const occupants = occupancy === "balanced" ? [strong, weak]
    : occupancy === "favorable" ? [strong]
    : occupancy === "adverse" ? [weak]
    : occupancy === "neutral" ? [neutral] : [];
  const longitudes = Object.fromEntries(PLANETS.map((p, i) =>
    [p, (occupants.includes(p) ? signIndex : (signIndex + 1 + i) % 12) * 30 + 15],
  )) as Record<PlanetName, number>;
  return {
    ...BASE_PRINCE.chart,
    ...derivePlacements({ longitudes, ascendantLongitude: ((signIndex - scene.house + 13) % 12) * 30, isDiurnal: true }),
  };
}

function stateFor(scene: NarrativeScenario, prince: Prince, condition: Condition, light: number, gains = false) {
  const run: Run = { ...BASE_RUN, light, state: blankSideState(), gains: blankGains() };
  if (gains) for (const p of PLANETS) run.gains[p].resolve = 24;
  const chart = runChart(prince.chart, run);
  const roster = unlockedPlanets(prince.numEncounters);
  for (const [i, p] of roster.entries()) {
    const ceiling = combustionCeiling(chart.planets[p]);
    run.state[p].affliction = condition === "clean" ? 0
      : condition === "near combustion" ? ceiling - 1
      : condition === "one lit" && i > 0 ? ceiling
      : Math.min(ceiling - 12, 6 + i * 6);
  }
  run.encounter = beginNarrativeEncounter({ run, house: scene.house, scenarioId: scene.scenarioId });
  return run;
}

describe("narrative catalogue", () => {
  it("contains exactly five distinct scenes for all 144 house–sign pairs", () => {
    expect(NARRATIVE_SCENARIOS).toHaveLength(720);
    expect(new Set(NARRATIVE_SCENARIOS.map((s) => s.scenarioId)).size).toBe(720);
    expect(new Set(NARRATIVE_SCENARIOS.map((s) => s.text)).size).toBe(720);
    for (const house of HOUSES) for (const sign of SIGNS) {
      expect(SCENARIOS_BY_HOUSE[house.num]!.filter((s) => s.sign === sign), `${house.num}/${sign}`).toHaveLength(5);
    }
    for (const id of ["home-libra-mara", "home-capricorn-salting", "home-leo-harvest", "home-pisces-flood"]) {
      expect(getScenario(id).house).toBe(4);
    }
  });

  it("selects every matching scene before repeating, without borrowing another sign", () => {
    for (const house of HOUSES) for (const sign of SIGNS) {
      const seen: string[] = [];
      const rng = mulberry32(house.num * 12 + SIGNS.indexOf(sign));
      for (let i = 0; i < 5; i++) {
        const next = pickScenario(house.num, sign, seen, rng);
        expect(next).toMatchObject({ house: house.num, sign });
        expect(seen).not.toContain(next.scenarioId);
        seen.push(next.scenarioId);
      }
      const repeat = pickScenario(house.num, sign, seen, rng);
      expect(repeat).toMatchObject({ house: house.num, sign });
      expect(seen).toContain(repeat.scenarioId);
    }
  });

  it("uses supported effects, one selected planet, the number lattice, and additive joy/revival choices", () => {
    for (const scene of NARRATIVE_SCENARIOS) {
      const label = scene.scenarioId;
      expect(scene.house, label).toBeGreaterThanOrEqual(1);
      expect(scene.house, label).toBeLessThanOrEqual(12);
      expect(SIGNS, label).toContain(scene.sign);
      expect(scene.text.trim(), label).not.toBe("");
      expect(scene.options.length, label).toBeLessThanOrEqual(5);
      expect(new Set(scene.options.map((o) => o.id)).size, label).toBe(scene.options.length);
      expect(scene.options.filter((o) => o.visibleIf === joyPresent), label)
        .toHaveLength(HOUSES[scene.house - 1]!.joy ? 1 : 0);
      const revivals = scene.options.filter((o) => o.result.effects.some((e) => e.kind === "uncombust"));
      if (scene.house === 4) expect(revivals, label).toHaveLength(1);
      for (const option of scene.options) {
        expect(option.id.trim(), label).not.toBe("");
        expect(option.text.trim(), `${label}/${option.id}`).not.toBe("");
        expect([undefined, joyPresent, anyCombusted], label).toContain(option.visibleIf);
        expect(option.result.text, label).toBeUndefined();
        expect(Number.isFinite(option.cost ?? 0), label).toBe(true);
        expect(option.cost ?? 0, label).toBeGreaterThanOrEqual(0);
        expect((option.cost ?? 0) % 12, label).toBe(0);
        for (const effect of option.result.effects) {
          expect(["affliction", "light", "gain", "uncombust"], label).toContain(effect.kind);
          if ("target" in effect) {
            expect(["chosen", "allUnlocked", "mostAfflicted", "healthiest", "joy", "ruler"], label).toContain(effect.target);
            if (effect.target === "joy") expect(option.visibleIf, label).toBe(joyPresent);
          }
          if ("delta" in effect) {
            expect(Number.isFinite(effect.delta), label).toBe(true);
            expect(effect.delta % 12, label).toBeCloseTo(0);
          }
          if (effect.kind === "gain") {
            expect(["resolve", "affliction", "luck"], label).toContain(effect.stat);
            expect(effect.amount, label).toBeGreaterThan(0);
            expect(effect.amount % 12, label).toBe(0); // Fortune's displayed +6 is raw Luck +12.
          }
          if (effect.kind === "uncombust") {
            expect(effect.target, label).toBe("chosen");
            expect(option.visibleIf, label).toBe(anyCombusted);
            expect(option.cost, label).toBe(NARRATIVE_ECONOMY.revive.cost);
          }
        }
      }
    }
  });

  it.each(HOUSES)("$name remains playable at zero Light through every unlock tier and chart condition", (house) => {
    for (const scene of SCENARIOS_BY_HOUSE[house.num] ?? []) {
      for (const occupancy of ["empty", "favorable", "adverse"] as const) {
        const chart = chartFor(scene, occupancy);
        for (const numEncounters of UNLOCK_THRESHOLDS) {
          const prince = { ...BASE_PRINCE, chart, numEncounters };
          for (const condition of ["clean", "injured", "near combustion", "one lit"] as const) {
            const run = stateFor(scene, prince, condition, 0);
            const offered = visibleOptions(run, narrativeContext(prince, run, scene.house), scene);
            const label = `${scene.scenarioId}/${numEncounters}/${occupancy}/${condition}`;
            expect(offered.length, label).toBeLessThanOrEqual(5);
            expect(offered.some(({ selections }) => selections.length), label).toBe(true);
          }
        }
      }
    }
  });

  it.each(HOUSES)("$name previews and commits the same effects for every eligible selection", (house) => {
    const cases = [
      { occupancy: "empty", condition: "clean", light: 360 },
      { occupancy: "neutral", condition: "injured", light: 24 },
      { occupancy: "favorable", condition: "injured", light: 48 },
      { occupancy: "adverse", condition: "injured", light: 360 },
      { occupancy: "balanced", condition: "one lit", light: 360 },
    ] as const;
    for (const scene of SCENARIOS_BY_HOUSE[house.num] ?? []) {
      const executable = new Set<string>();
      for (const { occupancy, condition, light } of cases) {
        const prince = { ...BASE_PRINCE, chart: chartFor(scene, occupancy) };
        const run = stateFor(scene, prince, condition, light, true);
        const ctx = narrativeContext(prince, run, scene.house);
        const before = JSON.stringify(run);
        for (const { option, selections } of visibleOptions(run, ctx, scene)) {
          for (const selection of selections) {
            const label = `${scene.scenarioId}/${option.id}/${occupancy}/${selection.chosen ?? "all"}`;
            expect(Object.keys(selection), label).toHaveLength(requiresPlanet(option) ? 1 : 0);
            if (selection.chosen) expect(ctx.unlocked, label).toContain(selection.chosen);
            const preview = previewOption(run, ctx, option, selection);
            if (!preview.ok) throw new Error(`${label}: ${preview.reason}`);
            const next = resolveNarrative(run, prince, scene, option.id, selection)!;
            expect(next, label).not.toBeNull();
            expect({ state: next.state, gains: next.gains, light: next.light }, label)
              .toEqual({ state: preview.success.state, gains: preview.success.gains, light: preview.success.light });
            expect(next.light, label).toBeGreaterThanOrEqual(0);
            expect(resolveNarrative(next, prince, scene, option.id, selection), label).toBeNull();
            executable.add(option.id);
          }
        }
        expect(JSON.stringify(run), scene.scenarioId).toBe(before);
      }
      expect([...executable].sort(), scene.scenarioId).toEqual(scene.options.map((o) => o.id).sort());
    }
  });
});
