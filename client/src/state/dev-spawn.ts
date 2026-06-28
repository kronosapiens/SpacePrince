import { seededChart } from "@/game/chart";
import { beginRun, newMapState, MAPS_PER_RUN } from "@/game/run";
import { beginCombatEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { rollNodeContent } from "@/game/map-content";
import { eligibleNext, ROOT_NODE_ID, TERMINAL_NODE_ID } from "@/game/map-gen";
import { mulberry32, hashString, randomSeed } from "@/game/rng";
import { PLANETS } from "@/game/data";
import { HOUSES } from "@/data/houses";
import { pickScenario } from "@/data/narrative-trees";
import { pickFragment } from "@/data/chorus";
import { ROUTES } from "@/routes";
import type { MapState, NodeContent, NodeOutcome, Prince, Run, SideState } from "@/game/types";

/**
 * Dev "spawn" generators. Each builds a *real* `Prince` (with its tail run, and
 * an encounter where relevant) positioned at a target screen, which the caller
 * mints into the store and navigates to. This replaces the old URL-hash dev
 * preview: "Regenerate" is just a fresh real game re-rolled at the same screen.
 * Dev-build-only (callers gate on `import.meta.env.DEV`) — minting wipes the
 * current local game, which is the intent here.
 */

export type SpawnKind = "map" | "combat" | "narrative" | "end";

export interface SpawnOpts {
  /** Unlock tier (numEncounters); defaults to all seven unlocked for full charts. */
  tier?: number;
  /** Pin a narrative house; null/undefined rolls a random one. */
  house?: number | null;
}

const DEFAULT_TIER = 32; // Saturn unlocks at 32 → all seven planets shown.

/** Spawn the right Prince for a screen kind and the route to land on. */
export function spawn(kind: SpawnKind, opts: SpawnOpts = {}): { prince: Prince; route: string } {
  switch (kind) {
    case "map": return { prince: spawnMap(opts), route: ROUTES.map };
    case "combat": return { prince: spawnCombat(opts), route: ROUTES.encounter };
    case "narrative": return { prince: spawnNarrative(opts), route: ROUTES.encounter };
    case "end": return { prince: spawnEnd(opts), route: ROUTES.end };
  }
}

export function spawnMap(opts: SpawnOpts = {}): Prince {
  const seed = randomSeed();
  return devPrince(seed, opts.tier, beginRun(seed));
}

export function spawnCombat(opts: SpawnOpts = {}): Prince {
  const seed = randomSeed();
  const tier = opts.tier ?? DEFAULT_TIER;
  const base = beginRun(seed);
  const encounter = beginCombatEncounter({
    run: base,
    opponentSeed: seed,
    lifetimeEncounterCount: tier,
  });
  return devPrince(seed, tier, { ...base, encounter });
}

export function spawnNarrative(opts: SpawnOpts = {}): Prince {
  const seed = randomSeed();
  const base = beginRun(seed);
  const rng = mulberry32(seed);
  const house = opts.house ?? 1 + Math.floor(rng() * 12);
  const houseDef = HOUSES[house - 1]!;
  const tree = pickScenario(house, [], rng);
  const fragment = pickFragment({ planet: houseDef.ruler, mood: tree.fragmentMood, exclude: [], rng });
  const encounter = beginNarrativeEncounter({
    run: base,
    house,
    treeId: tree.scenarioId,
    rootNodeId: tree.rootId,
    fragmentId: fragment?.id ?? `${houseDef.ruler.toLowerCase()}-stub`,
  });
  return devPrince(seed, opts.tier, { ...base, encounter, seenScenarioIds: [tree.scenarioId] });
}

export function spawnEnd(opts: SpawnOpts = {}): Prince {
  const seed = randomSeed();
  // A valid completed run: six archived maps + a seventh current, each fully
  // walked with synthesized per-node outcomes (so the encounter count is real).
  const events = [];
  for (let i = 0; i < MAPS_PER_RUN - 1; i++) {
    events.push({ kind: "map-completed" as const, map: walkedMap(hashString(`${seed}_end_${i}`)) });
  }
  const finalMap = walkedMap(hashString(`${seed}_end_${MAPS_PER_RUN - 1}`));
  const distance = [...events.map((e) => e.map), finalMap].reduce(
    (sum, m) => sum + Object.values(m.outcomes).reduce((d, o) => d + o.distanceDelta, 0),
    0,
  );
  const run: Run = {
    id: `dev_run_${seed}`,
    seed,
    state: syntheticSideState(seed),
    distance,
    map: finalMap,
    mapsCompleted: MAPS_PER_RUN,
    encounter: null,
    seenFragmentIds: [],
    seenScenarioIds: [],
    events,
  };
  return devPrince(seed, opts.tier, run);
}

// ── internals ───────────────────────────────────────────────────────────────

function devPrince(seed: number, tier = DEFAULT_TIER, run: Run): Prince {
  return {
    id: `dev_${seed}`,
    position: { iso: "1970-01-01T00:00:00.000Z", lat: 0, lon: 0 },
    chart: seededChart(hashString(`${seed}_player`), "Dev Prince"),
    numEncounters: tier,
    achievements: 0,
    runs: [run],
  };
}

/** A map walked ROOT→TERMINAL with rolled content + a synthesized outcome per
 *  visited (non-root) node, for the End-of-Run rainbow. */
function walkedMap(seed: number): MapState {
  const base = newMapState(seed);
  const rolled: Record<string, NodeContent> = {};
  let lastNarrative: number | null = null;
  for (const node of base.graph.nodes) {
    const r = mulberry32(hashString(`${seed}_${node.id}`));
    const content = rollNodeContent({ rng: r, lastNarrativeHouse: lastNarrative });
    rolled[node.id] = content;
    if (content.kind === "narrative") lastNarrative = content.house;
  }
  const walkRng = mulberry32(hashString(`${seed}_walk`));
  const path: string[] = [base.currentNodeId];
  let cur = base.currentNodeId;
  while (cur !== TERMINAL_NODE_ID) {
    const next = eligibleNext(base.graph, cur, path);
    if (next.length === 0) break;
    cur = next[Math.floor(walkRng() * next.length)]!;
    path.push(cur);
  }
  const outcomes: Record<string, NodeOutcome> = {};
  const outRng = mulberry32(hashString(`${seed}_outcomes`));
  for (const nodeId of path) {
    if (nodeId === ROOT_NODE_ID) continue;
    const content = rolled[nodeId];
    if (!content) continue;
    outcomes[nodeId] = {
      nodeId,
      kind: content.kind,
      summary: content.kind === "combat" ? "Combat" : `House ${content.house}`,
      distanceDelta: 6 + Math.floor(outRng() * 10),
      combusts: [],
    };
  }
  return { ...base, rolledNodes: rolled, visitedNodeIds: path, currentNodeId: cur, outcomes };
}

/** Deterministic lived-in per-planet state for the End screen anchor. */
function syntheticSideState(seed: number): SideState {
  const rng = mulberry32(hashString(`${seed}_state`));
  const out = {} as SideState;
  for (const planet of PLANETS) {
    const r = rng();
    if (r < 0.6) out[planet] = { affliction: 0, combusted: false };
    else if (r < 0.9) out[planet] = { affliction: 1 + Math.floor(rng() * 8), combusted: false };
    else out[planet] = { affliction: 12 + Math.floor(rng() * 10), combusted: true };
  }
  return out;
}
