/** Compare the complete catalogue on fixed states and a cohort covering every rising sign.
 * Run unchanged on both checkouts; see client/README.md for reproduction.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { HOUSES } from "@/data/houses";
import { NARRATIVE_SCENARIOS } from "@/data/narrative-scenarios";
import { aggregate, BOOTSTRAP_RESAMPLES, quantile } from "@/eval/aggregate";
import { batchTrials, chartSeed, SEED_DERIVATIONS } from "@/eval/batch";
import { snapshot } from "@/eval/play";
import { POLICIES, type Strategy } from "@/eval/policies";
import { runTrial, type RunRecord } from "@/eval/runner";
import { seededChart } from "@/game/chart";
import { SIGNS } from "@/game/data";
import { anyCombusted, joyPresent, narrativeContext } from "@/game/narrative";
import { displayStat, STAT_LABEL } from "@/game/relational";
import { hashString, mulberry32 } from "@/game/rng";
import { CATALOGUE_STATES, catalogueState, narrativeMeasures, narrativeOutcomes } from "../tests/narrative-catalogue-fixtures";

const { values: args } = parseArgs({ options: {
  out: { type: "string", default: "eval-results/issue-41-catalogue" },
  "menus-only": { type: "boolean", default: false },
  compare: { type: "string" },
} });
const out = resolve(args.out!);
mkdirSync(out, { recursive: true });
const write = (name: string, value: unknown) => writeFileSync(join(out, name), `${JSON.stringify(value, null, 2)}\n`);
const git = (...argv: string[]) => spawnSync("git", argv, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }).stdout.trim();
const options = { seed: 20261022, chartsPerSign: 2, runs: 5, strategies: ["random", "survival", "light"] as Strategy[], strategySeed: 0 };
const counts = new Map(SIGNS.map((sign) => [sign, 0]));
const cohort = [];
for (let index = 0; cohort.length < SIGNS.length * options.chartsPerSign; index++) {
  const seed = chartSeed(options.seed, index), sign = seededChart(seed).ascendantSign;
  if (counts.get(sign)! >= options.chartsPerSign) continue;
  cohort.push({ index, chartSeed: seed, sign });
  counts.set(sign, counts.get(sign)! + 1);
}
const seeds = new Set(cohort.map((row) => row.chartSeed));
const trials = batchTrials({ ...options, charts: cohort.at(-1)!.index + 1 }).filter((trial) => seeds.has(trial.chartSeed));
write("config.json", {
  options, startingEncounters: [0, 32], revision: git("rev-parse", "HEAD"),
  selection: "First two charts of each rising sign in the seededChart batch sequence, preserving original chart and game seeds.",
  cohort, seedDerivations: SEED_DERIVATIONS, states: CATALOGUE_STATES, nodeVersion: process.version,
  harmless: "Retains carried Light, every previously lit planet and each planet's remaining capacity, including Resolve gains. Other stat gains have no assumed exchange value.",
  ordinary: "Complete resolved choices excluding conditional joy. Full-menu counts also include joy and revival when available. Pool counts are not player frequencies.",
});
const untracked = git("ls-files", "--others", "--exclude-standard", "--", "tests", "scripts").split("\n").filter(Boolean);
writeFileSync(join(out, "source.diff"), git("diff", "HEAD", "--", "src", "tests", "scripts") + "\n" +
  untracked.map((file) => git("diff", "--no-index", "--", "/dev/null", file)).join("\n") + "\n");
write("scenes.json", NARRATIVE_SCENARIOS.map((scene) => ({ ...scene, options: scene.options.map((option) =>
  ({ ...option, visibleIf: option.visibleIf === joyPresent ? "joyPresent" : option.visibleIf === anyCombusted ? "anyCombusted" : null })) })));

const menus = CATALOGUE_STATES.flatMap((sample) => NARRATIVE_SCENARIOS.map((scene) => {
  const { prince, run } = catalogueState(scene, sample), ctx = narrativeContext(prince, run, scene.house);
  const before = narrativeMeasures(prince, run), outcomes = narrativeOutcomes(prince, run, scene);
  if (!outcomes.length) throw new Error(`Unplayable scene: ${scene.scenarioId}/${sample.name}`);
  const ordinary = outcomes.filter(({ option }) => option.visibleIf !== joyPresent);
  if (!ordinary.length) throw new Error(`No ordinary choice: ${scene.scenarioId}/${sample.name}`);
  return {
    state: sample.name, scenarioId: scene.scenarioId, house: scene.house, sign: scene.sign, before,
    occupants: ctx.occupants, joy: joyPresent(ctx),
    compulsory: !outcomes.some((row) => row.harmless), ordinaryCompulsory: !ordinary.some((row) => row.harmless),
    choices: outcomes.map(({ option, selection, after, harmless }) => ({
      optionId: option.id, selection, joy: option.visibleIf === joyPresent, cost: option.cost ?? 0, effects: option.result.effects,
      after, lightDelta: after.light - before.light, capacityDelta: after.capacity - before.capacity, harmless,
    })),
  };
}));
writeFileSync(join(out, "menus.jsonl"), menus.map((row) => JSON.stringify(row)).join("\n") + "\n");
const pools = HOUSES.flatMap((house) => SIGNS.map((sign) => ({
  house: house.num, name: house.name, sign,
  states: CATALOGUE_STATES.map(({ name }) => {
    const rows = menus.filter((row) => row.house === house.num && row.sign === sign && row.state === name);
    return { state: name, ordinaryCompulsory: rows.filter((row) => row.ordinaryCompulsory).map((row) => row.scenarioId),
      compulsory: rows.filter((row) => row.compulsory).map((row) => row.scenarioId),
      bestOrdinaryLight: Math.max(...rows.flatMap((row) => row.choices.filter((choice) => !choice.joy).map((choice) => choice.lightDelta))),
      bestOrdinaryCapacity: Math.max(...rows.flatMap((row) => row.choices.filter((choice) => !choice.joy).map((choice) => choice.capacityDelta))),
      bestLight: Math.max(...rows.flatMap((row) => row.choices.map((choice) => choice.lightDelta))),
      bestCapacity: Math.max(...rows.flatMap((row) => row.choices.map((choice) => choice.capacityDelta))) };
  }),
})));
write("pools.json", pools);
const report = ["# Narrative catalogue review", "", "Counts describe the five authored scenes, not observed encounter frequencies.",
  "Ordinary counts exclude conditional joy choices; full-menu counts include all available choices.",
  "The named states and legal recipients can be reconstructed with `catalogueState` in `tests/narrative-catalogue-fixtures.ts`.", "",
  "| House | Sign | Ordinary costs / 5 | With available joy / 5 | Favorable occupants / 5 | Adverse occupants / 5 | Best ordinary Light | Best ordinary capacity |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |"];
for (const pool of pools) {
  const base = pool.states.find((state) => state.state === "full-wounded-funded")!;
  const favorable = pool.states.find((state) => state.state === "favorable-wounded-funded")!;
  const adverse = pool.states.find((state) => state.state === "adverse-wounded-funded")!;
  report.push(`| ${pool.house} ${pool.name} | ${pool.sign} | ${base.ordinaryCompulsory.length} | ${base.compulsory.length} | ${favorable.compulsory.length} | ${adverse.compulsory.length} | ${base.bestOrdinaryLight} | ${base.bestOrdinaryCapacity} |`);
}
writeFileSync(join(out, "pools.md"), report.join("\n") + "\n");
const menuLines = ["# Complete narrative menus", "", "These are authored base terms; `menus.jsonl` contains occupant-adjusted outcomes for every legal recipient in the named states.", ""];
for (const scene of NARRATIVE_SCENARIOS) {
  menuLines.push(`## ${scene.scenarioId}`, "", scene.text.replace(/([.!?][”"]?)\s+/g, "$1\n"), "", "| Choice | Base effects |", "| --- | --- |");
  for (const option of scene.options) menuLines.push(`| ${option.visibleIf === joyPresent ? "Joy: " : ""}${option.text} | ${option.cost ? `Pay ${option.cost} Light; ` : ""}${option.result.effects.map((effect) =>
    effect.kind === "light" ? `${effect.delta > 0 ? "+" : ""}${effect.delta} Light`
      : effect.kind === "gain" ? `+${displayStat(effect.stat, effect.amount)} ${STAT_LABEL[effect.stat]} on ${effect.target}`
      : effect.kind === "tension" ? `${effect.delta > 0 ? "+" : ""}${effect.delta} tension on ${effect.target}`
      : `revive ${effect.target}`).join("; ") || "No effect"} |`);
  menuLines.push("");
}
writeFileSync(join(out, "menus.md"), menuLines.join("\n"));

if (!args["menus-only"]) for (const starting of [0, 32]) {
  const records = trials.map((trial, index) => {
    const policy = POLICIES[trial.strategy], routes: unknown[] = [];
    const record = runTrial(trial, { ...policy, route(play, run, nodeIds) {
      const chosen = policy.route(play, run, nodeIds);
      routes.push({ map: run.mapsCompleted + 1, from: run.map.currentNodeId, chosen,
        offered: nodeIds.map((nodeId) => ({ nodeId, content: run.map.rolledNodes[nodeId] })), ...snapshot(run) });
      return chosen;
    } }, { startingLifetimeRelationalEncounterCount: starting });
    if ((index + 1) % 30 === 0) process.stderr.write(`Starting ${starting}: ${index + 1}/${trials.length}\n`);
    return { ...record, routes };
  });
  writeFileSync(join(out, `runs-${starting}.jsonl`), records.map((record) => JSON.stringify(record)).join("\n") + "\n");
  write(`report-${starting}.json`, aggregate(records, options.seed));
  write(`visits-${starting}.json`, options.strategies.map((strategy) => {
    const rows = records.filter((record) => record.trial.strategy === strategy);
    const entries = rows.flatMap((row) => row.steps.filter((step) => step.kind === "enter" && step.encounter === "narrative"));
    return { strategy, runs: rows.length, completed: rows.filter((row) => row.summary.endReason === "completion").length,
      meanLight: rows.reduce((sum, row) => sum + row.summary.light, 0) / rows.length, narrativeVisits: entries.length,
      byHouse: Object.fromEntries(HOUSES.map(({ num }) => [num, entries.filter((step) =>
        step.kind === "enter" && step.encounter === "narrative" && NARRATIVE_SCENARIOS.find((scene) => scene.scenarioId === step.scenarioId)?.house === num).length])) };
  }));
}
if (args.compare) {
  const readRecords = (directory: string, tier: number): RunRecord[] =>
    readFileSync(join(directory, `runs-${tier}.jsonl`), "utf8").trim().split("\n").map((line) => JSON.parse(line));
  const paired = [0, 32].flatMap((tier) => {
    const baseline = readRecords(resolve(args.compare!), tier), current = readRecords(out, tier);
    return options.strategies.map((strategy) => {
      const before = baseline.filter((record) => record.trial.strategy === strategy);
      const after = current.filter((record) => record.trial.strategy === strategy);
      if (JSON.stringify(before.map((record) => record.trial)) !== JSON.stringify(after.map((record) => record.trial))) {
        throw new Error("The paired comparison requires identical ordered trial identities");
      }
      const metrics = {
        completion: (row: RunRecord) => Number(row.summary.endReason === "completion"),
        light: (row: RunRecord) => row.summary.light,
        narrativeVisits: (row: RunRecord) => row.steps.filter((step) => step.kind === "enter" && step.encounter === "narrative").length,
      };
      const differences = Object.fromEntries(Object.entries(metrics).map(([metric, measure]) => {
        const clusters = cohort.map(({ chartSeed }) => before.flatMap((record, index) =>
          record.trial.chartSeed === chartSeed ? [measure(after[index]!) - measure(record)] : []));
        const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
        const rng = mulberry32(hashString(`${options.seed}_bootstrap`));
        const draws = Array.from({ length: BOOTSTRAP_RESAMPLES }, () =>
          mean(Array.from({ length: cohort.length }, () => mean(clusters[Math.floor(rng() * cohort.length)]!))));
        return [metric, { mean: mean(clusters.flat()), low: quantile(draws, 0.025), high: quantile(draws, 0.975) }];
      }));
      return { tier, strategy, pairs: before.length, charts: cohort.length, differences };
    });
  });
  write("paired.json", { baseline: resolve(args.compare), resamples: BOOTSTRAP_RESAMPLES,
    method: "Current minus baseline, paired by chart/game/strategy; percentile 95% interval resamples whole charts with replacement using the evaluator bootstrap seed.", rows: paired });
}
process.stderr.write(`Wrote ${out}\n`);
