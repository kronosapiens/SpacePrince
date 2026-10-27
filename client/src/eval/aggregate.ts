import { hashString, mulberry32 } from "@/game/rng";
import { MAPS_PER_RUN } from "@/game/run";
import type { Polarity } from "@/game/types";
import type { Strategy } from "./policies";
import type { RunRecord, RunSummary } from "./runner";

/** One line of `runs.jsonl`: replay regenerates the steps. */
export type Row = Pick<RunRecord, "trial" | "summary">;

export interface Interval { low: number; high: number }
export interface Estimate { mean: number; ci: Interval }

export interface StrategyStats {
  strategy: Strategy;
  runs: number;
  /** Share of runs reaching map k, k = 1..7. */
  reach: number[];
  completion: { rate: number; ci: Interval };
  maps: { mean: number; median: number };
  light: { mean: number; median: number; p10: number; p90: number };
  /** Means per run. Encounters count once survived. */
  perRun: {
    combatSurvived: number; narrativeSurvived: number; combatTurns: number; narrativeTurns: number;
    combustions: number; boundaryRevivals: number; narrativeRevivals: number;
  };
  /** Encounters survived per completed run: whether completing means meeting fewer. */
  completedRuns: { runs: number; combatSurvived: number; narrativeSurvived: number };
  verbs: Record<Polarity, number>;
  /** Times each option was chosen, by scenario. */
  narrativeOptions: Record<string, Record<string, number>>;
  /** Options taking the largest share of their scenario's choices. */
  dominantOptions: { option: string; chosen: number; of: number }[];
  unresolvedRate: number;
  /** Runs ending by combustion: where they ended and the last choice made there. */
  failures: {
    runs: number; map: Record<string, number>; node: Record<string, number>; kind: Record<string, number>;
    encounters: [string, number][]; lastChoices: [string, number][];
  };
}

/** `b − a` over runs sharing a chart and game seed. */
export interface PairedStats { a: Strategy; b: Strategy; pairs: number; light: Estimate; maps: Estimate; completion: Estimate }

export interface ChartStats {
  chartSeed: number;
  byStrategy: Partial<Record<Strategy, { completion: number; maps: number; light: number }>>;
}

export interface Aggregates {
  strategies: StrategyStats[];
  paired: PairedStats[];
  charts: ChartStats[];
  /** Lowest mean maps completed across strategies. */
  struggling: number[];
  /** Widest spread between strategies' mean maps completed. */
  strategySensitive: { chartSeed: number; spread: number }[];
}

export const BOOTSTRAP_RESAMPLES = 1000;
const TOP = 5;
const DOMINANT = 8;

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const mean = (values: number[]) => sum(values) / values.length;
const completed = (s: RunSummary) => (s.endReason === "completion" ? 1 : 0);
/** Code-point order, so ties rank the same under any locale. */
const byKey = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Linear interpolation between order statistics, at h = (n − 1)p. */
export function quantile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h);
  return sorted[lo]! + (h - lo) * (sorted[Math.min(lo + 1, sorted.length - 1)]! - sorted[lo]!);
}

function tally(keys: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const key of keys) counts[key] = (counts[key] ?? 0) + 1;
  return counts;
}

/** The most frequent keys, ties in key order. */
export function ranked(counts: Record<string, number>): [string, number][] {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || byKey(a[0], b[0])).slice(0, TOP);
}

/** Chart resamples shared by every interval, drawn from the master seed. */
function resamples(charts: number, seed: number): number[][] {
  const rng = mulberry32(hashString(`${seed}_bootstrap`));
  return Array.from({ length: BOOTSTRAP_RESAMPLES }, () => Array.from({ length: charts }, () => Math.floor(rng() * charts)));
}

/** 95% percentile interval of a ratio of per-chart sums, resampling charts with replacement. */
function clusterInterval(clusters: { sum: number; count: number }[], draws: number[][]): Interval {
  const stats = draws.map((draw) => sum(draw.map((i) => clusters[i]!.sum)) / sum(draw.map((i) => clusters[i]!.count)));
  return { low: quantile(stats, 0.025), high: quantile(stats, 0.975) };
}

/** The per-chart clusters of one value over rows, in chart order. */
function clusters(charts: number[], rows: { chartSeed: number; value: number }[]) {
  return charts.map((c) => {
    const values = rows.filter((r) => r.chartSeed === c).map((r) => r.value);
    return { sum: sum(values), count: values.length };
  });
}

function encounterKey(s: RunSummary): string {
  return s.terminalKind === "narrative" ? `narrative ${s.terminalScenarioId}` : `combat ruled by ${s.terminalRuler}`;
}

function choiceKey(s: RunSummary): string {
  return s.terminalKind === "narrative"
    ? `${s.terminalScenarioId}/${s.lastOptionId}${s.lastPlanet ? ` on ${s.lastPlanet}` : ""}`
    : `${s.lastPlanet} ${s.lastVerb}`;
}

