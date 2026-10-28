import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { historyDirectory, manifest } from "./config";
import { sha256 } from "./record";

const { values } = parseArgs({
  options: { experiment: { type: "string" }, charts: { type: "string" }, runs: { type: "string" }, out: { type: "string" }, help: { type: "boolean" } },
});
if (values.help) {
  console.log("eval-history --experiment fortune|lethality|necessity|basic [--charts N] [--runs N] --out DIR\nDefaults reproduce each original full-roster sample; smaller samples use its first charts/game seeds. Requires Git history containing " + manifest.baseRevision);
  process.exit(0);
}
const experimentName = values.experiment;
assert(experimentName && Object.hasOwn(manifest.experiments, experimentName), "Choose --experiment fortune|lethality|necessity|basic; see --help");
const experiment = manifest.experiments[experimentName]!;
const positiveInteger = (value: string | undefined, fallback: number, flag: string) => {
  const n = value === undefined ? fallback : Number(value);
  assert(Number.isSafeInteger(n) && n > 0, `${flag} must be a positive integer`);
  return n;
};
const charts = positiveInteger(values.charts, experiment.charts, "--charts");
const runs = positiveInteger(values.runs, experiment.runs, "--runs");
assert(values.out, "Supply a new --out directory");
const out = path.resolve(values.out);
assert(!existsSync(out), `Output already exists: ${out}; choose a new directory`);
const client = path.resolve(historyDirectory, "../..");
const repo = path.dirname(client);
const git = (...args: string[]) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
try {
  git("cat-file", "-e", `${manifest.baseRevision}^{commit}`);
} catch {
  throw new Error(`Missing historical Git commit ${manifest.baseRevision}. Fetch repository history before reconstruction; current source cannot substitute for the 28-scene catalogue.`);
}
const viteNode = path.join(client, "node_modules/vite-node/vite-node.mjs");
assert(existsSync(viteNode), "Install client dependencies before running eval-history");
const dependencies = realpathSync(path.join(client, "node_modules"));
const dependencyVersions = Object.fromEntries(["vite-node", "vite", "astronomy-engine"].map((name) => [
  name, JSON.parse(readFileSync(path.join(dependencies, name, "package.json"), "utf8")).version,
]));
assert.equal(dependencyVersions["vite-node"], manifest.historicalViteNode, "Use the historical vite-node version; replay hashes additionally check gameplay compatibility");

function hashes(directory: string, prefixes = [""]): Record<string, string> {
  const files: Record<string, string> = {};
  const walk = (relative: string) => {
    for (const entry of readdirSync(path.join(directory, relative), { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const name = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) walk(name);
      else files[name] = sha256(readFileSync(path.join(directory, name)));
    }
  };
  for (const prefix of prefixes) walk(prefix);
  return files;
}

mkdirSync(out, { recursive: true });
const configuration = {
  format: manifest.format, experimentName, experiment, charts, runs,
  totalRuns: charts * runs * experiment.arms.length * Object.keys(experiment.variants).length,
  baseRevision: manifest.baseRevision, toolingRevision: git("rev-parse", "HEAD").trim(),
  catalogue: manifest.catalogue, policySemantics: manifest.policySemantics,
  command: process.argv, node: process.version, dependencyVersions,
  historicalNode: manifest.historicalNode, createdAt: new Date().toISOString(),
  toolingSha256: hashes(historyDirectory),
  inference: "Existing evaluator: 1000 chart-clustered bootstrap resamples. Gameplay and corrected summaries are checked exactly; intervals do not reproduce the historical Python analysis's 5000-resample implementation.",
};
writeFileSync(path.join(out, "config.json"), JSON.stringify(configuration, null, 2) + "\n");
const scratch = mkdtempSync(path.join(out, ".reconstruction-"));
try {
  const archive = path.join(scratch, "base.tar");
  git("archive", "--format=tar", `--output=${archive}`, manifest.baseRevision, "client/src", "client/package.json", "client/pnpm-lock.yaml");
  const variants = Object.entries(experiment.variants);
  for (const [index, [name, variant]] of variants.entries()) {
    const workspace = path.join(scratch, name);
    mkdirSync(workspace);
    execFileSync("tar", ["-xf", archive, "-C", workspace]);
    for (const patch of [...manifest.commonPatches, ...variant.patches]) {
      execFileSync("git", ["apply", "--check", path.join(historyDirectory, "patches", `${patch}.patch`)], { cwd: workspace });
      execFileSync("git", ["apply", path.join(historyDirectory, "patches", `${patch}.patch`)], { cwd: workspace });
    }
    const localClient = path.join(workspace, "client");
    const sourceHashes = hashes(path.join(localClient, "src"));
    const runtimeHashes = hashes(path.join(localClient, "src"), ["astronomy", "data", "game"]);
    const fingerprint = sha256(Object.entries(runtimeHashes).map(([name, hash]) => `${name}\0${hash}\n`).join(""));
    assert.equal(fingerprint, variant.runtimeSha256, `Restored ${name} gameplay differs from archived source`);
    const destination = path.join(localClient, "scripts/eval-history");
    mkdirSync(destination, { recursive: true });
    for (const file of ["worker.ts", "policies.ts", "record.ts", "config.ts", "manifest.json", "checkpoints.json"]) copyFileSync(path.join(historyDirectory, file), path.join(destination, file));
    symlinkSync(dependencies, path.join(localClient, "node_modules"), "dir");
    const viteConfig = path.join(localClient, "vite.config.ts");
    writeFileSync(viteConfig, `export default ${JSON.stringify({ root: localClient, resolve: { alias: { "@": path.join(localClient, "src") } }, server: { fs: { allow: [workspace, dependencies] } } })};\n`);
    const variantOut = path.join(out, name);
    mkdirSync(variantOut);
    writeFileSync(path.join(variantOut, "source-sha256.json"), JSON.stringify({ runtimeSha256: fingerprint, files: sourceHashes }, null, 2) + "\n");
    const invoke = (args: string[]) => {
      const result = spawnSync(process.execPath, [viteNode, "--config", viteConfig, path.join(destination, "worker.ts"), ...args], { cwd: localClient, stdio: "inherit" });
      if (result.error) throw result.error;
      assert.equal(result.status, 0, `Historical worker failed (${name}); inspect ${out}`);
    };
    invoke(["run", variantOut, experimentName, name, String(charts), String(runs)]);
    if (index === variants.length - 1) invoke(["aggregate", out]);
    rmSync(workspace, { recursive: true });
  }
  writeFileSync(path.join(out, "complete.json"), JSON.stringify({ completedAt: new Date().toISOString(), totalRuns: configuration.totalRuns, checkpointsPassed: true }) + "\n");
  console.log(`Historical ${experimentName} complete: ${out}`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
