/**
 * Narrative-economy calibration: what each change to a player's planet is worth
 * in end-of-run Light, measured on the game's own rules (`src/game/`).
 *
 * Each chart plays a baseline run, then paired runs that differ only by one
 * treatment applied at a map opening. Every random stream derives from the
 * chart's pair seed, so the Light difference is the treatment's effect.
 *
 *   pnpm sim:economy [--charts N] [--roster 7] [--maps 1,3,5] [--seed 1] [--json out.json]
 *
 * The run lifecycle mirrors the client: `beginRun` (store-actions `useStartRun`),
 * node entry and `beginCombatEncounter` (MapScreen `handleNodeSelect`), the turn
 * rng and `resolveTurn` (EncounterCombat `handleCommit`, store-actions
 * `useCommitTurn`), clearing the encounter (EncounterScreen `clearEncounter`),
 * and `rolloverMap` once the terminal node is cleared (MapScreen's effect).
 */
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { cloneSideState, seededChart } from "@/game/chart";
import { combustionCeiling, isCombusted, uncombust } from "@/game/combust";
import { PLANETS, UNLOCK_THRESHOLDS } from "@/game/data";
import { beginCombatEncounter } from "@/game/encounter";
import { eligibleNext, TERMINAL_NODE_ID } from "@/game/map-gen";
import { hashString, mulberry32, pickWeighted } from "@/game/rng";
import { beginRun, isOver, MAPS_PER_RUN, rolloverMap } from "@/game/run";
import { resolveTurn } from "@/game/turn";
import { unlockedPlanets } from "@/game/unlocks";
import { NARRATIVE_ECONOMY } from "@/data/economy";
import type { Chart, PlanetName, PlanetStats, Polarity, Run } from "@/game/types";

// ── Options ─────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    charts: { type: "string", default: "600" },
    roster: { type: "string", default: "7" },
    maps: { type: "string", default: "1,3,5" },
    seed: { type: "string", default: "1" },
    json: { type: "string" },
  },
});
const CHARTS = Number(args.charts);
const ROSTER_SIZE = Number(args.roster);
const TREAT_MAPS = args.maps.split(",").map(Number);
const BASE_SEED = Number(args.seed);
if (!(ROSTER_SIZE >= 1 && ROSTER_SIZE <= PLANETS.length)) throw new Error("--roster must be 1–7");
if (TREAT_MAPS.some((m) => !(m >= 1 && m <= MAPS_PER_RUN))) throw new Error("--maps must be 1–7");

// The roster is an unlock tier, fixed for the whole run (no mid-run unlocks):
// the first N planets in unlock order, via the lifetime count that fields them.
const TIER = UNLOCK_THRESHOLDS[ROSTER_SIZE - 1]!;
const ROSTER = unlockedPlanets(TIER);

/** Seeds in `randomSeed`'s range, derived from labelled parts. */
const seedOf = (...parts: (string | number)[]) => hashString(parts.join("_")) % 2 ** 31;

// ── Run loop ────────────────────────────────────────────────────────────────

const VERBS: Polarity[] = ["Affliction", "Testimony"];

/** Baseline-only observer: snapshots at each map opening, and per-combat tallies. */
interface Watch {
  mapOpened(run: Run): void;
  combat(map: number, light: number, afflictionTaken: number): void;
}

const fieldedAffliction = (run: Run) => ROSTER.reduce((s, p) => s + run.state[p].affliction, 0);

/**
 * Greedy policy: the lit planet and verb that gather the most Light this turn,
 * ties broken by the least affliction left on the player's fielded planets,
 * then by roster and verb order. Each candidate runs the real resolver with a
 * throwaway rng — the rng only draws the next precommit, never this outcome.
 */
