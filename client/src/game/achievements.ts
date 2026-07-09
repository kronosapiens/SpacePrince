import { MAPS_PER_RUN } from "./run";
import { PLANETS } from "./data";
import type { MapGraph, Run } from "./types";

/**
 * Achievements v1 (MECHANICS §11.2 left room; STATE.md reserved the bitmap).
 * Lifetime recognitions, evaluated at run end and OR'd into
 * `Prince.achievements`. Shown as quiet marks — never toasts.
 */

export interface AchievementDef {
  bit: number;
  id: string;
  label: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { bit: 0, id: "full-passage", label: "A full passage — seven maps walked" },
  { bit: 1, id: "sephirot", label: "The canonical tree witnessed" },
  { bit: 2, id: "unscorched", label: "A full passage with every planet lit" },
];

/** The canonical Kabbalistic layer pattern [1,2,2,1,2,1,1] (MAP.md §2). */
export function isCanonicalPattern(graph: MapGraph): boolean {
  const counts = new Array<number>(7).fill(0);
  for (const node of graph.nodes) counts[node.layer - 1] = (counts[node.layer - 1] ?? 0) + 1;
  return [1, 2, 2, 1, 2, 1, 1].every((n, i) => counts[i] === n);
}

/** Bits this finished run earns. OR into the Prince's bitmap (idempotent). */
export function earnedBits(run: Run): number {
  let bits = 0;
  const completed = run.mapsCompleted >= MAPS_PER_RUN;
  if (completed) bits |= 1 << 0;
  const maps = [...run.events.map((e) => e.map), run.map];
  if (maps.some((m) => isCanonicalPattern(m.graph))) bits |= 1 << 1;
  if (completed && PLANETS.every((p) => !run.state[p].combusted)) bits |= 1 << 2;
  return bits;
}

export function unlockedAchievements(bitmap: number): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => (bitmap >> a.bit) & 1);
}
