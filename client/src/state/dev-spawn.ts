import { seededChart } from "@/game/chart";
import { beginRun, newMapState, MAPS_PER_RUN } from "@/game/run";
import { beginCombatEncounter, beginNarrativeEncounter, rollOpponentTurns } from "@/game/encounter";
import { rollNodeContent } from "@/game/map-content";
import { eligibleNext, ROOT_NODE_ID, TERMINAL_NODE_ID } from "@/game/map-gen";
import { mulberry32, hashString, randomSeed } from "@/game/rng";
import { PLANETS } from "@/game/data";
import { unlockedPlanets } from "@/game/unlocks";
import { HOUSES } from "@/data/houses";
import { pickScenario } from "@/data/narrative-trees";
import { pickFragment } from "@/data/chorus";
import type {
  CombatEncounter,
  MapState,
  NodeContent,
  NodeOutcome,
  PlanetName,
  Prince,
  Run,
  SideState,
} from "@/game/types";

/**
 * Dev "spawn" generators. Each builds a *real* `Prince` (with its tail run, and
 * an encounter where relevant) positioned at a target screen, which the caller
 * mints into the store and navigates to. This replaces the old URL-hash dev
 * preview: "Regenerate" is just a fresh real game re-rolled at the same screen.
 *
 * Spawns are deliberately *lived-in*, not pristine: each re-roll randomizes
 * affliction/combustion on the boards, the combat turn, the map position, and
 * the house — so re-rolling actually surfaces different game states. Everything
 * is derived from one `randomSeed()` per spawn, so a given run still replays
 * the same. Dev-build-only (callers gate on `import.meta.env.DEV`) — minting
 * wipes the current local game, which is the intent here.
 */

export type SpawnKind = "map" | "combat" | "narrative" | "end";

export interface SpawnOpts {
  /** Unlock tier (numEncounters); defaults to all seven unlocked for full charts. */
  tier?: number;
  /** Pin a narrative house; null/undefined rolls a random one. */
  house?: number | null;
}

const DEFAULT_TIER = 32; // Saturn unlocks at 32 → all seven planets shown.

/** Spawn the Prince for a screen kind. Every surface lives at /play; the caller
 *  mints it and navigates there, and PlaySurface derives which screen to show. */
export function spawn(kind: SpawnKind, opts: SpawnOpts = {}): Prince {
  switch (kind) {
    case "map": return spawnMap(opts);
    case "combat": return spawnCombat(opts);
    case "narrative": return spawnNarrative(opts);
    case "end": return spawnEnd(opts);
  }
}

export function spawnMap(opts: SpawnOpts = {}): Prince {
  const seed = randomSeed();
  const tier = opts.tier ?? DEFAULT_TIER;
  const fielded = unlockedPlanets(tier);
  const base = beginRun(seed);
  // Park the player partway through a rolled map (never on the terminal).
  const map = walkMap(seed, false);
  const run: Run = {
    ...base,
    state: livedInState(seed, "self", fielded),
    distance: livedInDistance(seed),
    map,
  };
  return devPrince(seed, tier, run);
}

export function spawnCombat(opts: SpawnOpts = {}): Prince {
  const seed = randomSeed();
  const tier = opts.tier ?? DEFAULT_TIER;
  const roster = unlockedPlanets(tier);
  const base = beginRun(seed);
  const fresh = beginCombatEncounter({ run: base, opponentSeed: seed, lifetimeEncounterCount: tier });
  // Mid-fight: a random turn and lived-in boards. Keep the opponent's acting
  // planet alive so the seam reads a real "their turn".
  const turnRng = mulberry32(hashString(`${seed}_turn`));
  const turnIndex = Math.floor(turnRng() * fresh.sequence.length);
  const opponentState = livedInState(seed, "opp", roster);
  const acting = fresh.sequence[turnIndex];
  if (acting) opponentState[acting] = { affliction: opponentState[acting].affliction, combusted: false };
  const encounter: CombatEncounter = { ...fresh, turnIndex, opponentState };
  const run: Run = {
    ...base,
    state: livedInState(seed, "self", roster),
    distance: livedInDistance(seed),
    encounter,
  };
  return devPrince(seed, tier, run);
}

export function spawnNarrative(opts: SpawnOpts = {}): Prince {
  const seed = randomSeed();
  const tier = opts.tier ?? DEFAULT_TIER;
  const fielded = unlockedPlanets(tier);
  const base = beginRun(seed);
  const rng = mulberry32(seed);
  const house = opts.house ?? 1 + Math.floor(rng() * 12);
  const houseDef = HOUSES[house - 1]!;
  const tree = pickScenario(house, [], rng);
  const fragment = pickFragment({ planet: houseDef.ruler, mood: tree.fragmentMood, exclude: [], rng });
  // Narrative encounters always open on the tree root; only the house/board vary.
  const encounter = beginNarrativeEncounter({
    run: base,
    house,
    treeId: tree.scenarioId,
    rootNodeId: tree.rootId,
    fragmentId: fragment?.id ?? `${houseDef.ruler.toLowerCase()}-stub`,
  });
  const run: Run = {
    ...base,
    state: livedInState(seed, "self", fielded),
    distance: livedInDistance(seed),
    encounter,
    seenScenarioIds: [tree.scenarioId],
  };
  return devPrince(seed, tier, run);
}

