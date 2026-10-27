import { MAPS_PER_RUN } from "@/game/run";
import { BOOTSTRAP_RESAMPLES, ranked, type Aggregates, type Estimate, type Interval } from "./aggregate";
import type { BatchOptions } from "./batch";
import { FORECAST_SAMPLES, type Strategy } from "./policies";

export interface ReportContext {
  options: BatchOptions;
  revision: string;
  dirty: boolean;
}

const DEFINITIONS: Record<Strategy, string> = {
  random: "Uniform among legal choices: the next node, a planet and verb, or a narrative option and then its target.",
  survival: "Most lit planets, then most capacity to absorb affliction, then most Light; " +
    `routes by ${FORECAST_SAMPLES} sampled plays of each next encounter, then the shorter way to the map's exit.`,
  light: "Most Light among choices that keep the run going (any, if none do), then lit planets and capacity; " +
    `routes by ${FORECAST_SAMPLES} sampled plays of each next encounter, survival first.`,
};

const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
const pp = (x: number) => `${(100 * x).toFixed(1)} pp`;
const fixed = (digits: number) => (x: number) => x.toFixed(digits);
const signed = (f: (x: number) => string) => (x: number) => (x > 0 ? `+${f(x)}` : f(x));
const interval = (i: Interval, f: (x: number) => string) => `${f(i.low)} to ${f(i.high)}`;
const estimate = (e: Estimate, f: (x: number) => string) => `${signed(f)(e.mean)} (${interval(e.ci, signed(f))})`;
const counts = (entries: [string, number][]) => entries.map(([key, n]) => `${key} ×${n}`).join("; ") || "—";

function table(head: string[], rows: (string | number)[][]): string {
  return [head, head.map(() => "---"), ...rows].map((r) => `| ${r.join(" | ")} |`).join("\n");
}

