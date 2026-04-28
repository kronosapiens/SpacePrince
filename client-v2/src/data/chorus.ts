import { loadFragments, type Fragment } from "./planets-yaml";
import type { PlanetName } from "@/game/types";

export type Mood =
  | "opening"
  | "declaration"
  | "paradox"
  | "warning"
  | "cut"
  | "longing"
  | "stillness"
  | "labor"
  | "concealment";

export interface PickFragmentOptions {
  planet: PlanetName;
  mood?: Mood;
  exclude?: ReadonlyArray<string>;
  rng?: () => number;
}

/**
 * Picks a chorus fragment for the given planet, biased to the requested mood when present.
 * Excludes ids in `exclude` (used for the run's seenFragmentIds set).
 */
export function pickFragment(opts: PickFragmentOptions): Fragment | null {
  const all = loadFragments()[opts.planet] ?? [];
  if (all.length === 0) return null;
  const rng = opts.rng ?? Math.random;
  const exclude = new Set(opts.exclude ?? []);

  const available = all.filter((f) => !exclude.has(f.id));
  const candidates = opts.mood
    ? available.filter((f) => f.moods.includes(opts.mood!))
    : available;
  const pool = candidates.length > 0 ? candidates : available.length > 0 ? available : all;
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)] ?? null;
}

export function getFragmentById(id: string): Fragment | null {
  const all = loadFragments();
  for (const planet of Object.keys(all) as PlanetName[]) {
    const f = all[planet]!.find((x) => x.id === id);
    if (f) return f;
  }
  return null;
}
