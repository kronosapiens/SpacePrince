import { MAPS_PER_RUN } from "@/game/run";
import { UNLOCK_THRESHOLDS } from "@/game/data";
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
  "combat-immediate": "Immediate defensive actions and narratives; prefer combat nodes, then the shorter route to the exit.",
  "combat-two-turn": "Two-turn defensive actions; immediate defensive narratives; prefer combat nodes, then the shorter route to the exit.",
  "narrative-immediate": "Immediate defensive actions and narratives; prefer narrative nodes, then the shorter route to the exit.",
  "capacity-12": "Immediate defense may spend up to 12 capacity for Light after preserving survival and lit planets; baseline survival routing and narratives.",
  "two-turn-survival": "Two-turn defensive actions; baseline survival routing and immediate defensive narratives.",
  "two-turn-capacity-12": "Two-turn defense may spend up to 12 expected capacity for Light after preserving survival and expected lit planets; baseline survival routing and narratives.",
  "combat-two-turn-entry-aware": "Two-turn defense values the next Necessity draw at resolved encounter leaves; prefer combat nodes, then the shorter route to the exit; immediate defensive narratives.",
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
  const startingCount = options.startingLifetimeEncounterCount ?? UNLOCK_THRESHOLDS.at(-1)!;
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
    `Every trial starts independently at ${startingCount} lifetime encounters${startingCount >= UNLOCK_THRESHOLDS.at(-1)! ? ", with all seven planets fielded" : ""}.`,
    "Every resolved encounter increments that count before clearing and checking the run's end; a newly unlocked planet can rescue an entry wipe.",
    "Encounters survived leave out the one a run ended in; turns count every choice, the last included.",
    `Intervals are 95%, by cluster bootstrap over charts (${BOOTSTRAP_RESAMPLES} resamples seeded from the master seed); ` +
      "a zero-width interval means no sampled chart deviated. Percentiles interpolate linearly between order statistics.",
    "",
    table(["Strategy", "Plays"], ss.map((s) => [s.strategy, DEFINITIONS[s.strategy]])),
    ...(ss.some((s) => s.strategy.includes("two-turn")) ? [
      "Two-turn planning enumerates the next actor and verb with their game probabilities, then chooses a one-turn continuation; it recomputes at each live decision.",
      "Baseline survival route forecasts use the immediate survival policy, even when the live action policy plans two turns.",
    ] : []),
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
    "## Pressure on Self (means per run)",
    "",
    "Combat effects use actual applied damage and healing, including propagation and inversion, rather than the announced verb alone.",
    "Entry wipes include those rescued by an unlock; entry deaths count planets, while wipes count encounters.",
    table(
      ["Strategy", "Entry affliction", "Entry deaths", "Entry wipes", "Entry wipe rescues", "Combat damage", "Combat healing", "Inverted Testimony damage", "Inverted Affliction healing"],
      ss.map(({ strategy, pressure: p }) => [strategy, two(p.entryDamage), two(p.entryDeaths), two(p.entryWipes), two(p.entryWipeRescues),
        two(p.combat.damage), two(p.combat.healing), two(p.combat.invertedTestimonyDamage), two(p.combat.invertedAfflictionHealing)]),
    ),
    "",
    "## Recovery and unlocks (means per run)",
    "",
    "Narrative damage and healing are net changes per planet within each choice; revival recovery and Resolve gains are separate sources of capacity.",
    "Final capacity equals starting capacity minus entry and combat/narrative damage, plus combat/narrative healing, revival recovery, Resolve gains, and capacity unlocked.",
    table(
      ["Strategy", "Narrative damage", "Narrative healing", "Revival recovery", "Resolve gains", "Unlocked capacity", "Unlocks", "Unlock rescues", "Starting capacity", "Final capacity"],
      ss.map(({ strategy, pressure: p, progression: u }) => [strategy, two(p.narrativeDamage), two(p.narrativeHealing),
        two(p.boundaryRevivalRecovery + p.narrativeRevivalRecovery), two(p.resolveGain), two(p.unlockCapacity),
        two(u.unlocks), two(u.unlockRescues), two(p.capacityStart), two(p.capacityEnd)]),
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
    `Regenerate one with \`pnpm -s eval:balance --replay <id>${options.startingLifetimeEncounterCount === undefined ? "" : ` --starting-encounters ${startingCount}`}\`.`,
    "",
    table(["Trials", "Ids"], [
      ...agg.replays.failures.map((f) => [`${f.strategy} combusting at ${f.node}`, f.trials.join(", ")]),
      ["Widest disagreements (best / worst)", agg.replays.disagreements.map((d) => `${d.best} / ${d.worst} (${d.spread} maps)`).join("; ") || "—"],
      ["Random completions", agg.replays.randomCompletions.join(", ") || "—"],
    ]),
    "",
  ].join("\n");
}