function strategyStats(strategy: Strategy, rows: Row[], charts: number[], draws: number[][]): StrategyStats {
  const ss = rows.map((r) => r.summary);
  const maps = ss.map((s) => s.mapsCompleted);
  const light = ss.map((s) => s.light);
  const failures = ss.filter((s) => s.endReason === "combustion");
  const finished = ss.filter((s) => s.endReason === "completion");
  const scenarios: Record<string, Record<string, number>> = {};
  for (const s of ss) {
    for (const [key, n] of Object.entries(s.narrativeOptions)) {
      const [scenario, option] = key.split("/") as [string, string];
      const counts = (scenarios[scenario] ??= {});
      counts[option] = (counts[option] ?? 0) + n;
    }
  }
  const shares = Object.entries(scenarios).flatMap(([scenario, counts]) => {
    const of = sum(Object.values(counts));
    return Object.entries(counts).map(([option, chosen]) => ({ option: `${scenario}/${option}`, chosen, of }));
  });
  const per = (of: (s: RunSummary) => number) => mean(ss.map(of));
  return {
    strategy,
    runs: ss.length,
    reach: Array.from({ length: MAPS_PER_RUN }, (_, k) => per((s) => (s.terminalMap > k ? 1 : 0))),
    completion: {
      rate: per(completed),
      ci: clusterInterval(clusters(charts, rows.map((r) => ({ chartSeed: r.trial.chartSeed, value: completed(r.summary) }))), draws),
    },
    maps: { mean: mean(maps), median: quantile(maps, 0.5) },
    light: { mean: mean(light), median: quantile(light, 0.5), p10: quantile(light, 0.1), p90: quantile(light, 0.9) },
    perRun: {
      combatSurvived: per((s) => s.combatEncounters),
      narrativeSurvived: per((s) => s.narrativeEncounters),
      combatTurns: per((s) => s.combatTurns),
      narrativeTurns: per((s) => sum(Object.values(s.narrativeOptions))),
      combustions: per((s) => s.combustions),
      boundaryRevivals: per((s) => s.boundaryRevivals),
      narrativeRevivals: per((s) => s.narrativeRevivals),
    },
    completedRuns: {
      runs: finished.length,
      combatSurvived: mean(finished.map((s) => s.combatEncounters)),
      narrativeSurvived: mean(finished.map((s) => s.narrativeEncounters)),
    },
    verbs: { Affliction: sum(ss.map((s) => s.verbs.Affliction)), Testimony: sum(ss.map((s) => s.verbs.Testimony)) },
    narrativeOptions: scenarios,
    dominantOptions: shares
      .sort((x, y) => y.chosen / y.of - x.chosen / x.of || y.of - x.of || byKey(x.option, y.option))
      .slice(0, DOMINANT),
    unresolvedRate: per((s) => (s.unresolvedCombat ? 1 : 0)),
    failures: {
      runs: failures.length,
      map: tally(failures.map((s) => String(s.terminalMap))),
      node: tally(failures.map((s) => s.terminalNodeId)),
      kind: tally(failures.map((s) => s.terminalKind)),
      encounters: ranked(tally(failures.map(encounterKey))),
      lastChoices: ranked(tally(failures.map(choiceKey))),
    },
  };
}

function pairedStats(a: Strategy, b: Strategy, rows: Row[], charts: number[], draws: number[][]): PairedStats {
  const key = (r: Row) => `${r.trial.chartSeed}:${r.trial.gameSeed}`;
  const later = new Map(rows.filter((r) => r.trial.strategy === b).map((r) => [key(r), r.summary]));
  const pairs = rows.filter((r) => r.trial.strategy === a).map((r) => ({ chartSeed: r.trial.chartSeed, a: r.summary, b: later.get(key(r))! }));
  const diff = (of: (s: RunSummary) => number): Estimate => {
    const values = pairs.map((p) => ({ chartSeed: p.chartSeed, value: of(p.b) - of(p.a) }));
    return { mean: mean(values.map((v) => v.value)), ci: clusterInterval(clusters(charts, values), draws) };
  };
  return { a, b, pairs: pairs.length, light: diff((s) => s.light), maps: diff((s) => s.mapsCompleted), completion: diff(completed) };
}

/** Everything the report reads. Intervals resample charts, the unit runs share. */
export function aggregate(rows: Row[], seed: number): Aggregates {
  const strategies = [...new Set(rows.map((r) => r.trial.strategy))];
  const charts = [...new Set(rows.map((r) => r.trial.chartSeed))];
  const draws = resamples(charts.length, seed);
  const of = (strategy: Strategy) => rows.filter((r) => r.trial.strategy === strategy);
  const chartStats: ChartStats[] = charts.map((chartSeed) => ({
    chartSeed,
    byStrategy: Object.fromEntries(strategies.map((strategy) => {
      const ss = of(strategy).filter((r) => r.trial.chartSeed === chartSeed).map((r) => r.summary);
      return [strategy, { completion: mean(ss.map(completed)), maps: mean(ss.map((s) => s.mapsCompleted)), light: mean(ss.map((s) => s.light)) }];
    })),
  }));
  const chartMaps = (c: ChartStats) => Object.values(c.byStrategy).map((s) => s.maps);
  return {
    strategies: strategies.map((s) => strategyStats(s, of(s), charts, draws)),
    paired: strategies.flatMap((a, i) => strategies.slice(i + 1).map((b) => pairedStats(a, b, rows, charts, draws))),
    charts: chartStats,
    struggling: [...chartStats].sort((x, y) => mean(chartMaps(x)) - mean(chartMaps(y))).slice(0, TOP).map((c) => c.chartSeed),
    strategySensitive: chartStats
      .map((c) => ({ chartSeed: c.chartSeed, spread: Math.max(...chartMaps(c)) - Math.min(...chartMaps(c)) }))
      .sort((x, y) => y.spread - x.spread)
      .slice(0, TOP),
  };
}