/** The batch's findings as tables, for the issue's report. */
export function renderReport(agg: Aggregates, ctx: ReportContext): string {
  const { options, revision, dirty } = ctx;
  const ss = agg.strategies;
  const light = fixed(0), two = fixed(2);
  const chartRow = (chartSeed: number) => {
    const chart = agg.charts.find((c) => c.chartSeed === chartSeed)!;
    return [chartSeed, ...ss.flatMap((s) => {
      const c = chart.byStrategy[s.strategy]!;
      return [pct(c.completion), two(c.maps), light(c.light)];
    })];
  };
  const chartHead = ["Chart", ...ss.flatMap((s) => [`${s.strategy} completion`, `${s.strategy} maps`, `${s.strategy} Light`])];
  return [
    "# Balance evaluation",
    "",
    `Revision \`${revision}\`${dirty ? " plus the working-tree changes in `source.diff`" : ""}. ` +
      `Master seed ${options.seed}; ${options.charts} charts × ${options.runs} game seeds; strategy seed ${options.strategySeed}.`,
    "",
    "Charts come from `seededChart`: birth day uniform over the 73,000 days from 1900-01-01, time of day uniform (UTC), " +
      "latitude uniform in ±66°, longitude uniform in ±180°. Figures describe that sample.",
    "Every run fields all seven planets from the start: lifetime encounters begin at the final unlock threshold.",
    "Encounters survived leave out the one a run ended in; turns count every choice, the last included.",
    `Intervals are 95%, by cluster bootstrap over charts (${BOOTSTRAP_RESAMPLES} resamples seeded from the master seed); ` +
      "a zero-width interval means no sampled chart deviated. Percentiles interpolate linearly between order statistics.",
    "",
    table(["Strategy", "Plays"], ss.map((s) => [s.strategy, DEFINITIONS[s.strategy]])),
    "",
    "## Outcomes",
    "",
    table(
      ["Strategy", "Runs", "Completion (95% CI)", "Maps completed mean", "Maps completed median", "Light mean", "Light median", "Light p10", "Light p90"],
      ss.map((s) => [
        s.strategy, s.runs, `${pct(s.completion.rate)} (${interval(s.completion.ci, pct)})`, two(s.maps.mean), two(s.maps.median),
        light(s.light.mean), light(s.light.median), light(s.light.p10), light(s.light.p90),
      ]),
    ),
    "",
    "## Share of runs reaching each map",
    "",
    table(["Strategy", ...Array.from({ length: MAPS_PER_RUN }, (_, k) => `Map ${k + 1}`)], ss.map((s) => [s.strategy, ...s.reach.map(pct)])),
    "",
    "## Paired differences (b − a, same chart and game seed)",
    "",
    table(
      ["b − a", "Pairs", "Light (95% CI)", "Maps completed (95% CI)", "Completion (95% CI)"],
      agg.paired.map((p) => [`${p.b} − ${p.a}`, p.pairs, estimate(p.light, light), estimate(p.maps, two), estimate(p.completion, pp)]),
    ),
    "",
    "## Per run (means)",
    "",
    table(
      ["Strategy", "Combat survived", "Narrative survived", "Combat turns", "Narrative turns", "Player planets combusted", "Boundary revivals", "Narrative revivals", "Afflict share"],
      ss.map((s) => [
        s.strategy, two(s.perRun.combatSurvived), two(s.perRun.narrativeSurvived), two(s.perRun.combatTurns), two(s.perRun.narrativeTurns),
        two(s.perRun.combustions), two(s.perRun.boundaryRevivals), two(s.perRun.narrativeRevivals),
        pct(s.verbs.Affliction / (s.verbs.Affliction + s.verbs.Testimony)),
      ]),
    ),
    "",
    "## Encounters survived per completed run",
    "",
    table(
      ["Strategy", "Completed runs", "Combat", "Narrative"],
      ss.map(({ strategy, completedRuns: c }) =>
        [strategy, c.runs, ...(c.runs ? [two(c.combatSurvived), two(c.narrativeSurvived)] : ["—", "—"])]),
    ),
    "",
    "## Runs ending by combustion",
    "",
    table(
      ["Strategy", "Runs", "Maps", "Nodes", "Kinds", "Last encounters", "Last choices"],
      ss.map(({ strategy, failures: f }) => [
        strategy, f.runs,
        counts(Object.entries(f.map).sort((a, b) => Number(a[0]) - Number(b[0])).map(([map, n]) => [`map ${map}`, n])),
        counts(ranked(f.node)), counts(ranked(f.kind)), counts(f.encounters), counts(f.lastChoices),
      ]),
    ),
    "",
    "## Narrative options taking the largest share of their scenario's choices",
    "",
    table(
      ["Strategy", "Option: chosen / scenario played"],
      ss.map((s) => [s.strategy, s.dominantOptions.map((o) => `${o.option} ${o.chosen}/${o.of}`).join("; ") || "—"]),
    ),
    "",
    "## Charts struggling across strategies (lowest mean maps)",
    "",
    table(chartHead, agg.struggling.map(chartRow)),
    "",
    ...(agg.strategyGain.length ? [
      "## Charts gaining most from strategy (best strategy's mean maps − random's)",
      "",
      table(["Gain", ...chartHead], agg.strategyGain.map((c) => [two(c.gain), ...chartRow(c.chartSeed)])),
      "",
    ] : []),
    "## Trials to replay",
    "",
    "Regenerate one with `pnpm -s eval:balance --replay <id>`.",
    "",
    table(["Trials", "Ids"], [
      ...agg.replays.failures.map((f) => [`${f.strategy} combusting at ${f.node}`, f.trials.join(", ")]),
      ["Widest disagreements (best / worst)", agg.replays.disagreements.map((d) => `${d.best} / ${d.worst} (${d.spread} maps)`).join("; ") || "—"],
      ["Random completions", agg.replays.randomCompletions.join(", ") || "—"],
    ]),
    "",
  ].join("\n");
}
