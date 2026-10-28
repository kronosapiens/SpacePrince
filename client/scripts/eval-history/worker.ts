// Executed only against Git-restored historical source, never current src/eval.
import assert from "node:assert/strict";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { aggregate, BOOTSTRAP_RESAMPLES, type Row } from "@/eval/aggregate";
import { batchTrials, SEED_DERIVATIONS } from "@/eval/batch";
import type { Trial } from "@/eval/play";
import type { Strategy } from "@/eval/policies";
import { runTrial, type RunRecord } from "@/eval/runner";
import { manifest } from "./config";
import { policy, type Arm } from "./policies";
import { recordHash } from "./record";

const [mode, out, experiment, variant, chartsText, runsText] = process.argv.slice(2);
assert(out, "Missing output path");
const json = (name: string, value: unknown) => writeFileSync(path.join(out, name), JSON.stringify(value, null, 2) + "\n");

if (mode === "aggregate") {
  const config = JSON.parse(readFileSync(path.join(out, "config.json"), "utf8"));
  const rows: Row[] = [];
  for (const name of Object.keys(config.experiment.variants)) {
    const records = JSON.parse(readFileSync(path.join(out, name, "rows.json"), "utf8"));
    for (const record of records) {
      // Labels differ only for aggregation. Actual trials always retain survival:0.
      rows.push({ trial: { ...record.trial, strategy: `${name}/${record.arm}` as Strategy }, summary: record.summary });
    }
  }
  json("summary.json", aggregate(rows, config.experiment.seed));
} else {
  assert(mode === "run" && experiment && variant, "Invalid worker arguments");
  const config = manifest.experiments[experiment]!;
  assert(config?.variants[variant], "Unknown experiment/variant");
  const checkpoints: { experiment: string; variant: string; arm: Arm; trial: Trial; sha256: string; reason: string }[] =
    JSON.parse(readFileSync(new URL("checkpoints.json", import.meta.url), "utf8"));
  const expected = checkpoints.filter((item) => item.experiment === experiment && item.variant === variant);
  assert(expected.length >= config.arms.length, "Missing historical replay checkpoints");
  const cache = new Map<string, RunRecord>();
  const key = (arm: string, trial: Trial) => `${arm}:${trial.chartSeed}:${trial.gameSeed}`;
  const verified = [];
  for (const checkpoint of expected) {
    const record = runTrial(checkpoint.trial, policy(checkpoint.arm, variant));
    const actual = recordHash(record);
    assert.equal(actual, checkpoint.sha256, `Historical replay differs: ${variant}/${key(checkpoint.arm, checkpoint.trial)}`);
    cache.set(key(checkpoint.arm, checkpoint.trial), record);
    verified.push({ ...checkpoint, actual });
  }
  json("validation.json", { passed: true, checkpoints: verified, separatelyVerified: "Checkpoints outside the requested sample are excluded from batch counts and aggregates." });
  console.log(`${variant}: ${verified.length} historical checkpoints passed`);
  const trials = batchTrials({ seed: config.seed, charts: Number(chartsText), runs: Number(runsText), strategies: ["survival"], strategySeed: 0 });
  const rows = [];
  const recordsPath = path.join(out, "records.jsonl");
  writeFileSync(recordsPath, "");
  for (const trial of trials) {
    for (const arm of config.arms as Arm[]) {
      const record = cache.get(key(arm, trial)) ?? runTrial(trial, policy(arm, variant));
      appendFileSync(recordsPath, JSON.stringify({ variant, arm, ...record }) + "\n");
      rows.push({ variant, arm, trial: record.trial, summary: record.summary });
    }
    if (rows.length % (config.arms.length * Number(runsText)) === 0) console.log(`${variant}: ${rows.length}/${trials.length * config.arms.length} runs`);
  }
  json("rows.json", rows);
  json("seeds.json", {
    masterSeed: config.seed, strategySeed: 0, strategy: "survival", seedDerivations: SEED_DERIVATIONS,
    route: "mulberry32(hashString(`difficulty_route_${chartSeed}_${gameSeed}_${mapNumber}_${currentNodeId}`))",
    selfNecessity: "mulberry32(hashString(`${encounterIdSeed ?? run.id}_${run.map.seed}_${nodeId}_player_necessity`))",
    otherNecessity: "mulberry32(hashString(`${encounterIdSeed ?? acceptedSeed}_affliction`))",
    trials, bootstrapResamples: BOOTSTRAP_RESAMPLES,
  });
}
