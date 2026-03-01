#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, getStringArg, getNumberArg } from "./args.js";

const DEFAULT_LOCATIONS =
  "0,0;377,-1224;-338,1512;515,0;407,-740;-235,-466;600,300;-600,-300;780,153;-780,-680;100,1790;-100,-1790";

const BASE_SUITE = [
  // Global deterministic uniform coverage.
  {
    stratum: "global_uniform",
    name: "uniform_0001_0200",
    start: "0001-01-01T00:00:00Z",
    end: "0200-01-01T00:00:00Z",
    stepMinutes: 10080,
  },
  {
    stratum: "global_uniform",
    name: "uniform_0334_0534",
    start: "0334-01-01T00:00:00Z",
    end: "0534-01-01T00:00:00Z",
    stepMinutes: 10080,
  },
  {
    stratum: "global_uniform",
    name: "uniform_0667_0867",
    start: "0667-01-01T00:00:00Z",
    end: "0867-01-01T00:00:00Z",
    stepMinutes: 10080,
  },
  {
    stratum: "global_uniform",
    name: "uniform_1000_1200",
    start: "1000-01-01T00:00:00Z",
    end: "1200-01-01T00:00:00Z",
    stepMinutes: 10080,
  },
  {
    stratum: "global_uniform",
    name: "uniform_1334_1534",
    start: "1334-01-01T00:00:00Z",
    end: "1534-01-01T00:00:00Z",
    stepMinutes: 10080,
  },
  {
    stratum: "global_uniform",
    name: "uniform_1667_1867",
    start: "1667-01-01T00:00:00Z",
    end: "1867-01-01T00:00:00Z",
    stepMinutes: 10080,
  },
  {
    stratum: "global_uniform",
    name: "uniform_2000_2200",
    start: "2000-01-01T00:00:00Z",
    end: "2200-01-01T00:00:00Z",
    stepMinutes: 10080,
  },
  {
    stratum: "global_uniform",
    name: "uniform_2334_2534",
    start: "2334-01-01T00:00:00Z",
    end: "2534-01-01T00:00:00Z",
    stepMinutes: 10080,
  },
  {
    stratum: "global_uniform",
    name: "uniform_2667_2867",
    start: "2667-01-01T00:00:00Z",
    end: "2867-01-01T00:00:00Z",
    stepMinutes: 10080,
  },
  {
    stratum: "global_uniform",
    name: "uniform_3000_3200",
    start: "3000-01-01T00:00:00Z",
    end: "3200-01-01T00:00:00Z",
    stepMinutes: 10080,
  },
  {
    stratum: "global_uniform",
    name: "uniform_3334_3534",
    start: "3334-01-01T00:00:00Z",
    end: "3534-01-01T00:00:00Z",
    stepMinutes: 10080,
  },
  {
    stratum: "global_uniform",
    name: "uniform_3667_3867",
    start: "3667-01-01T00:00:00Z",
    end: "3867-01-01T00:00:00Z",
    stepMinutes: 10080,
  },

  // Edge stress near the ends of the supported range.
  {
    stratum: "range_edges",
    name: "edge_0001_0100",
    start: "0001-01-01T00:00:00Z",
    end: "0100-01-01T00:00:00Z",
    stepMinutes: 720,
  },
  {
    stratum: "range_edges",
    name: "edge_0100_0200",
    start: "0100-01-01T00:00:00Z",
    end: "0200-01-01T00:00:00Z",
    stepMinutes: 720,
  },
  {
    stratum: "range_edges",
    name: "edge_3800_3900",
    start: "3800-01-01T00:00:00Z",
    end: "3900-01-01T00:00:00Z",
    stepMinutes: 720,
  },
  {
    stratum: "range_edges",
    name: "edge_3900_4000",
    start: "3900-01-01T00:00:00Z",
    end: "4000-01-01T00:00:00Z",
    stepMinutes: 720,
  },

  // Cusp-heavy higher-frequency scans in eras known to have boundary pressure.
  {
    stratum: "cusp_stress",
    name: "cusp_0500_0520",
    start: "0500-01-01T00:00:00Z",
    end: "0520-01-01T00:00:00Z",
    stepMinutes: 360,
  },
  {
    stratum: "cusp_stress",
    name: "cusp_1000_1020",
    start: "1000-01-01T00:00:00Z",
    end: "1020-01-01T00:00:00Z",
    stepMinutes: 360,
  },
  {
    stratum: "cusp_stress",
    name: "cusp_2800_2820",
    start: "2800-01-01T00:00:00Z",
    end: "2820-01-01T00:00:00Z",
    stepMinutes: 360,
  },
  {
    stratum: "cusp_stress",
    name: "cusp_3800_3820",
    start: "3800-01-01T00:00:00Z",
    end: "3820-01-01T00:00:00Z",
    stepMinutes: 360,
  },

  // Known historical regression windows.
  {
    stratum: "regression_windows",
    name: "regress_2050_cusp",
    start: "2049-12-01T00:00:00Z",
    end: "2050-05-01T00:00:00Z",
    stepMinutes: 1440,
  },
  {
    stratum: "regression_windows",
    name: "regress_2800_3000",
    start: "2800-01-01T00:00:00Z",
    end: "3000-01-01T00:00:00Z",
    stepMinutes: 10080,
  },
];

