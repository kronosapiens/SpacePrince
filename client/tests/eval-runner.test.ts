import { describe, expect, it } from "vitest";
import { runTrial } from "@/eval/runner";
import type { Step, Trial } from "@/eval/play";
import { POLICIES, type Strategy } from "@/eval/policies";
import { runChart, seededChart } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { PLANETS } from "@/game/data";
import { unlockedPlanets } from "@/game/unlocks";
import type { PlanetName } from "@/game/types";

const trial = (chartSeed: number, gameSeed: number, strategySeed = 0, strategy: Strategy = "random"): Trial =>
  ({ chartSeed, gameSeed, strategy, strategySeed });
// Run before any other trial, so replaying them later shows nothing else leaks in.
const strategic = (["survival", "light"] as const).map((s) => runTrial(trial(3, 7, 0, s)));
const batch = [1, 2, 3, 4, 5].flatMap((c) => [1, 2, 3, 4, 5].map((g) => runTrial(trial(c, g))));
const completion = runTrial(trial(1524643982, 1569170341, 0, "survival"));
const progression = runTrial(trial(1, 1), undefined, { startingLifetimeRelationalEncounterCount: 0 });

describe("seeded runner", () => {
  it("counts only relational encounters toward lifetime progress", () => {
    const { steps, summary } = progression;
    const entries = steps.filter((s) => s.kind === "enter");
    expect(entries.some((entry) => entry.encounter === "narrative")).toBe(true);
    let count = 0;
    for (const entry of entries) {
      expect(entry.lifetimeRelationalEncounterCount).toBe(count);
      if (entry.encounter === "relational") count++;
    }
    expect(summary.finalLifetimeRelationalEncounterCount).toBe(count);
    expect(runTrial(progression.trial, undefined, { startingLifetimeRelationalEncounterCount: 0 })).toEqual(progression);
  });

  it("clears a zero-turn wipe before checking the enlarged unlock roster", () => {
    let first = true;
    const policy = {
      ...POLICIES.random,
      route: (...args: Parameters<typeof POLICIES.random.route>) => {
        const [play, run] = args;
        const nodeId = POLICIES.random.route(...args);
        if (first) {
          first = false;
          run.map.rolledNodes[nodeId] = { kind: "relational", opponentSeed: 99 };
          for (const p of unlockedPlanets(15)) {
            play.prince.chart.planets[p].base.luck = 0;
            play.prince.chart.planets[p].buffs.luck = 0;
            run.state[p].affliction = combustionCeiling(play.prince.chart.planets[p]) - 12;
          }
        }
        return nodeId;
      },
    };
    const { steps } = runTrial(trial(1, 1), policy, { startingLifetimeRelationalEncounterCount: 15 });
    const [entered, unlocked, next] = steps.slice(1);
    expect(entered).toMatchObject({ kind: "enter", encounter: "relational", lifetimeRelationalEncounterCount: 15, wipe: true });
    expect(unlocked).toMatchObject({ kind: "unlock", planet: "Jupiter", lifetimeRelationalEncounterCount: 16, rescuedByUnlock: true, entryWipe: true });
    expect(next).toMatchObject({ kind: "enter", lifetimeRelationalEncounterCount: 16 });
    expect(unlocked!.light).toBe(entered!.light);
    expect(unlocked!.affliction.Jupiter).toBe(0);
  });

  it("can start the next fresh run at the previous run's final lifetime count", () => {
    const start = progression.summary.finalLifetimeRelationalEncounterCount;
    const next = runTrial(trial(1, 2), undefined, { startingLifetimeRelationalEncounterCount: start });
    expect(next.summary.startingLifetimeRelationalEncounterCount).toBe(start);
    expect(next.summary.finalLifetimeRelationalEncounterCount).toBe(start + next.steps.filter((s) => s.kind === "enter" && s.encounter === "relational").length);
    expect(Object.values(next.steps[0]!.affliction)).toEqual(PLANETS.map(() => 0));
    expect(Object.values(next.steps[0]!.gains).flatMap(Object.values).every((gain) => gain === 0)).toBe(true);
  });

  it("reconciles pressure with fielded capacity across relational, entries, gains, revivals and unlocks", () => {
    for (const record of [...batch, completion, progression]) {
      const { pressure: p, startingLifetimeRelationalEncounterCount: start, finalLifetimeRelationalEncounterCount: end } = record.summary;
      const chart = seededChart(record.trial.chartSeed);
      const capacity = (step: Step, count: number) => unlockedPlanets(count).reduce((sum, planet) =>
        sum + Math.max(0, combustionCeiling(runChart(chart, step).planets[planet]) - step.affliction[planet]), 0);
      expect(p.capacityStart).toBe(capacity(record.steps[0]!, start));
      expect(p.capacityEnd).toBe(capacity(record.steps.at(-1)!, end));
      expect(p.capacityEnd - p.capacityStart).toBe(
        p.relational.healing - p.relational.damage - p.entryDamage + p.narrativeHealing - p.narrativeDamage +
        p.narrativeRevivalRecovery + p.boundaryRevivalRecovery + p.resolveGain + p.unlockCapacity,
      );
    }
    expect([...batch, completion, progression].some((record) => record.summary.pressure.resolveGain > 0)).toBe(true);
    expect(progression.summary.pressure.unlockCapacity).toBeGreaterThan(0);
  });

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

  it("plays runs through narrative choices, map boundaries, revival, combustion, and completion", () => {
    const summaries = [...batch, completion].map((r) => r.summary);
    expect(batch.some((r) => r.steps.some((s) => s.kind === "narrative"))).toBe(true);
    expect(batch.some((r) => r.steps.some((s) => s.kind === "boundary" && s.map > 1))).toBe(true);
    expect(summaries.some((s) => s.boundaryRevivals > 0)).toBe(true);
    expect(summaries.some((s) => s.endReason === "combustion")).toBe(true);
    expect(summaries.some((s) => s.endReason === "completion" && s.mapsCompleted === 7)).toBe(true);
    // `resolveTurn` silently zeroes a combusted planet, so only this shows every turn sent a lit one.
    const sentDark = batch.flatMap((r) => {
      const chart = seededChart(r.trial.chartSeed);
      return r.steps.filter((s, i) => {
        if (s.kind !== "turn") return false;
        const prev = r.steps[i - 1]!;
        return prev.affliction[s.planet] >= combustionCeiling(runChart(chart, prev).planets[s.planet]);
      });
    });
    expect(sentDark).toEqual([]);
    // Entry snapshots, rather than map boundaries, now record Self's Necessity.
    for (const { steps: [first] } of batch) {
      expect(first?.kind === "boundary" && first.necessity).toEqual([]);
      expect(PLANETS.every((p) => first!.affliction[p] === 0)).toBe(true);
    }
  });

  it("summarizes what the steps record", () => {
    for (const { trial, steps, summary } of batch) {
      const chart = seededChart(trial.chartSeed);
      const dark = (s: Step, p: PlanetName) => s.affliction[p] >= combustionCeiling(runChart(chart, s).planets[p]);
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
      expect({ combustions, revivals, light, relational: survived("relational"), narrative: survived("narrative") }).toEqual({
        combustions: summary.combustions,
        revivals: summary.boundaryRevivals + summary.narrativeRevivals,
        light: summary.light,
        relational: summary.relationalEncounters,
        narrative: summary.narrativeEncounters,
      });
    }
  });

  it("counts entry deaths once and clears the terminal choice when an entry wipe ends the run", () => {
    const record = batch.find((r) => r.steps.at(-1)!.kind === "enter");
    expect(record).toBeDefined();
    const { steps, summary } = record!;
    expect(summary).toMatchObject({ endReason: "combustion", terminalKind: "relational", lastPlanet: null, lastVerb: null, lastOptionId: null });
    expect(steps.at(-1)!.light).toBe(steps.at(-2)!.light);
    expect(steps.some((step) => step.kind === "turn" || step.kind === "narrative")).toBe(true);
    const chart = seededChart(record!.trial.chartSeed);
    const entryDeaths = steps.reduce((sum, step, i) => step.kind === "enter" && step.encounter === "relational" ? sum + PLANETS.filter((p) => {
      const ceiling = combustionCeiling(runChart(chart, step).planets[p]);
      return steps[i - 1]!.affliction[p] < ceiling && step.affliction[p] >= ceiling;
    }).length : sum, 0);
    const actionDeaths = steps.reduce((sum, step) => sum + (step.kind === "turn" || step.kind === "narrative" ? step.combusts.length : 0), 0);
    expect(entryDeaths).toBeGreaterThan(0);
    expect(summary.combustions).toBe(entryDeaths + actionDeaths);
    expect(summary.relationalTurns).toBe(steps.filter((step) => step.kind === "turn").length);
  });

  it("ends a run whose planets all combust before the relational encounter's last turn", () => {
    const lastEntry = (r: (typeof batch)[number]) => r.steps.map((s) => s.kind).lastIndexOf("enter");
    // Relational encounter length is the map number; the run ended with turns left.
    const record = batch.find((r) =>
      r.steps.at(-1)!.kind === "turn" && r.steps.length - 1 - lastEntry(r) < r.summary.terminalMap,
    )!;
    const entry = lastEntry(record);
    const last = record.steps.at(-1)!;
    const chart = runChart(seededChart(record.trial.chartSeed), last);
    expect(PLANETS.every((p) => last.affliction[p] >= combustionCeiling(chart.planets[p]))).toBe(true);
    expect(record.summary.endReason).toBe("combustion");
    // The summary alone names the encounter and the choice the run ended on.
    const entered = record.steps[entry]!;
    if (entered.kind !== "enter" || entered.encounter !== "relational" || last.kind !== "turn") throw new Error("Expected a relational ending");
    expect(record.summary).toMatchObject({ terminalRuler: entered.ruler, lastPlanet: last.planet, lastVerb: last.verb });
  });
});
