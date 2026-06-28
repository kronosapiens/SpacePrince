import { blankSideState, seededChart } from "./chart";
import { drawValence, getEffectiveStatsFromPlacement } from "./combat";
import { pickWeighted, mulberry32 } from "./rng";
import { unlockedPlanets } from "./unlocks";
import type {
  CombatEncounter,
  NarrativeEncounter,
  PlanetName,
  Polarity,
  RunState,
} from "./types";

/** Every encounter resolves in a fixed three turns, regardless of unlock tier
 *  (MECHANICS §11.1). Difficulty ramps through the opponent's roster — it fields
 *  exactly the planets the player has unlocked (Moon v Moon, then 2v2, …) — not
 *  through encounter length. */
export const MAX_COMBAT_TURNS = 3;

export interface BeginCombatInput {
  run: RunState;
  opponentSeed: number;
  lifetimeEncounterCount: number;
  devUnlockAll?: boolean;
  encounterIdSeed?: number;
}

export function beginCombatEncounter(input: BeginCombatInput): CombatEncounter {
  const { run, opponentSeed, lifetimeEncounterCount, devUnlockAll, encounterIdSeed } = input;
  const opponentChart = seededChart(opponentSeed, `Adversary ${opponentSeed % 9999}`);
  // Mirrored matchup (MECHANICS §11.1): the opponent fields exactly the planets
  // the player has unlocked — Moon v Moon, then 2v2, up to 7v7. Turn count is a
  // fixed three regardless, so a single planet is simply sent on repeat turns.
  const roster = unlockedPlanets(lifetimeEncounterCount, devUnlockAll);
  const rng = mulberry32(encounterIdSeed ?? opponentSeed);
  const sequence: PlanetName[] = [];
  const opponentActions: Polarity[] = [];
  for (let i = 0; i < MAX_COMBAT_TURNS; i++) {
    const planet = pickWeighted(roster, rng);
    sequence.push(planet);
    opponentActions.push(
      drawValence(getEffectiveStatsFromPlacement(opponentChart.planets[planet]), rng),
    );
  }
  return {
    kind: "combat",
    id: `enc_combat_${run.id}_${opponentSeed}`,
    opponentChart,
    opponentState: blankSideState(),
    roster,
    sequence,
    opponentActions,
    turnIndex: 0,
    log: [],
    resolved: false,
  };
}

export interface BeginNarrativeInput {
  run: RunState;
  house: number;
  treeId: string;
  rootNodeId: string;
  fragmentId: string;
}

export function beginNarrativeEncounter(input: BeginNarrativeInput): NarrativeEncounter {
  const { run, house, treeId, rootNodeId, fragmentId } = input;
  return {
    kind: "narrative",
    id: `enc_narr_${run.id}_${house}_${Date.now()}`,
    house,
    treeId,
    currentNodeId: rootNodeId,
    visitedNodeIds: [rootNodeId],
    fragmentId,
    resolved: false,
  };
}