function chooseAction(run: Run, chart: Chart): { planet: PlanetName; verb: Polarity } {
  let best: { planet: PlanetName; verb: Polarity; light: number; load: number } | null = null;
  for (const planet of ROSTER) {
    if (isCombusted(chart.planets[planet], run.state[planet])) continue;
    for (const verb of VERBS) {
      const result = resolveTurn(run, chart, planet, verb, () => 0)!;
      const light = result.log.lightGain;
      const load = fieldedAffliction(result.run);
      if (!best || light > best.light || (light === best.light && load < best.load)) {
        best = { planet, verb, light, load };
      }
    }
  }
  if (!best) throw new Error("no lit planet can act");
  return best;
}

function playCombat(run: Run, chart: Chart, opponentSeed: number, watch?: Watch): Run {
  const map = run.mapsCompleted + 1;
  let r: Run = {
    ...run,
    encounter: beginCombatEncounter({ run, opponentSeed, lifetimeEncounterCount: TIER }),
  };
  // A run whose fielded planets all combust mid-encounter is over: no lit
  // planet is left to act, so the encounter cannot finish.
  while (r.encounter?.kind === "combat" && !r.encounter.resolved && !isOver(r, chart, TIER)) {
    const enc = r.encounter;
    const { planet, verb } = chooseAction(r, chart);
    // The client's per-turn rng (EncounterCombat `handleCommit`).
    const rng = mulberry32((r.seed ^ enc.turnIndex ^ hashString(enc.id)) >>> 0);
    r = resolveTurn(r, chart, planet, verb, rng)!.run;
  }
  watch?.combat(map, r.light - run.light, fieldedAffliction(r) - fieldedAffliction(run));
  return { ...r, encounter: null };
}

/** Walks one map from its root to the terminal node, or until the run ends. */
function playMap(run: Run, chart: Chart, pairSeed: number, watch?: Watch): Run {
  const pathRng = mulberry32(seedOf(pairSeed, "path", run.mapsCompleted + 1));
  let r = run;
  while (r.map.currentNodeId !== TERMINAL_NODE_ID) {
    const options = eligibleNext(r.map.graph, r.map.currentNodeId, r.map.visitedNodeIds);
    const nodeId = pickWeighted(options, pathRng); // uniform
    r = {
      ...r,
      map: { ...r.map, currentNodeId: nodeId, visitedNodeIds: [...r.map.visitedNodeIds, nodeId] },
    };
    const content = r.map.rolledNodes[nodeId]!;
    // Narrative nodes are a walk-away: no effects.
    if (content.kind === "narrative") continue;
    r = playCombat(r, chart, content.opponentSeed, watch);
    if (isOver(r, chart, TIER)) return r;
  }
  return r;
}

/** Plays from a map opening (root node, no encounter) to the end of the run. */
function playRun(run: Run, chart: Chart, pairSeed: number, watch?: Watch): Run {
  let r = run;
  for (;;) {
    if (isOver(r, chart, TIER)) return r;
    watch?.mapOpened(r);
    r = playMap(r, chart, pairSeed, watch);
    if (isOver(r, chart, TIER)) return r;
    r = rolloverMap(r, chart, ROSTER, seedOf(pairSeed, "map", r.mapsCompleted + 2));
  }
}

// ── Treatments ──────────────────────────────────────────────────────────────

const TREATMENTS = [
  "recover24", "afflict24", "resolve12", "testify12", "afflict12", "luck12", "revive",
] as const;
type Treatment = (typeof TREATMENTS)[number];

/** Current narrative prices (`economy.ts`); afflict24 is a wound, and Testify is not sold. */
const PRICE: Record<Treatment, number | null> = {
  recover24: NARRATIVE_ECONOMY.recovery.cost,
  afflict24: null,
  resolve12: NARRATIVE_ECONOMY.resolve.cost,
  testify12: null,
  afflict12: NARRATIVE_ECONOMY.afflict.cost,
  luck12: NARRATIVE_ECONOMY.fortune.cost,
  revive: NARRATIVE_ECONOMY.revive.cost,
};

/** +12 to a stat for the rest of the run: placement buffs feed both the
 *  effective stats and the combustion ceiling. */
function buffed(chart: Chart, planet: PlanetName, stat: keyof PlanetStats): Chart {
  const next = structuredClone(chart);
  next.planets[planet].buffs[stat] += 12;
  return next;
}

