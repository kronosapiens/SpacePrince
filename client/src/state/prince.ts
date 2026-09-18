import type { Chart, Prince, SideState } from "@/game/types";
import { refreshChartStats } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { PLANETS } from "@/game/data";

// v4: narrative encounters hold a single decision, with no tree traversal.
const PRINCE_KEY = "sp:prince:v4";
// Obsolete prototype shapes; cleared on first load (no migration).
const LEGACY_KEYS = ["sp:profile:v1", "sp:run:v1", "sp:prince:v1", "sp:prince:v2", "sp:prince:v3"];

function capSavedAffliction(chart: Chart, state: SideState): void {
  for (const planet of PLANETS) {
    state[planet].affliction = Math.min(state[planet].affliction, combustionCeiling(chart.planets[planet]));
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
      capSavedAffliction(prince.chart, run.state);
      if (run.encounter?.kind === "combat") {
        refreshChartStats(run.encounter.opponentChart);
        capSavedAffliction(run.encounter.opponentChart, run.encounter.opponentState);
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
