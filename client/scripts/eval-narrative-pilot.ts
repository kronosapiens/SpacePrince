/** Issue #41: fixed Leo-rising cohort and complete menus through the real resolvers.
 * Run unchanged on the foundation and pilot checkouts, writing to separate directories.
 * pnpm exec vite-node scripts/eval-narrative-pilot.ts --out eval-results/issue-41-pilot
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { aggregate, BOOTSTRAP_RESAMPLES, quantile } from "@/eval/aggregate";
import { batchTrials, chartSeed, SEED_DERIVATIONS } from "@/eval/batch";
import { snapshot, statePressure } from "@/eval/play";
import { POLICIES, type Strategy } from "@/eval/policies";
import { runTrial, type RunRecord } from "@/eval/runner";
import { seededChart } from "@/game/chart";
import { joyPresent, narrativeContext } from "@/game/narrative";
import { hashString, mulberry32 } from "@/game/rng";
import { PILOT_SCENES, PILOT_STATES, pilotMeasures, pilotOutcomes, pilotState } from "../tests/narrative-pilot-fixtures";

const { values: args } = parseArgs({ options: {
  out: { type: "string", default: "eval-results/issue-41-pilot" },
  "menus-only": { type: "boolean", default: false },
  compare: { type: "string" },
} });
const out = resolve(args.out!);
mkdirSync(out, { recursive: true });
const write = (name: string, value: unknown) => writeFileSync(join(out, name), `${JSON.stringify(value, null, 2)}\n`);
const git = (...argv: string[]) => spawnSync("git", argv, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }).stdout.trim();
const options = { seed: 20261022, charts: 12, runs: 5, strategies: ["random", "survival", "light"] as Strategy[], strategySeed: 0 };
const indices: number[] = [];
for (let index = 0; indices.length < options.charts; index++) {
  if (seededChart(chartSeed(options.seed, index)).ascendantSign === "Leo") indices.push(index);
}
const seeds = indices.map((index) => chartSeed(options.seed, index));
const trials = batchTrials({ ...options, charts: indices.at(-1)! + 1 }).filter((trial) => seeds.includes(trial.chartSeed));
write("config.json", {
  options, startingEncounters: [0, 32], revision: git("rev-parse", "HEAD"),
  selection: "First 12 Leo-rising seededChart results in batchTrials' master-seed chart sequence; preserve original indices and game seeds.",
  cohort: indices.map((index, i) => ({ index, chartSeed: seeds[i] })), seedDerivations: SEED_DERIVATIONS,
  states: PILOT_STATES, nodeVersion: process.version,
  harmless: "Carried Light, every previously lit planet, and every fielded planet's remaining capacity are retained, including Resolve gains. No exchange value assigned to gains or rewards.",
});
const untracked = git("ls-files", "--others", "--exclude-standard", "--", "tests", "scripts").split("\n").filter(Boolean);
writeFileSync(join(out, "source.diff"), git("diff", "HEAD", "--", "src", "tests", "scripts") + "\n" +
  untracked.map((file) => git("diff", "--no-index", "--", "/dev/null", file)).join("\n") + "\n");
write("scenes.json", PILOT_SCENES.map((scene) => ({ ...scene, options: scene.options.map((option) =>
  ({ ...option, visibleIf: option.visibleIf ? "joyPresent" : null })) })));

const menus = PILOT_STATES.flatMap((sample) => PILOT_SCENES.map((scene) => {
  const { prince, run } = pilotState(scene, sample);
  const ctx = narrativeContext(prince, run, scene.house);
  const outcomes = pilotOutcomes(prince, run, scene);
  const choices = outcomes.map(({ option, selection, after, next, harmless }) => ({
    optionId: option.id, text: option.text, selection, cost: option.cost ?? 0, effects: option.result.effects,
    after, lightDelta: next.light - run.light,
    pressure: statePressure(prince.chart, snapshot(run), snapshot(next), ctx.unlocked), harmless,
  }));
  const available = [...new Set(outcomes.map(({ option }) => option.id))];
  const harmless = [...new Set(outcomes.filter((row) => row.harmless).map(({ option }) => option.id))];
  const best = Object.fromEntries((["survival", "light"] as const).map((strategy) => {
    const policy = POLICIES[strategy];
    const play = { trial: trials[0]!, prince, policy, rng: mulberry32(41), turnRng: () => mulberry32(41) };
    const offers = scene.options.flatMap((raw) => {
      const selections = outcomes.filter(({ option }) => option.id === raw.id);
      return selections.length ? [{ option: selections[0]!.option, selections: selections.map((row) => row.selection) }] : [];
    });
    return [strategy, policy.narrative(play, run, offers)];
  }));
  return { state: sample.name, scenarioId: scene.scenarioId, house: scene.house,
    prince, run, before: pilotMeasures(prince, run), occupants: ctx.occupants, joy: joyPresent(ctx),
    available, harmless, compulsory: !harmless.length, best, choices };
}));
write("menus.json", menus);

const menuLines = ["# Issue 41 complete menus", "",
  "Terms below are authored base terms; `menus.json` contains adjusted terms and every legal recipient in all named states.",
  "Light costs require payment in full; affliction may combust a planet while retaining the full reward.",
  "Luck is the internal stat: 12 Luck displays as 6 Fortune.",
  "`chosen` is the player's one selected planet; `allUnlocked` affects lit unlocked planets; `joy` is Jupiter in XI and Saturn in XII.", ""];
for (const scene of PILOT_SCENES) {
  menuLines.push(`## ${scene.scenarioId}`, "", scene.text.replace(/([.!?][”"]?)\s+/g, "$1\n"), "", "| Choice | Base effects |", "| --- | --- |");
  for (const option of scene.options) menuLines.push(`| ${option.visibleIf ? "Joy: " : ""}${option.text} | ${option.cost ? `Pay ${option.cost} Light; ` : ""}${option.result.effects.map((effect) =>
    effect.kind === "light" ? `${effect.delta > 0 ? "+" : ""}${effect.delta} Light`
      : effect.kind === "gain" ? `+${effect.amount} ${effect.stat} on ${effect.target}`
      : effect.kind === "affliction" ? `${effect.delta > 0 ? "+" : ""}${effect.delta} affliction on ${effect.target}`
      : `revive ${effect.target}`).join("; ") || "No effect"} |`);
  menuLines.push("");
}
writeFileSync(join(out, "menus.md"), menuLines.join("\n"));

const overview = ["# Issue 41 named states", "", "Fortune gains are reported as raw Luck; 12 Luck displays as 6 Fortune.",
  "Capacity is remaining room before combustion, including run-long Resolve gains.",
  "A harmless choice retains carried Light, previously lit planets, and each planet's capacity; other stat gains are reported separately.",
  "Best choices use the existing survival and light policies with a fixed tie seed of 41.", "",
  "| State | Scene | Start Light / capacity / lit | Harmless / available choices | Survival choice | Light choice |",
  "| --- | --- | --- | --- | --- | --- |"];
for (const row of menus) overview.push(`| ${row.state} | ${row.scenarioId} | ${row.before.light} / ${row.before.capacity} / ${row.before.lit.length} | ${row.harmless.length} / ${row.available.length} | ${JSON.stringify(row.best.survival)} | ${JSON.stringify(row.best.light)} |`);
writeFileSync(join(out, "states.md"), overview.join("\n") + "\n");

if (!args["menus-only"]) for (const starting of [0, 32]) {
  const records = trials.map((trial, index) => {
    const policy = POLICIES[trial.strategy];
    const routes: unknown[] = [];
    const record = runTrial(trial, { ...policy, route(play, run, nodeIds) {
      const chosen = policy.route(play, run, nodeIds);
      routes.push({ map: run.mapsCompleted + 1, from: run.map.currentNodeId, chosen,
        offered: nodeIds.map((nodeId) => ({ nodeId, content: run.map.rolledNodes[nodeId] })),
        ...snapshot(run) });
      return chosen;
    } }, { startingLifetimeRelationalEncounterCount: starting });
    process.stderr.write(`\rLeo starting ${starting}: ${index + 1}/${trials.length}`);
    return { ...record, routes };
  });
  process.stderr.write("\n");
  writeFileSync(join(out, `leo-${starting}-records.jsonl`), records.map((record) => JSON.stringify(record)).join("\n") + "\n");
  write(`leo-${starting}-report.json`, aggregate(records, options.seed));
  write(`leo-${starting}-visits.json`, options.strategies.map((strategy) => {
    const rows = records.filter((record) => record.trial.strategy === strategy);
    const entries = rows.flatMap((row) => row.steps.filter((step) => step.kind === "enter" && step.encounter === "narrative"));
    const pilotVisits = entries.filter((step) => step.kind === "enter" && step.encounter === "narrative" && PILOT_SCENES.some((scene) => scene.scenarioId === step.scenarioId));
    return { strategy, runs: rows.length, completed: rows.filter((row) => row.summary.endReason === "completion").length,
      meanLight: rows.reduce((sum, row) => sum + row.summary.light, 0) / rows.length,
      narrativeVisits: entries.length, pilotVisits: pilotVisits.length,
      byScene: Object.fromEntries(PILOT_SCENES.map((scene) => [scene.scenarioId,
        pilotVisits.filter((step) => step.kind === "enter" && step.encounter === "narrative" && step.scenarioId === scene.scenarioId).length])) };
  }));
}
if (args.compare) {
  const readRecords = (directory: string, tier: number): RunRecord[] =>
    readFileSync(join(directory, `leo-${tier}-records.jsonl`), "utf8").trim().split("\n").map((line) => JSON.parse(line));
  const paired = [0, 32].flatMap((tier) => {
    const baseline = readRecords(resolve(args.compare!), tier), pilot = readRecords(out, tier);
    return options.strategies.map((strategy) => {
      const before = baseline.filter((record) => record.trial.strategy === strategy);
      const after = pilot.filter((record) => record.trial.strategy === strategy);
      if (JSON.stringify(before.map((record) => record.trial)) !== JSON.stringify(after.map((record) => record.trial))) {
        throw new Error("The paired comparison requires identical ordered trial identities");
      }
      const metrics = {
        completion: (row: RunRecord) => Number(row.summary.endReason === "completion"),
        light: (row: RunRecord) => row.summary.light,
        narrativeVisits: (row: RunRecord) => row.steps.filter((step) => step.kind === "enter" && step.encounter === "narrative").length,
      };
      const differences = Object.fromEntries(Object.entries(metrics).map(([metric, measure]) => {
        const clusters = seeds.map((seed) => before.flatMap((record, index) =>
          record.trial.chartSeed === seed ? [measure(after[index]!) - measure(record)] : []));
        const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
        const rng = mulberry32(hashString(`${options.seed}_bootstrap`));
        const draws = Array.from({ length: BOOTSTRAP_RESAMPLES }, () =>
          mean(Array.from({ length: seeds.length }, () => mean(clusters[Math.floor(rng() * seeds.length)]!))));
        return [metric, { mean: mean(clusters.flat()), low: quantile(draws, 0.025), high: quantile(draws, 0.975) }];
      }));
      return { tier, strategy, pairs: before.length, charts: seeds.length, differences };
    });
  });
  write("paired.json", { baseline: resolve(args.compare), resamples: BOOTSTRAP_RESAMPLES,
    method: "Pilot minus baseline, paired by chart/game/strategy; percentile 95% interval resamples whole charts with replacement using the evaluator bootstrap seed.", rows: paired });
}
process.stderr.write(`Wrote ${out}\n`);
