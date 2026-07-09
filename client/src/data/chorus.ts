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
  /** Required: every pick is seeded — no ambient randomness (determinism rule). */
  rng: () => number;
}

/**
 * Picks a chorus fragment for the given planet, biased to the requested mood when present.
 * Excludes ids in `exclude` (used for the run's seenFragmentIds set).
 */
export function pickFragment(opts: PickFragmentOptions): Fragment | null {
  const all = loadFragments()[opts.planet] ?? [];
  if (all.length === 0) return null;
  const rng = opts.rng;
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

/**
 * Work title for display in an aria attribution — author + title, no page /
 * chapter / verse locator (the full citation stays in `source`). Derived from
 * `source` unless the fragment carries an explicit `title` (incl. "" to show
 * the author alone). Validated against the whole corpus by chorus.test.ts.
 */
export function fragmentTitle(f: Pick<Fragment, "title" | "source">): string {
  if (f.title !== undefined) return f.title;
  if (!f.source) return "";
  let s = f.source.trim();
  if (/^Fragments?\b/.test(s)) return "Fragments"; // Heraclitus, Sappho — numbered collections
  s = s.replace(/\s*\([^()]*\)\s*$/, "").trim();    // drop a trailing parenthetical note
  s = s.split(",")[0]!.trim();                        // keep the work title, drop the locator
  s = s.replace(/\s+\d+:\d+(?:[–-]\d+)?$/, "").trim(); // drop a trailing scripture verse
  return s;
}
