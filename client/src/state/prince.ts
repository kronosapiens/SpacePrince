import type { Prince } from "@/game/types";

const PRINCE_KEY = "sp:prince:v1";
// Pre-STATE.md keys; cleared on first load (no migration — local prototype).
const LEGACY_KEYS = ["sp:profile:v1", "sp:run:v1"];

export function loadPrince(): Prince | null {
  try {
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    const raw = localStorage.getItem(PRINCE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Prince;
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
