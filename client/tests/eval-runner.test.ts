import { describe, expect, it } from "vitest";
import { runTrial } from "@/eval/runner";
import type { Step, Trial } from "@/eval/play";
import type { Strategy } from "@/eval/policies";
import { seededChart } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { PLANETS } from "@/game/data";
import type { PlanetName } from "@/game/types";

const trial = (chartSeed: number, gameSeed: number, strategySeed = 0, strategy: Strategy = "random"): Trial =>
  ({ chartSeed, gameSeed, strategy, strategySeed });
// Run before any other trial, so replaying them later shows nothing else leaks in.
const strategic = (["survival", "light"] as const).map((s) => runTrial(trial(3, 7, 0, s)));
const batch = [1, 2, 3, 4, 5].flatMap((c) => [1, 2, 3, 4, 5].map((g) => runTrial(trial(c, g))));

describe("seeded runner", () => {
  it("replays a trial exactly, whatever ran before it", () => {
    const first = runTrial(trial(3, 7));
    runTrial(trial(3, 7, 1));
    runTrial(trial(4, 2));
    expect(runTrial(trial(3, 7))).toEqual(first);
    for (const record of strategic) expect(runTrial(record.trial)).toEqual(record);
    expect(JSON.parse(JSON.stringify(first))).toEqual(first);
  });

  it("gives every strategy and strategy seed the same maps, indexed by map number", () => {
    const a = runTrial(trial(3, 7, 0)).steps;
    const b = runTrial(trial(3, 7, 1)).steps;
    expect(b).not.toEqual(a);
    const seedByMap = new Map<number, number>();
    for (const steps of [a, b, ...strategic.map((r) => r.steps)]) {
      for (const s of steps) {
        if (s.kind !== "boundary") continue;
        expect(s.seed).toBe(seedByMap.get(s.map) ?? s.seed);
        seedByMap.set(s.map, s.seed);
      }
    }
    expect(seedByMap.size).toBeGreaterThan(1);
  });

  it("plays random runs through narrative choices, map boundaries, revival, combustion, and completion", () => {
    const summaries = batch.map((r) => r.summary);
    expect(batch.some((r) => r.steps.some((s) => s.kind === "narrative"))).toBe(true);
    expect(batch.some((r) => r.steps.some((s) => s.kind === "boundary" && s.map > 1))).toBe(true);
    expect(summaries.some((s) => s.boundaryRevivals > 0)).toBe(true);
    expect(summaries.some((s) => s.endReason === "combustion")).toBe(true);
    expect(summaries.some((s) => s.endReason === "completion" && s.mapsCompleted === 7)).toBe(true);
    // `resolveTurn` silently zeroes a combusted planet, so only this shows every turn sent a lit one.
    const sentDark = batch.flatMap((r) => {
      const chart = seededChart(r.trial.chartSeed);
      return r.steps.filter((s, i) =>
        s.kind === "turn" && r.steps[i - 1]!.affliction[s.planet] >= combustionCeiling(chart.planets[s.planet]));
    });
    expect(sentDark).toEqual([]);
    // A fresh chart takes necessity on every fielded planet, so this shows all seven start unlocked.
    for (const { steps: [first] } of batch) {
      expect(first?.kind === "boundary" && first.necessity.map((n) => n.planet)).toEqual(PLANETS);
    }
  });

  it("summarizes what the steps record", () => {
    for (const { trial, steps, summary } of batch) {
      const chart = seededChart(trial.chartSeed);
      const dark = (s: Step, p: PlanetName) => s.affliction[p] >= combustionCeiling(chart.planets[p]);
      let combustions = 0, revivals = 0, light = 0;
      steps.forEach((s, i) => {
        const prev = steps[i - 1];
        if (prev) for (const p of PLANETS) {
          if (!dark(prev, p) && dark(s, p)) combustions++;
          if (dark(prev, p) && !dark(s, p)) revivals++;
        }
        if (s.kind === "turn") light += s.lightGain;
        if (s.kind === "narrative") light += s.lightDelta;
      });
      // An encounter counts once survived: a run that combusts leaves its last one out.
      const kinds = steps.flatMap((s) => (s.kind === "enter" ? [s.encounter] : []));
      const fatal = summary.endReason === "combustion" ? kinds.at(-1) : undefined;
      const survived = (kind: string) => kinds.filter((k) => k === kind).length - (kind === fatal ? 1 : 0);
      expect({ combustions, revivals, light, combat: survived("combat"), narrative: survived("narrative") }).toEqual({
        combustions: summary.combustions,
        revivals: summary.boundaryRevivals + summary.narrativeRevivals,
        light: summary.light,
        combat: summary.combatEncounters,
        narrative: summary.narrativeEncounters,
      });
    }
  });

  it("ends a run whose planets all combust before the combat's last turn", () => {
    const lastEntry = (r: (typeof batch)[number]) => r.steps.map((s) => s.kind).lastIndexOf("enter");
    // Combat length is the map number; the run ended with turns left.
    const record = batch.find((r) =>
      r.steps.at(-1)!.kind === "turn" && r.steps.length - 1 - lastEntry(r) < r.summary.terminalMap,
    )!;
    const entry = lastEntry(record);
    const last = record.steps.at(-1)!;
    const chart = seededChart(record.trial.chartSeed);
    expect(PLANETS.every((p) => last.affliction[p] >= combustionCeiling(chart.planets[p]))).toBe(true);
    expect(record.summary.endReason).toBe("combustion");
    // The summary alone names the encounter and the choice the run ended on.
    const entered = record.steps[entry]!;
    if (entered.kind !== "enter" || entered.encounter !== "combat" || last.kind !== "turn") throw new Error("Expected a combat ending");
    expect(record.summary).toMatchObject({ terminalRuler: entered.ruler, lastPlanet: last.planet, lastVerb: last.verb });
  });
});