export function spawnEnd(opts: SpawnOpts = {}): Prince {
  const seed = randomSeed();
  // A valid completed run: six archived maps + a seventh current, each fully
  // walked with synthesized per-node outcomes (so the encounter count is real).
  const events = [];
  for (let i = 0; i < MAPS_PER_RUN - 1; i++) {
    events.push({ kind: "map-completed" as const, map: walkMap(hashString(`${seed}_end_${i}`), true) });
  }
  const finalMap = walkMap(hashString(`${seed}_end_${MAPS_PER_RUN - 1}`), true);
  const distance = [...events.map((e) => e.map), finalMap].reduce(
    (sum, m) => sum + Object.values(m.outcomes).reduce((d, o) => d + o.distanceDelta, 0),
    0,
  );
  const run: Run = {
    id: `dev_run_${seed}`,
    seed,
    state: livedInState(seed, "end"),
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

/** Re-mirror a live combat to a new unlock tier (dev console). Rebuilds the
 *  roster + opponent turns for `tier`, preserving the charts, boards, and the
 *  current turn — so scrubbing the unlock slider keeps the matchup mirrored
 *  (Moon v Moon, 2v2, …) instead of leaving the opponent at the spawn tier. */
export function remirrorCombat(enc: CombatEncounter, tier: number, seed: number): CombatEncounter {
  const roster = unlockedPlanets(tier);
  const rng = mulberry32(hashString(`${seed}_remirror_${tier}`));
  const { sequence, opponentActions } = rollOpponentTurns(enc.opponentChart, roster, rng);
  return {
    ...enc,
    roster,
    sequence,
    opponentActions,
    turnIndex: Math.min(enc.turnIndex, sequence.length - 1),
  };
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

/** Deterministic lived-in per-planet state: varied affliction, occasional
 *  combustion. If `keepAlive` is given, guarantees at least one of those planets
 *  survives — so a spawned run isn't already over (every fielded planet dead). */
function livedInState(seed: number, tag: string, keepAlive?: PlanetName[]): SideState {
  const rng = mulberry32(hashString(`${seed}_${tag}_state`));
  const out = {} as SideState;
  for (const p of PLANETS) {
    const r = rng();
    if (r < 0.5) out[p] = { affliction: 0, combusted: false };
    else if (r < 0.8) out[p] = { affliction: 1 + Math.floor(rng() * 8), combusted: false };
    else if (r < 0.92) out[p] = { affliction: 9 + Math.floor(rng() * 9), combusted: false };
    else out[p] = { affliction: 12 + Math.floor(rng() * 12), combusted: true };
  }
  if (keepAlive?.length && keepAlive.every((p) => out[p].combusted)) {
    out[keepAlive[0]!] = { affliction: 4 + Math.floor(rng() * 6), combusted: false };
  }
  return out;
}

/** A synthetic run distance for a lived-in snapshot. */
function livedInDistance(seed: number): number {
  return 20 + Math.floor(mulberry32(hashString(`${seed}_dist`))() * 130);
}

/** A map with rolled content and a walk from the root. `toTerminal` walks the
 *  whole way (completed map, for the End rainbow); otherwise stops partway so
 *  the player sits at a mid-map node. Visited non-root nodes get a synthesized
 *  outcome (drives the End counts + visited styling). */
function walkMap(seed: number, toTerminal: boolean): MapState {
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
  if (toTerminal) {
    while (cur !== TERMINAL_NODE_ID) {
      const next = eligibleNext(base.graph, cur, path);
      if (next.length === 0) break;
      cur = next[Math.floor(walkRng() * next.length)]!;
      path.push(cur);
    }
  } else {
    const steps = 1 + Math.floor(walkRng() * 4); // 1..4 forward steps
    for (let s = 0; s < steps; s++) {
      const next = eligibleNext(base.graph, cur, path).filter((id) => id !== TERMINAL_NODE_ID);
      if (next.length === 0) break;
      cur = next[Math.floor(walkRng() * next.length)]!;
      path.push(cur);
    }
  }
  const outcomes: Record<string, NodeOutcome> = {};
  const outRng = mulberry32(hashString(`${seed}_outcomes`));
  for (const nodeId of path) {
    if (nodeId === ROOT_NODE_ID || nodeId === cur) continue; // not the node you're on
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
