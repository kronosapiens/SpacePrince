import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import { seededChart, blankSideState } from "@/game/chart";
import { newMapState } from "@/game/run";
import { eligibleNext } from "@/game/map-gen";
import { beginCombatEncounter } from "@/game/encounter";
import { rollNodeContent } from "@/game/map-content";
import { mulberry32, hashString } from "@/game/rng";
import { HOUSES } from "@/data/houses";
import { getTree } from "@/data/narrative-trees";
import { pickFragment } from "@/data/chorus";
import type {
  Chart,
  CombatEncounter,
  MapState,
  NarrativeEncounter,
  NodeContent,
  Profile,
  RunState,
} from "@/game/types";

/**
 * Hooks + helpers that synthesize ephemeral state for dev mode. State is
 * keyed on the URL :seed segment (8-char base36 hash). The DevBar's Reroll
 * navigates to the bare path; the route component generates a fresh hash
 * and replace-navigates to /<route>/<hash>.
 */

const SEED_HASH_LEN = 8;

/** Generate a fresh 8-character base36 hash for use as a seed. */
export function generateSeedHash(): string {
  let s = "";
  for (let i = 0; i < SEED_HASH_LEN; i++) {
    s += Math.floor(Math.random() * 36).toString(36);
  }
  return s;
}

/** Convert an 8-char hash back into a numeric seed for the RNG. */
export function seedFromHash(hash: string): number {
  return hashString(hash);
}

/** Pull the `?house=N` query param if present (1..12). */
export function useDevHouseParam(): number | null {
  const location = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    const h = params.get("house");
    if (!h) return null;
    const n = Number(h);
    return Number.isFinite(n) && n >= 1 && n <= 12 ? n : null;
  }, [location.search]);
}

/** A stable session-scoped player chart so reroll only changes the encounter,
 *  not the player. Persisted in sessionStorage so dev mode feels like one Prince. */
const SESSION_PROFILE_KEY = "sp:dev-profile:v1";

export function getOrCreateDevProfile(): Profile {
  try {
    const raw = sessionStorage.getItem(SESSION_PROFILE_KEY);
    if (raw) return JSON.parse(raw) as Profile;
  } catch {}
  const seed = Math.floor(Math.random() * 2 ** 31);
  const chart: Chart = seededChart(seed, "Dev Prince");
  const profile: Profile = {
    id: `dev_${seed}`,
    name: "Dev Prince",
    birthData: { iso: new Date().toISOString(), lat: 0, lon: 0 },
    chart,
    lifetimeEncounterCount: 999,
    scarsLevel: 0,
    createdAt: Date.now(),
    schemaVersion: 1,
  };
  sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function clearDevProfile(): void {
  sessionStorage.removeItem(SESSION_PROFILE_KEY);
}

/** Build an ephemeral run state from a seed. */
export function makeDevRun(seed: number, profile: Profile): RunState {
  return {
    id: `dev_run_${seed}`,
    seed,
    startedAt: Date.now(),
    perPlanetState: blankSideState(),
    runDistance: 0,
    runOmens: [],
    currentMap: makeDevMap(seed),
    mapHistory: [],
    currentEncounter: null,
    seenFragmentIds: [],
    loreCounters: {},
    lifetimeEncounterAtRunStart: profile.lifetimeEncounterCount,
    over: false,
  };
}

/** Build an ephemeral map with deterministic walk progress. From the seed:
 *  - all nodes are pre-rolled (combat / narrative content)
 *  - a partial walk is simulated (forward-only via eligibleNext) so the
 *    diagram has a current position, a visited path, and eligible-next nodes
 *  Re-visiting the same seed always produces the same walk + content.
 */
export function makeDevMap(seed: number): MapState {
  const base = newMapState(seed);

  // Roll content for every node deterministically.
  const rolled: Record<string, NodeContent> = {};
  let lastNarrative: number | null = null;
  for (const node of base.graph.nodes) {
    const rng = mulberry32(hashString(`${seed}_${node.id}`));
    const content = rollNodeContent({ rng, lastNarrativeHouse: lastNarrative });
    rolled[node.id] = content;
    if (content.kind === "narrative") lastNarrative = content.house;
  }

  // Simulate a partial walk. Walk 1..5 layers forward from L1 — never starting
  // at the start node and never reaching the terminal so there's always a
  // visible past, current, and eligible-next.
  const walkRng = mulberry32(hashString(`${seed}_walk`));
  const targetSteps = 1 + Math.floor(walkRng() * 5); // 1..5 forward steps
  const path: string[] = [base.currentNodeId];
  let currentNodeId = base.currentNodeId;
  for (let step = 0; step < targetSteps; step++) {
    const next = eligibleNext(base.graph, currentNodeId);
    if (next.length === 0) break;
    const idx = Math.floor(walkRng() * next.length);
    currentNodeId = next[idx]!;
    path.push(currentNodeId);
  }

  return {
    ...base,
    rolledNodes: rolled,
    visitedNodeIds: path,
    currentNodeId,
  };
}

/** Build an ephemeral combat encounter. */
export function makeDevCombat(seed: number, profile: Profile): CombatEncounter {
  const run = makeDevRun(seed, profile);
  return beginCombatEncounter({
    run,
    opponentSeed: seed,
    lifetimeEncounterCount: profile.lifetimeEncounterCount,
  });
}

/** Build an ephemeral narrative encounter. House defaults to seed-picked
 *  but can be forced via `?house=N`. */
export function makeDevNarrative(
  seed: number,
  forceHouse: number | null,
  seenFragmentIds: string[],
): NarrativeEncounter {
  const house = forceHouse ?? (1 + (Math.abs(seed) % 12));
  const houseDef = HOUSES[house - 1]!;
  const tree = getTree(house);
  const rng = mulberry32(seed);
  const fragment = pickFragment({
    planet: houseDef.ruler,
    mood: tree.fragmentMood,
    exclude: seenFragmentIds,
    rng,
  });
  return {
    kind: "narrative",
    id: `dev_narr_${seed}_${house}`,
    house,
    treeId: `house_${house}_v1`,
    currentNodeId: tree.rootId,
    visitedNodeIds: [tree.rootId],
    fragmentId: fragment?.id ?? `${houseDef.ruler.toLowerCase()}-stub`,
    resolved: false,
  };
}
