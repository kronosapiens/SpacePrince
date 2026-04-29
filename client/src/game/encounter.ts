import { PLANETS } from "./data";
import { blankSideState, seededChart } from "./chart";
import { pickWeighted, mulberry32 } from "./rng";
import { unlockedPlanets } from "./unlocks";
import type {
  CombatEncounter,
  NarrativeEncounter,
  PlanetName,
  RunState,
} from "./types";

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
  const turnCount = playerUnlocked.length;
  const rng = mulberry32(encounterIdSeed ?? opponentSeed);
  const sequence: PlanetName[] = [];
  for (let i = 0; i < turnCount; i++) {
    sequence.push(pickWeighted(PLANETS, rng));
  }
  return {
    kind: "combat",
    id: `enc_combat_${run.id}_${opponentSeed}`,
    opponentChart,
    opponentState: blankSideState(),
    sequence,
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