/** Applies a treatment at a map opening; null when it is ineligible. `moved`
 *  is the affliction actually removed or added. */
function treat(
  treatment: Treatment,
  run: Run,
  chart: Chart,
  planet: PlanetName,
): { run: Run; chart: Chart; moved: number } | null {
  const placement = chart.planets[planet];
  const lit = !isCombusted(placement, run.state[planet]);
  const state = cloneSideState(run.state);
  const ps = state[planet];
  switch (treatment) {
    case "recover24": {
      if (!lit) return null;
      const moved = Math.min(24, ps.affliction);
      ps.affliction -= moved;
      return { run: { ...run, state }, chart, moved };
    }
    case "afflict24":
      // Landing exactly on the ceiling combusts; past it does not fit.
      if (ps.affliction + 24 > combustionCeiling(placement)) return null;
      ps.affliction += 24;
      return { run: { ...run, state }, chart, moved: 24 };
    case "revive":
      if (lit) return null;
      uncombust(placement, ps);
      return { run: { ...run, state }, chart, moved: 0 };
    // Raising a combusted planet's ceiling would silently revive it.
    case "resolve12":
      return lit ? { run, chart: buffed(chart, planet, "resolve"), moved: 0 } : null;
    case "testify12":
      return { run, chart: buffed(chart, planet, "testimony"), moved: 0 };
    case "afflict12":
      return { run, chart: buffed(chart, planet, "affliction"), moved: 0 };
    case "luck12":
      return { run, chart: buffed(chart, planet, "luck"), moved: 0 };
  }
}

// ── Measurement ─────────────────────────────────────────────────────────────

interface MapTally {
  reached: number;
  litAtOpen: number;
  combats: number;
  light: number;
  afflictionTaken: number;
}

interface Obs {
  chart: number;
  treatment: Treatment;
  map: number;
  planet: PlanetName;
  dLight: number;
  moved: number;
}

const mapTallies: MapTally[] = Array.from({ length: MAPS_PER_RUN }, () => ({
  reached: 0, litAtOpen: 0, combats: 0, light: 0, afflictionTaken: 0,
}));
const finalLights: number[] = [];
const earlyEnds: number[] = Array(MAPS_PER_RUN).fill(0); // by map the run ended on
const observations: Obs[] = [];

const started = performance.now();
for (let i = 0; i < CHARTS; i++) {
  const pairSeed = seedOf(BASE_SEED, i);
  const chart = seededChart(pairSeed);
  const snapshots = new Map<number, Run>();
  const baseline = playRun(beginRun(chart, seedOf(pairSeed, "run"), TIER), chart, pairSeed, {
    mapOpened(run) {
      const map = run.mapsCompleted + 1;
      snapshots.set(map, run);
      const tally = mapTallies[map - 1]!;
      tally.reached++;
      tally.litAtOpen += ROSTER.filter((p) => !isCombusted(chart.planets[p], run.state[p])).length;
    },
    combat(map, light, afflictionTaken) {
      const tally = mapTallies[map - 1]!;
      tally.combats++;
      tally.light += light;
      tally.afflictionTaken += afflictionTaken;
    },
  });
  finalLights.push(baseline.light);
  const endMap = baseline.mapsCompleted; // 0-based index of the map it ended on
  if (endMap < MAPS_PER_RUN) earlyEnds[endMap] = earlyEnds[endMap]! + 1;

  // Treated runs resume from the baseline's snapshot at map k's opening — the
  // same state a from-scratch run reaches, since nothing differs before it.
  for (const map of TREAT_MAPS) {
    const opening = snapshots.get(map);
    if (!opening) continue; // the run ended before map k
    for (const treatment of TREATMENTS) {
      for (const planet of ROSTER) {
        const treated = treat(treatment, opening, chart, planet);
        if (!treated) continue;
        const end = playRun(treated.run, treated.chart, pairSeed);
        observations.push({
          chart: i, treatment, map, planet, dLight: end.light - baseline.light, moved: treated.moved,
        });
      }
    }
  }
  if ((i + 1) % 10 === 0 || i + 1 === CHARTS) {
    const s = (performance.now() - started) / 1000;
    process.stderr.write(`  ${i + 1}/${CHARTS} charts · ${s.toFixed(1)}s\n`);
  }
}
const elapsed = (performance.now() - started) / 1000;

