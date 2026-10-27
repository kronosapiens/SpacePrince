import { describe, expect, it } from "vitest";
import { aggregate, type Row } from "@/eval/aggregate";
import { batchTrials } from "@/eval/batch";
import type { Strategy } from "@/eval/policies";
import type { RunSummary } from "@/eval/runner";

/** A run that completed `maps` maps (seven is completion) with `light` Light. */
function row(strategy: Strategy, chartSeed: number, gameSeed: number, maps: number, light: number, more: Partial<RunSummary> = {}): Row {
  const summary: RunSummary = {
    endReason: maps === 7 ? "completion" : "combustion", mapsCompleted: maps, terminalMap: Math.min(maps + 1, 7),
    terminalNodeId: "5C", terminalKind: "combat", terminalScenarioId: null, terminalRuler: "Moon",
    lastPlanet: "Moon", lastVerb: "Affliction", lastOptionId: null,
    light, combatEncounters: 0, narrativeEncounters: 0, combatTurns: 0, combustions: 0, boundaryRevivals: 0,
    narrativeRevivals: 0, verbs: { Affliction: 0, Testimony: 0 }, narrativeOptions: {},
    ...more,
  };
  return { trial: { chartSeed, gameSeed, strategy, strategySeed: 0 }, summary };
}

// Two charts × two games × two strategies.
const rows = [
  // Combusted mid-combat against a Mars-ruled chart.
  row("random", 1, 11, 2, 100, {
    terminalNodeId: "3L", terminalRuler: "Mars", lastPlanet: "Sun", lastVerb: "Testimony",
    combatEncounters: 4, narrativeEncounters: 2, combatTurns: 6, combustions: 7, boundaryRevivals: 1,
    verbs: { Affliction: 4, Testimony: 2 }, narrativeOptions: { "song/finish": 1, "song/sleep": 1 },
  }),
  // Combusted by its own narrative choice, which is not counted as survived.
  row("random", 1, 12, 4, 300, {
    terminalNodeId: "6C", terminalKind: "narrative", terminalScenarioId: "song", terminalRuler: null,
    lastPlanet: "Saturn", lastVerb: null, lastOptionId: "finish",
    combatEncounters: 2, narrativeEncounters: 3, combatTurns: 3, combustions: 7, narrativeRevivals: 1,
    verbs: { Affliction: 1, Testimony: 2 }, narrativeOptions: { "song/finish": 2, "dice/work": 2 },
  }),
  row("random", 2, 21, 1, 200),
  row("random", 2, 22, 7, 400, { combatEncounters: 20, narrativeEncounters: 10 }),
  row("survival", 1, 11, 7, 500, { combatEncounters: 18, narrativeEncounters: 12 }),
  row("survival", 1, 12, 7, 700, { combatEncounters: 16, narrativeEncounters: 14 }),
  row("survival", 2, 21, 3, 300),
  row("survival", 2, 22, 7, 900, { combatEncounters: 20, narrativeEncounters: 10 }),
];

