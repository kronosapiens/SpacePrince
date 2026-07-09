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
  // localStorage stands in for the chain-event indexer (STATE.md): the tail run
  // keeps its event log so map history survives reload; finished runs are inert
  // apart from their scalars, so their logs are stripped.
  const persisted: Prince = {
    ...prince,
    runs: prince.runs.map((r, i) =>
      i === prince.runs.length - 1 ? r : { ...r, events: [] },
    ),
  };
  localStorage.setItem(PRINCE_KEY, JSON.stringify(persisted));
}

export function clearPrince(): void {
  localStorage.removeItem(PRINCE_KEY);
}