// ── Statistics ──────────────────────────────────────────────────────────────

/**
 * Σy / Σx with a chart-clustered, delta-method standard error: observations
 * from one chart share its baseline run, so they are not independent. With
 * x ≡ 1 this is the mean and its cluster-robust SE.
 */
function ratio(obs: Obs[], y: (o: Obs) => number, x: (o: Obs) => number) {
  const sx = obs.reduce((s, o) => s + x(o), 0);
  if (obs.length === 0 || sx === 0) return { value: NaN, se: NaN, n: obs.length };
  const value = obs.reduce((s, o) => s + y(o), 0) / sx;
  const byChart = new Map<number, number>();
  for (const o of obs) byChart.set(o.chart, (byChart.get(o.chart) ?? 0) + y(o) - value * x(o));
  const g = byChart.size;
  const ss = [...byChart.values()].reduce((s, e) => s + e * e, 0);
  const se = g > 1 ? Math.sqrt((ss * g) / (g - 1)) / sx : NaN;
  return { value, se, n: obs.length };
}
const meanOf = (obs: Obs[]) => ratio(obs, (o) => o.dLight, () => 1);
const perPoint = (obs: Obs[]) => ratio(obs, (o) => o.dLight, (o) => o.moved);

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}

// ── Report ──────────────────────────────────────────────────────────────────

function table(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, c) => Math.max(h.length, ...rows.map((r) => r[c]!.length)));
  const line = (cells: string[]) =>
    cells.map((cell, c) => (c === 0 ? cell.padEnd(widths[c]!) : cell.padStart(widths[c]!))).join("  ");
  return [line(headers), line(widths.map((w) => "-".repeat(w))), ...rows.map(line)].join("\n");
}
const fmt = (v: number, digits = 1) => (Number.isFinite(v) ? v.toFixed(digits) : "–");
const signed = (v: number, digits = 1) => (Number.isFinite(v) && v >= 0 ? "+" : "") + fmt(v, digits);
const pct = (v: number) => `${(100 * v).toFixed(1)}%`;

const sortedLights = [...finalLights].sort((a, b) => a - b);
const finalStats = {
  mean: finalLights.reduce((s, v) => s + v, 0) / CHARTS,
  median: quantile(sortedLights, 0.5),
  p10: quantile(sortedLights, 0.1),
  p90: quantile(sortedLights, 0.9),
};
const earlyEndRate = earlyEnds.reduce((s, v) => s + v, 0) / CHARTS;

const baselineRows = mapTallies.map((t, m) => ({
  map: m + 1,
  reached: t.reached / CHARTS,
  litAtOpen: t.litAtOpen / t.reached,
  combats: t.combats / t.reached,
  lightPerCombat: t.light / t.combats,
  afflictionPerCombat: t.afflictionTaken / t.combats,
  lightPerMap: t.light / t.reached,
}));

const slots = CHARTS * ROSTER.length;
const treatmentRows = TREATMENTS.flatMap((treatment) =>
  TREAT_MAPS.map((map) => {
    const obs = observations.filter((o) => o.treatment === treatment && o.map === map);
    const mean = meanOf(obs);
    const point = treatment === "recover24" || treatment === "afflict24" ? perPoint(obs) : null;
    return {
      treatment, map, price: PRICE[treatment], eligible: obs.length / slots,
      n: obs.length, dLight: mean.value, se: mean.se,
      lightPerPoint: point?.value ?? null, lightPerPointSe: point?.se ?? null,
      meanMoved: point ? obs.reduce((s, o) => s + o.moved, 0) / obs.length : null,
    };
  }),
);

