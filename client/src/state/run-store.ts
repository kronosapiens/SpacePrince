import type { RunState } from "@/game/types";

const RUN_KEY = "sp:run:v1";

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RunState;
  } catch {
    return null;
  }
}

export function saveRun(run: RunState): void {
  localStorage.setItem(RUN_KEY, JSON.stringify(run));
}

export function clearRun(): void {
  localStorage.removeItem(RUN_KEY);
}
