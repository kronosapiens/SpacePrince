#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, getStringArg, getNumberArg } from "./args.js";

const DEFAULT_LOCATIONS = "377,-1224;-338,1512;515,0;780,153;-780,-680";

// Light eval profile:
// 1) Coarse global coverage with week steps.
// 2) Targeted Mercury-cusp window near 2050 with day steps.
const SUITE = [
  { name: "global_0001_0200", start: "0001-01-01T00:00:00Z", end: "0200-01-01T00:00:00Z", stepMinutes: 10080, maxCases: 80 },
  { name: "global_0500_0700", start: "0500-01-01T00:00:00Z", end: "0700-01-01T00:00:00Z", stepMinutes: 10080, maxCases: 80 },
  { name: "global_1000_1200", start: "1000-01-01T00:00:00Z", end: "1200-01-01T00:00:00Z", stepMinutes: 10080, maxCases: 80 },
  { name: "global_1500_1700", start: "1500-01-01T00:00:00Z", end: "1700-01-01T00:00:00Z", stepMinutes: 10080, maxCases: 80 },
  { name: "global_1900_2100", start: "1900-01-01T00:00:00Z", end: "2100-01-01T00:00:00Z", stepMinutes: 10080, maxCases: 80 },
  { name: "global_2300_2500", start: "2300-01-01T00:00:00Z", end: "2500-01-01T00:00:00Z", stepMinutes: 10080, maxCases: 80 },
  { name: "global_2800_3000", start: "2800-01-01T00:00:00Z", end: "3000-01-01T00:00:00Z", stepMinutes: 10080, maxCases: 80 },
  { name: "global_3800_4000", start: "3800-01-01T00:00:00Z", end: "4000-01-01T00:00:00Z", stepMinutes: 10080, maxCases: 80 },
  { name: "target_2050_cusp", start: "2049-12-01T00:00:00Z", end: "2050-05-01T00:00:00Z", stepMinutes: 1440, maxCases: 200 },
];

const CLI_DIR = path.dirname(fileURLToPath(import.meta.url));
const ASTRO_ROOT = path.resolve(CLI_DIR, "..", "..");
const COMPARE_SCRIPT = path.join(ASTRO_ROOT, "src", "cli", "compare-v5-chart-parity.js");

function parsePassedFailed(output, generatedCases, passedFlag) {
  if (passedFlag) return { passed: generatedCases, failed: 0 };
  const m = output.match(/FAILED\.\s+(\d+) passed;\s+(\d+) failed;/);
  if (m) {
    return { passed: Number(m[1]), failed: Number(m[2]) };
  }
  return { passed: 0, failed: generatedCases };
}

function runCase({ start, end, stepMinutes, maxCases, locations, quantizeMinutes }) {
  let raw = "";
  try {
    raw = execFileSync(
      "node",
      [
        COMPARE_SCRIPT,
        "--start",
        start,
        "--end",
        end,
        "--step-minutes",
        String(stepMinutes),
        "--quantize-minutes",
        String(quantizeMinutes),
        "--max-cases",
        String(maxCases),
        "--locations",
        locations,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (err) {
    raw = `${err.stdout || ""}`.trim();
  }

  if (!raw) {
    throw new Error("Empty result from compare-v5-chart-parity.js");
  }
  return JSON.parse(raw);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const locations = getStringArg(args, "locations", DEFAULT_LOCATIONS);
  const quantizeMinutes = getNumberArg(args, "quantize-minutes", 15);

  let total = 0;
  let passed = 0;
  let failed = 0;
  const windows = [];

  for (const c of SUITE) {
    const result = runCase({ ...c, locations, quantizeMinutes });
    const pf = parsePassedFailed(result.output || "", result.generatedCases, result.passed);
    const cases = pf.passed + pf.failed;
    total += cases;
    passed += pf.passed;
    failed += pf.failed;
    windows.push({
      name: c.name,
      start: c.start,
      end: c.end,
      cases,
      passed: pf.passed,
      failed: pf.failed,
      passRate: cases > 0 ? pf.passed / cases : 0,
    });
  }

  const accuracy = total > 0 ? passed / total : 0;
  const errorRate = total > 0 ? failed / total : 0;
  const errorPerMillion = errorRate * 1_000_000;

  const out = {
    profile: "eval_light_v1",
    quantizeMinutes,
    locations,
    total,
    passed,
    failed,
    accuracy,
    accuracyPercent: accuracy * 100,
    errorRate,
    errorPerMillion,
    targetAccuracyPercent: 99.9999,
    windows,
  };

  console.log(JSON.stringify(out, null, 2));
  if (failed > 0) process.exit(1);
}

main();
