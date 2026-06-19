import { PLANETS } from "./data";
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

/** Combat resolves in a fixed three turns, with an early-game ramp: a player
 *  can never send more distinct planets than they have unlocked, so the
 *  earliest encounters are shorter — `turns = min(3, unlocked)` (MECHANICS
 *  §11.1). Past three unlocked planets the cap stops biting, making *which
 *  three you send* the choice rather than a roll-call of the whole chart. */
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
  const playerUnlocked = unlockedPlanets(lifetimeEncounterCount, devUnlockAll);
  const turnCount = Math.min(MAX_COMBAT_TURNS, playerUnlocked.length);
  const rng = mulberry32(encounterIdSeed ?? opponentSeed);
  const sequence: PlanetName[] = [];
  const opponentActions: Polarity[] = [];
  for (let i = 0; i < turnCount; i++) {
    const planet = pickWeighted(PLANETS, rng);
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

