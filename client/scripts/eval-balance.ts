/**
 * Balance evaluator (issue #14): plays seeded batches of complete runs with the
 * game's own functions (`src/eval/`) and writes the configuration, one summary
 * per run, and an aggregate report.
 *
 *   pnpm eval:balance [--seed 20261022] [--charts 100] [--runs 100]
 *     [--strategies random,survival,light] [--strategy-seed 0]
 *     [--starting-encounters 0] [--out DIR]
 *   pnpm -s eval:balance --replay <chartSeed>:<gameSeed>:<strategy>:<strategySeed> > trial.json
 *
 * Replay prints one trial's full record (route, choices, state after each step).
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { aggregate, BOOTSTRAP_RESAMPLES, type Row } from "@/eval/aggregate";
import { batchTrials, SEED_DERIVATIONS, type BatchOptions } from "@/eval/batch";
import type { Trial } from "@/eval/play";
import { FORECAST_SAMPLES, POLICIES, type Strategy } from "@/eval/policies";
import { renderReport } from "@/eval/report";
import { runTrial, type RunTrialOptions } from "@/eval/runner";

const { values: args } = parseArgs({
  options: {
    seed: { type: "string", default: "20261022" },
    charts: { type: "string", default: "100" },
    runs: { type: "string", default: "100" },
    strategies: { type: "string", default: "random,survival,light" },
    "strategy-seed": { type: "string", default: "0" },
    "starting-encounters": { type: "string" },
    out: { type: "string" },
    replay: { type: "string" },
  },
});

const runOptions: RunTrialOptions = args["starting-encounters"] === undefined
  ? {}
  : { startingLifetimeEncounterCount: Number(args["starting-encounters"]) };
if (runOptions.startingLifetimeEncounterCount !== undefined &&
    (!Number.isSafeInteger(runOptions.startingLifetimeEncounterCount) || runOptions.startingLifetimeEncounterCount < 0)) {
  throw new Error("--starting-encounters must be a nonnegative integer");
}

function toStrategy(name: string): Strategy {
  if (!(name in POLICIES)) throw new Error(`Unknown strategy ${name}; expected one of ${Object.keys(POLICIES).join(", ")}`);
  return name as Strategy;
}

function replay(id: string): void {
  const [chartSeed, gameSeed, strategy, strategySeed] = id.split(":");
  const trial: Trial = { chartSeed: Number(chartSeed), gameSeed: Number(gameSeed), strategy: toStrategy(strategy!), strategySeed: Number(strategySeed) };
  process.stdout.write(`${JSON.stringify(runTrial(trial, undefined, runOptions), null, 2)}\n`);
}

/** The code that produced a batch: the revision, plus the client's working-tree changes. */
function sourceState(): { revision: string; diff: string } {
  const git = (argv: string[], cwd?: string) => {
    // `diff --no-index` exits 1 whenever files differ, so only a failed spawn is an error.
    const result = spawnSync("git", argv, { cwd, encoding: "utf8", maxBuffer: Infinity });
    if (result.error) throw result.error;
    return result.stdout;
  };
  const root = git(["rev-parse", "--show-toplevel"]).trim();
  const untracked = git(["ls-files", "--others", "--exclude-standard", "--", "client"], root).split("\n").filter(Boolean);
  return {
    revision: git(["rev-parse", "HEAD"], root).trim(),
    diff: git(["diff", "--binary", "HEAD", "--", "client"], root) +
      untracked.map((file) => git(["diff", "--binary", "--no-index", "--", "/dev/null", file], root)).join(""),
  };
}

function batch(): void {
  const options: BatchOptions = {
    seed: Number(args.seed),
    charts: Number(args.charts),
    runs: Number(args.runs),
    strategies: args.strategies.split(",").map(toStrategy),
    strategySeed: Number(args["strategy-seed"]),
    ...runOptions,
  };
  const rosterSuffix = options.startingLifetimeEncounterCount === undefined ? "" : `_e${options.startingLifetimeEncounterCount}`;
  const out = resolve(args.out ?? join(
    "eval-results", `seed-${options.seed}_${options.charts}x${options.runs}_${options.strategies.join("-")}_s${options.strategySeed}${rosterSuffix}`,
  ));
  mkdirSync(out, { recursive: true });
  // A rerun into the same directory, even an interrupted one, never mixes in an earlier run's results.
  for (const file of ["runs.jsonl", "errors.json", "report.json", "report.md"]) rmSync(join(out, file), { force: true });
  const { revision, diff } = sourceState();
  const dirty = diff.length > 0;
  writeFileSync(join(out, "source.diff"), diff);

  const trials = batchTrials(options);
  writeFileSync(join(out, "config.json"), `${JSON.stringify({
    options,
    trials: trials.length,
    runsPerStrategy: options.charts * options.runs,
    seedDerivations: SEED_DERIVATIONS,
    constants: { forecastSamples: FORECAST_SAMPLES, bootstrapResamples: BOOTSTRAP_RESAMPLES },
    revision,
    nodeVersion: process.version,
    dirty,
    sourceDiff: dirty ? "source.diff" : null,
  }, null, 2)}\n`);

  const rows: Row[] = [];
  const errors: { trial: Trial; error: string }[] = [];
  for (const [i, trial] of trials.entries()) {
    try {
      const { summary } = runTrial(trial, undefined, runOptions);
      rows.push({ trial, summary });
    } catch (error) {
      errors.push({ trial, error: error instanceof Error ? error.stack ?? error.message : String(error) });
    }
    process.stderr.write(`\r${i + 1}/${trials.length} trials, ${errors.length} errors`);
  }
  process.stderr.write("\n");
  writeFileSync(join(out, "runs.jsonl"), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
  writeFileSync(join(out, "errors.json"), `${JSON.stringify(errors, null, 2)}\n`);

  if (errors.length) {
    // A failed batch is rerun, not reported.
    process.stderr.write(`${errors.length} trials failed; see ${join(out, "errors.json")}\n`);
    process.exitCode = 1;
    return;
  }
  const aggregates = aggregate(rows, options.seed);
  writeFileSync(join(out, "report.json"), `${JSON.stringify(aggregates, null, 2)}\n`);
  writeFileSync(join(out, "report.md"), renderReport(aggregates, { options, revision, dirty }));
  process.stderr.write(`Wrote ${out}\n`);
}

if (args.replay) replay(args.replay);
else batch();