const DEFAULT_CASES_PER_WINDOW = 200;

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

function buildSuite(casesPerWindow) {
  return BASE_SUITE.map((x) => ({ ...x, maxCases: casesPerWindow }));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const locations = getStringArg(args, "locations", DEFAULT_LOCATIONS);
  const quantizeMinutes = getNumberArg(args, "quantize-minutes", 15);
  const casesPerWindow = getNumberArg(args, "cases-per-window", DEFAULT_CASES_PER_WINDOW);
  const suite = buildSuite(casesPerWindow);

  let total = 0;
  let passed = 0;
  let failed = 0;
  const windows = [];
  /** @type {Record<string, {cases:number, passed:number, failed:number}>} */
  const strata = {};

  const startedAt = Date.now();

  for (const c of suite) {
    const caseStartedAt = Date.now();
    const result = runCase({ ...c, locations, quantizeMinutes });
    const pf = parsePassedFailed(result.output || "", result.generatedCases, result.passed);
    const cases = pf.passed + pf.failed;
    const durationMs = Date.now() - caseStartedAt;

    total += cases;
    passed += pf.passed;
    failed += pf.failed;

    if (!strata[c.stratum]) {
      strata[c.stratum] = { cases: 0, passed: 0, failed: 0 };
    }
    strata[c.stratum].cases += cases;
    strata[c.stratum].passed += pf.passed;
    strata[c.stratum].failed += pf.failed;

    windows.push({
      stratum: c.stratum,
      name: c.name,
      start: c.start,
      end: c.end,
      stepMinutes: c.stepMinutes,
      cases,
      passed: pf.passed,
      failed: pf.failed,
      passRate: cases > 0 ? pf.passed / cases : 0,
      durationMs,
    });
  }

  const accuracy = total > 0 ? passed / total : 0;
  const errorRate = total > 0 ? failed / total : 0;
  const errorPerMillion = errorRate * 1_000_000;
  const durationMs = Date.now() - startedAt;

  const stratumSummaries = Object.entries(strata).map(([name, s]) => ({
    name,
    cases: s.cases,
    passed: s.passed,
    failed: s.failed,
    passRate: s.cases > 0 ? s.passed / s.cases : 0,
  }));

  const out = {
    profile: "eval_heavy_v1",
    quantizeMinutes,
    locations,
    casesPerWindow,
    total,
    passed,
    failed,
    accuracy,
    accuracyPercent: accuracy * 100,
    errorRate,
    errorPerMillion,
    targetAccuracyPercent: 99.9999,
    durationMs,
    stratumSummaries,
    windows,
  };

  console.log(JSON.stringify(out, null, 2));
  if (failed > 0) process.exit(1);
}

main();
