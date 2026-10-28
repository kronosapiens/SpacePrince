import { hashString } from "@/game/rng";
import type { Trial } from "./play";
import type { Strategy } from "./policies";

export interface BatchOptions {
  /** Master seed: every chart and game seed derives from it. */
  seed: number;
  charts: number;
  /** Game seeds per chart. */
  runs: number;
  strategies: Strategy[];
  strategySeed: number;
  /** Each trial begins at this lifetime count; omitted means a fully unlocked roster. */
  startingLifetimeEncounterCount?: number;
}

/** Chart i, as a pure function of the master seed and its index. */
export function chartSeed(master: number, i: number): number {
  return hashString(`${master}_chart_${i}`) % 2 ** 31;
}

/** Game j of chart i. Per chart, since a run's map seeds depend on the game seed alone. */
export function gameSeed(master: number, i: number, j: number): number {
  return hashString(`${master}_game_${i}_${j}`) % 2 ** 31;
}

/** How each seed in a batch is made, as `config.json` records it. */
export const SEED_DERIVATIONS = {
  chart: "hashString(`${seed}_chart_${i}`) % 2**31; chart = seededChart(chartSeed)",
  game: "hashString(`${seed}_game_${i}_${j}`) % 2**31",
  map1: "beginRun(chart, gameSeed): mulberry32(gameSeed) draws map 1's seed",
  maps2to7: "hashString(`${gameSeed}_map_${k}`) % 2**31",
  strategy: "mulberry32(hashString(`strategy_${chartSeed}_${gameSeed}_${strategy}_${strategySeed}`))",
  forecast: "hashString(`forecast_${chartSeed}_${gameSeed}_${strategySeed}_${map}_${nodeId}_${sample}`); arrival, ties and turns hash `${seed}_arrival|_ties|_turns`",
  bootstrap: "mulberry32(hashString(`${seed}_bootstrap`))",
};

/** Every (chart, game) pair, played by each strategy. */
export function batchTrials({ seed, charts, runs, strategies, strategySeed }: BatchOptions): Trial[] {
  return Array.from({ length: charts }, (_, i) => Array.from({ length: runs }, (_, j) =>
    strategies.map((strategy) => ({ chartSeed: chartSeed(seed, i), gameSeed: gameSeed(seed, i, j), strategy, strategySeed })),
  )).flat(2);
}
