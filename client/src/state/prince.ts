import type { Chart, Prince, SideState } from "@/game/types";
import { refreshChartStats, runChart } from "@/game/chart";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
import { PLANETS } from "@/game/data";

// v7: per-planet state stores `tension`.
const PRINCE_KEY = "sp:prince:v7";
// Obsolete prototype shapes; cleared on first load (no migration).
const LEGACY_KEYS = ["sp:profile:v1", "sp:run:v1", "sp:prince:v1", "sp:prince:v2", "sp:prince:v3", "sp:prince:v4", "sp:prince:v5", "sp:prince:v6"];

function capSavedTension(chart: Chart, state: SideState): void {
  for (const planet of PLANETS) {
    state[planet].tension = Math.min(state[planet].tension, getEffectiveStatsFromPlacement(chart.planets[planet]).resolve);
  }
}

export function loadPrince(): Prince | null {
  try {
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    const raw = localStorage.getItem(PRINCE_KEY);
    if (!raw) return null;
    const prince = JSON.parse(raw) as Prince;
    refreshChartStats(prince.chart);
    for (const run of prince.runs) {
      capSavedTension(runChart(prince.chart, run), run.state);
      if (run.encounter?.kind === "relational") {
        refreshChartStats(run.encounter.opponentChart);
        capSavedTension(run.encounter.opponentChart, run.encounter.opponentState);
      }
    }
    return prince;
  } catch {
    return null;
  }
}

export function savePrince(prince: Prince): void {
  // The run event log is in-memory only (STATE.md) — strip it from the persisted
  // copy so reloads start with an empty log.
  const persisted: Prince = {
    ...prince,
    runs: prince.runs.map((r) => ({ ...r, events: [] })),
  };
  localStorage.setItem(PRINCE_KEY, JSON.stringify(persisted));
}

export function clearPrince(): void {
  localStorage.removeItem(PRINCE_KEY);
}