describe("balance aggregation", () => {
  it("matches a hand-calculated batch", () => {
    const agg = aggregate(rows, 1);
    const [random, survival] = agg.strategies;
    // Random ends on maps 3, 5, 2 and 7.
    expect(random!.reach).toEqual([1, 1, 0.75, 0.5, 0.5, 0.25, 0.25]);
    expect(random!.completion.rate).toBe(0.25);
    expect(random!.maps).toEqual({ mean: 3.5, median: 3 });
    // Light 100, 200, 300, 400: p10 sits 0.3 of the way from 100 to 200, p90 0.7 from 300 to 400.
    expect(random!.light).toEqual({ mean: 250, median: 250, p10: 130, p90: 370 });
    expect(survival!.maps).toEqual({ mean: 6, median: 7 });
    expect(survival!.light).toEqual({ mean: 600, median: 600, p10: 360, p90: 840 });

    // Sums over random's four runs, divided by four.
    expect(random!.perRun).toEqual({
      combatSurvived: 6.5, narrativeSurvived: 3.75, combatTurns: 2.25, narrativeTurns: 1.5,
      combustions: 3.5, boundaryRevivals: 0.25, narrativeRevivals: 0.25,
    });
    expect(random!.verbs).toEqual({ Affliction: 5, Testimony: 4 });
    expect(survival!.completedRuns).toEqual({ runs: 3, combatSurvived: 18, narrativeSurvived: 12 });
    // Work was every choice in dice (2/2), finish three of song's four: ranked by share, not count.
    expect(random!.narrativeOptions).toEqual({ song: { finish: 3, sleep: 1 }, dice: { work: 2 } });
    expect(random!.dominantOptions).toEqual([
      { option: "dice/work", chosen: 2, of: 2 }, { option: "song/finish", chosen: 3, of: 4 }, { option: "song/sleep", chosen: 1, of: 4 },
    ]);
    const { encounters, lastChoices, ...ends } = random!.failures;
    expect(ends).toEqual({ runs: 3, map: { 2: 1, 3: 1, 5: 1 }, node: { "3L": 1, "6C": 1, "5C": 1 }, kind: { combat: 2, narrative: 1 } });
    expect(Object.fromEntries(encounters)).toEqual({ "combat ruled by Mars": 1, "narrative song": 1, "combat ruled by Moon": 1 });
    expect(Object.fromEntries(lastChoices)).toEqual({ "Sun Testimony": 1, "song/finish on Saturn": 1, "Moon Affliction": 1 });

    const [paired] = agg.paired;
    expect(paired).toMatchObject({ a: "random", b: "survival", pairs: 4 });
    // Per pair: Light +400, +400, +100, +500; maps +5, +3, +2, 0; completion +1, +1, 0, 0.
    expect([paired!.light.mean, paired!.maps.mean, paired!.completion.mean]).toEqual([350, 2.5, 0.5]);

    expect(agg.charts[1]).toEqual({
      chartSeed: 2,
      byStrategy: { random: { completion: 0.5, maps: 4, light: 300 }, survival: { completion: 0.5, maps: 5, light: 600 } },
    });
    // Mean maps across strategies: chart 1 is 5, chart 2 is 4.5; survival gains 7 − 3 and 5 − 4 over random.
    expect(agg.struggling).toEqual([2, 1]);
    expect(agg.strategyGain).toEqual([{ chartSeed: 1, gain: 4 }, { chartSeed: 2, gain: 1 }]);
    // Random's three failure nodes tie, so the first in key order stands for them; seeds 2:22 agree.
    expect(agg.replays).toEqual({
      failures: [
        { strategy: "random", node: "3L", trials: ["1:11:random:0"] },
        { strategy: "survival", node: "5C", trials: ["2:21:survival:0"] },
      ],
      disagreements: [
        { spread: 5, best: "1:11:survival:0", worst: "1:11:random:0" },
        { spread: 3, best: "1:12:survival:0", worst: "1:12:random:0" },
        { spread: 2, best: "2:21:survival:0", worst: "2:21:random:0" },
      ],
      randomCompletions: ["2:22:random:0"],
    });
  });

  it("bootstraps over charts, reproducibly from the seed", () => {
    // Six charts whose survival − random Light gains disagree, averaging 295.
    const gains = [10, 250, 40, 900, 70, 500];
    const varied = gains.flatMap((gain, c) => [row("random", c, 1, 3, 0), row("survival", c, 1, 3, gain)]);
    const interval = (seed: number) => aggregate(varied, seed).paired[0]!.light.ci;
    expect(interval(1)).toEqual(interval(1));
    expect(interval(2)).not.toEqual(interval(1));
    expect(interval(1).low).toBeLessThan(295);
    expect(interval(1).high).toBeGreaterThan(295);
    // Survival completes 1.0 of chart 1's runs and 0.5 of chart 2's: every resample lies between.
    const { ci } = aggregate(rows, 1).strategies[1]!.completion;
    expect(ci.low).toBeGreaterThanOrEqual(0.5);
    expect(ci.high).toBeLessThanOrEqual(1);
    // Charts that agree leave nothing to resample.
    const alike = [1, 2, 3].map((c) => row("random", c, c, 7, 100));
    expect(aggregate(alike, 1).strategies[0]!.completion.ci).toEqual({ low: 1, high: 1 });
  });

  it("derives the same trials from the same master seed, every strategy playing each pair", () => {
    const options = { seed: 5, charts: 2, runs: 3, strategies: ["random", "survival", "light"] as Strategy[], strategySeed: 0 };
    const trials = batchTrials(options);
    expect(batchTrials(options)).toEqual(trials);
    const pair = (t: (typeof trials)[number]) => `${t.chartSeed}:${t.gameSeed}`;
    const pairs = [...new Set(trials.map(pair))];
    expect(pairs).toHaveLength(6);
    for (const p of pairs) expect(trials.filter((t) => pair(t) === p).map((t) => t.strategy)).toEqual(options.strategies);
    // Game seeds are per chart, so no two charts play the same maps.
    const games = (chart: number) => new Set(trials.filter((t) => t.chartSeed === chart).map((t) => t.gameSeed));
    const [first, second] = [...new Set(trials.map((t) => t.chartSeed))];
    expect([...games(first!)].some((g) => games(second!).has(g))).toBe(false);
  });
});