const planetRows = ROSTER.map((planet) => ({
  planet,
  byTreatment: Object.fromEntries(TREATMENTS.map((treatment) => {
    const pooled = meanOf(observations.filter((o) => o.planet === planet && o.treatment === treatment));
    const byMap = Object.fromEntries(TREAT_MAPS.map((map) => [map, meanOf(observations.filter(
      (o) => o.planet === planet && o.treatment === treatment && o.map === map,
    ))]));
    return [treatment, { ...pooled, byMap }];
  })),
}));

const out: string[] = [];
out.push(
  `Space Prince economy simulation — roster ${ROSTER.length} (${ROSTER.join(", ")}), ` +
    `${CHARTS} charts, treatments at maps ${TREAT_MAPS.join(",")}, seed ${BASE_SEED}`,
  `Policy: greedy max Light per turn (ties: least own affliction, then roster/verb order); ` +
    `uniform random path; narrative nodes walked away from.`,
  `Runtime: ${elapsed.toFixed(1)}s (${(elapsed / CHARTS).toFixed(2)}s per chart, ` +
    `${observations.length} treated runs)`,
  "",
  "Baseline by map (Light and affliction per combat; affliction is the net rise on the player's",
  "fielded planets across the combat, excluding map-opening Necessity)",
  table(
    ["map", "reached", "lit at open", "combats", "Light/combat", "affliction/combat", "Light/map"],
    baselineRows.map((r) => [
      String(r.map), pct(r.reached), fmt(r.litAtOpen, 2), fmt(r.combats, 2),
      fmt(r.lightPerCombat), fmt(r.afflictionPerCombat), fmt(r.lightPerMap),
    ]),
  ),
  "",
  `Final Light: mean ${fmt(finalStats.mean)}, median ${fmt(finalStats.median)}, ` +
    `p10 ${fmt(finalStats.p10)}, p90 ${fmt(finalStats.p90)}`,
  `Early end (every fielded planet combust): ${pct(earlyEndRate)}` +
    (earlyEndRate > 0
      ? ` — ended on ${earlyEnds.map((n, m) => (n ? `map ${m + 1}: ${pct(n / CHARTS)}` : "")).filter(Boolean).join(", ")}`
      : ""),
  "",
  "Treatments: change in final Light per application (SE clustered by chart).",
  "Eligible = share of chart × planet slots where it applied; Light/pt = per affliction point moved.",
  table(
    ["treatment", "price", "map", "eligible", "n", "ΔLight", "SE", "Light/pt", "SE", "pts moved"],
    treatmentRows.map((r) => [
      r.treatment, r.price === null ? "–" : String(r.price), String(r.map), pct(r.eligible),
      String(r.n), signed(r.dLight), fmt(r.se),
      r.lightPerPoint === null ? "" : signed(r.lightPerPoint, 2),
      r.lightPerPointSe === null ? "" : fmt(r.lightPerPointSe, 2),
      r.meanMoved === null ? "" : fmt(r.meanMoved),
    ]),
  ),
  "",
  `ΔLight by planet, pooled over maps ${TREAT_MAPS.join(",")} (mean ± SE; n in JSON)`,
  table(
    ["planet", ...TREATMENTS],
    planetRows.map((r) => [
      r.planet,
      ...TREATMENTS.map((t) => {
        const cell = r.byTreatment[t]!;
        return cell.n ? `${signed(cell.value, 0)} ± ${fmt(cell.se, 0)}` : "–";
      }),
    ]),
  ),
);
console.log(out.join("\n"));

if (args.json) {
  const json = {
    options: { charts: CHARTS, roster: ROSTER, tier: TIER, maps: TREAT_MAPS, seed: BASE_SEED },
    runtimeSeconds: elapsed,
    baseline: {
      byMap: baselineRows,
      finalLight: finalStats,
      earlyEndRate,
      earlyEndsByMap: earlyEnds.map((n, m) => ({ map: m + 1, share: n / CHARTS })),
    },
    treatments: treatmentRows,
    byPlanet: planetRows,
  };
  writeFileSync(args.json, JSON.stringify(json, null, 2));
}
