import { beforeEach, describe, expect, it } from "vitest";
import { blankGains, runChart } from "@/game/chart";
import { deriveStatTable, fortuneChance, getEffectiveStats } from "@/game/combat";
import { combustionCeiling } from "@/game/combust";
import { beginCombatEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { resolveNarrative } from "@/game/narrative";
import { mulberry32 } from "@/game/rng";
import { beginRun, isOver, rolloverMap } from "@/game/run";
import { resolveTurn } from "@/game/turn";
import { unlockedPlanets } from "@/game/unlocks";
import { getScenario } from "@/data/narrative-scenarios";
import { loadPrince, savePrince } from "@/state/prince";
import type { PlanetName, PlanetStats, Run } from "@/game/types";
import { createStubPrince } from "./fixtures";

const prince = createStubPrince();
const gain = (run: Run, planet: PlanetName, stat: keyof PlanetStats, amount: number): Run =>
  ({ ...run, gains: { ...run.gains, [planet]: { ...run.gains[planet], [stat]: run.gains[planet][stat] + amount } } });

describe("run gains", () => {
  beforeEach(() => localStorage.clear());

  it("raise effective stats, the ceiling, and the stat table once, leaving the natal chart alone", () => {
    const run = gain(gain(beginRun(prince.chart, 1), "Mars", "resolve", 12), "Mars", "luck", 12);
    const chart = runChart(prince.chart, run);
    expect(runChart(chart, run)).toEqual(chart);
    expect(combustionCeiling(chart.planets.Mars)).toBe(combustionCeiling(prince.chart.planets.Mars) + 12);
    expect(getEffectiveStats(chart, "Mars").luck).toBe(getEffectiveStats(prince.chart, "Mars").luck + 12);
    expect(prince.chart.planets.Mars.gains).toBeUndefined();
    const table = deriveStatTable(chart.planets.Mars);
    const row = (key: keyof PlanetStats) => table.rows.find((r) => r.key === key)!;
    expect(row("resolve")).toMatchObject({ gains: 12, total: table.resolve });
    expect(row("luck").gains).toBe(6);
    for (const r of table.rows) expect(r.core + r.placement + r.gains).toBe(r.total);
  });

  it("last from a narrative choice through later encounters and maps, and reset at a new run", () => {
    const scenario = getScenario("home-capricorn-salting");
    let run = beginRun(prince.chart, 3, prince.numEncounters);
    run = { ...run, encounter: beginNarrativeEncounter({ run, house: 4, scenarioId: scenario.scenarioId }) };
    const next = resolveNarrative(run, prince, scenario, "salt", { chosen: "Sun" })!;
    expect(next.gains.Sun.resolve).toBe(12);
    const combat = { ...next, encounter: beginCombatEncounter({ run: next, opponentSeed: 5, lifetimeEncounterCount: 64 }) };
    const turn = resolveTurn(combat, prince.chart, "Sun", "Testimony", mulberry32(1))!;
    expect(turn.run.gains).toEqual(next.gains);
    const crossed = rolloverMap({ ...turn.run, encounter: null }, prince.chart, unlockedPlanets(64), 9);
    expect(crossed.gains).toEqual(next.gains);
    savePrince({ ...prince, runs: [crossed] });
    expect(loadPrince()!.runs[0]!.gains).toEqual(next.gains);
    expect(beginRun(prince.chart, 4, 64).gains).toEqual(blankGains());
  });

  it("preserve gained ceilings when reloading", () => {
    const run = gain(beginRun(prince.chart, 5), "Moon", "resolve", 12);
    run.state.Moon.affliction = combustionCeiling(prince.chart.planets.Moon) + 6;
    savePrince({ ...prince, runs: [run] });
    expect(loadPrince()!.runs[0]!.state.Moon.affliction).toBe(run.state.Moon.affliction);

  });

  it("keep a planet lit in combat through a blow its natal Resolve could not hold", () => {
    const base = beginRun(prince.chart, 3, 64);
    const encounter = beginCombatEncounter({ run: base, opponentSeed: 5, lifetimeEncounterCount: 64 });
    encounter.opponentActions[0] = "Affliction";
    const incoming = getEffectiveStats(encounter.opponentChart, encounter.sequence[0]!).affliction;
    const affliction = Math.max(0, combustionCeiling(prince.chart.planets.Sun) - incoming);
    const run: Run = { ...base, encounter, state: { ...base.state, Sun: { affliction } } };
    expect(resolveTurn(run, prince.chart, "Sun", "Testimony", () => 0)!.log.playerCombust).toBe(true);
    const gained = resolveTurn(gain(run, "Sun", "resolve", incoming), prince.chart, "Sun", "Testimony", () => 0)!;
    expect(gained.log.playerCombust).toBe(false);
    expect(gained.run.state.Sun.affliction).toBe(affliction + incoming);
  });

  it("feed the map boundary's Fortune and decide when the run is over", () => {
    const run = beginRun(prince.chart, 6, 0);
    run.state.Moon = { affliction: combustionCeiling(prince.chart.planets.Moon) };
    const roll = (r: Run) => rolloverMap(r, prince.chart, ["Moon"], 11).map.boundary!.uncombusts[0]!.chance;
    const luck = getEffectiveStats(prince.chart, "Moon").luck;
    expect(roll(run)).toBe(fortuneChance(luck));
    expect(roll(gain(run, "Moon", "luck", 12))).toBe(fortuneChance(luck + 12));
    expect(isOver(run, prince.chart, 0)).toBe(true);
    expect(isOver(gain(run, "Moon", "resolve", 12), prince.chart, 0)).toBe(false);
  });
});
