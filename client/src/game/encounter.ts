import { blankSideState, seededChart } from "./chart";
import { drawValence, getEffectiveStatsFromPlacement } from "./combat";
import { combustionCeiling } from "./combust";
import { pickWeighted, mulberry32, hashString } from "./rng";
import { unlockedPlanets } from "./unlocks";
import type {
  Chart,
  CombatEncounter,
  NarrativeEncounter,
  PlanetName,
  Polarity,
  Run,
  SideState,
} from "./types";

/** Every encounter resolves in a fixed three turns, regardless of unlock tier
 *  (MECHANICS §11.1). Difficulty ramps through the opponent's roster — it fields
 *  exactly the planets the player has unlocked (Moon v Moon, then 2v2, …) — not
 *  through encounter length. */
export const MAX_COMBAT_TURNS = 3;

export interface BeginCombatInput {
  run: Run;
  opponentSeed: number;
  lifetimeEncounterCount: number;
  devUnlockAll?: boolean;
  encounterIdSeed?: number;
  /** The map's terminal (L7) node — the gate beat: a full seeded pool to
   *  resolve, against a harder opponent. */
  gate?: boolean;
}

/**
 * Map-over-map hardening (the FTL-sectors structure MECHANICS §11 invokes):
 * the opponent's verb draw skews toward Afflict as maps progress. Map 1 is
 * the pure stat weighting; by map 7 the damage weight is nearly doubled. No
 * stat inflation anywhere — opponents stay real charts.
 */
export function mapAggression(mapIdx: number, gate = false): number {
  return 0.15 * Math.min(6, Math.max(0, mapIdx)) + (gate ? 0.3 : 0);
}

/** Roll the opponent's three turns from a roster: a stat-weighted planet per
 *  turn and its precommitted verb. Shared by encounter start and dev
 *  re-mirroring (when the unlock tier changes, the opponent re-fields to match). */
export function rollOpponentTurns(
  opponentChart: Chart,
  roster: PlanetName[],
  rng: () => number,
  aggression = 0,
): { sequence: PlanetName[]; opponentActions: Polarity[] } {
  const sequence: PlanetName[] = [];
  const opponentActions: Polarity[] = [];
  for (let i = 0; i < MAX_COMBAT_TURNS; i++) {
    const planet = pickWeighted(roster, rng);
    sequence.push(planet);
    opponentActions.push(
      drawValence(getEffectiveStatsFromPlacement(opponentChart.planets[planet]), rng, aggression),
    );
  }
  return { sequence, opponentActions };
}

/** The opponent spawns already afflicted (MECHANICS §11): only resolution
 *  scores (§12), so a blank chart gives a 3-turn fight nothing to resolve.
 *  One fielded planet rolls heavy and the rest light, always below ceiling —
 *  no planet spawns combusted. The bands tighten as maps progress (map 1:
 *  heavy 40–65% / light 0–25%; map 7: heavy 25–40% / light 0–10%), so the
 *  free testimony dries up and scoring gets harder late in the run. The L7
 *  gate instead rolls its heavy planet at the top band (55–70%) — each map
 *  ends on a full pool against a harder opponent. */
export function afflictedSideState(
  chart: Chart,
  roster: PlanetName[],
  rng: () => number,
  opts: { mapIdx?: number; gate?: boolean } = {},
): SideState {
  const t = Math.min(6, Math.max(0, opts.mapIdx ?? 0)) / 6;
  const heavyLo = opts.gate ? 0.55 : 0.4 - 0.15 * t;
  const heavySpan = opts.gate ? 0.15 : 0.25 - 0.1 * t;
  const lightHi = 0.25 - 0.15 * t;
  const state = blankSideState();
  const heavyIdx = Math.floor(rng() * roster.length);
  roster.forEach((planet, i) => {
    const ceiling = combustionCeiling(chart.planets[planet]);
    const frac = i === heavyIdx ? heavyLo + rng() * heavySpan : rng() * lightHi;
    state[planet].affliction = Math.round(ceiling * frac);
  });
  return state;
}

export function beginCombatEncounter(input: BeginCombatInput): CombatEncounter {
  const { run, opponentSeed, lifetimeEncounterCount, devUnlockAll, encounterIdSeed, gate } = input;
  const opponentChart = seededChart(opponentSeed, `Adversary ${opponentSeed % 9999}`);
  // Mirrored matchup (MECHANICS §11.1): the opponent fields exactly the planets
  // the player has unlocked — Moon v Moon, then 2v2, up to 7v7. Turn count is a
  // fixed three regardless, so a single planet is simply sent on repeat turns.
  const roster = unlockedPlanets(lifetimeEncounterCount, devUnlockAll);
  const rng = mulberry32(encounterIdSeed ?? opponentSeed);
  const aggression = mapAggression(run.mapsCompleted, gate);
  const { sequence, opponentActions } = rollOpponentTurns(opponentChart, roster, rng, aggression);
  // Separate stream for the spawn affliction so its draws don't perturb the
  // turn-sequence rolls above.
  const stateRng = mulberry32(hashString(`${encounterIdSeed ?? opponentSeed}_affliction`));
  return {
    kind: "combat",
    id: `enc_combat_${run.id}_${opponentSeed}`,
    opponentChart,
    opponentState: afflictedSideState(opponentChart, roster, stateRng, {
      mapIdx: run.mapsCompleted,
      gate,
    }),
    roster,
    sequence,
    opponentActions,
    turnIndex: 0,
    log: [],
    resolved: false,
  };
}

export interface BeginNarrativeInput {
  run: Run;
  house: number;
  treeId: string;
  rootNodeId: string;
  fragmentId: string;
  /** The map node hosting the encounter — part of the deterministic id. */
  nodeId?: string;
}

export function beginNarrativeEncounter(input: BeginNarrativeInput): NarrativeEncounter {
  const { run, house, treeId, rootNodeId, fragmentId, nodeId } = input;
  // Deterministic id (the wager roll seeds on it): map index + node id make it
  // unique within the run without reaching for wall-clock time.
  const site = nodeId ?? rootNodeId;
  return {
    kind: "narrative",
    id: `enc_narr_${run.id}_m${run.mapsCompleted}_${site}_${house}`,
    house,
    treeId,
    currentNodeId: rootNodeId,
    visitedNodeIds: [rootNodeId],
    fragmentId,
    resolved: false,
  };
}

