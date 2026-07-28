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

/** Combat length is the map number (MECHANICS §11.1): 1 turn on map 1, up to 7
 *  on map 7. Difficulty ramps on two axes — roster via the unlock mirror,
 *  length via the run's progress. */
export function combatTurnCount(mapsCompleted: number): number {
  return mapsCompleted + 1;
}

export interface BeginCombatInput {
  run: Run;
  opponentSeed: number;
  lifetimeEncounterCount: number;
  devUnlockAll?: boolean;
  encounterIdSeed?: number;
}

/** Roll the opponent's turns from a roster: a stat-weighted planet per
 *  turn and its precommitted verb. Shared by encounter start and dev
 *  re-mirroring (when the unlock tier changes, the opponent re-fields to match). */
export function rollOpponentTurns(
  opponentChart: Chart,
  roster: PlanetName[],
  rng: () => number,
  turns: number,
): { sequence: PlanetName[]; opponentActions: Polarity[] } {
  const sequence: PlanetName[] = [];
  const opponentActions: Polarity[] = [];
  for (let i = 0; i < turns; i++) {
    const planet = pickWeighted(roster, rng);
    sequence.push(planet);
    opponentActions.push(
      drawValence(getEffectiveStatsFromPlacement(opponentChart.planets[planet]), rng),
    );
  }
  return { sequence, opponentActions };
}

/** The opponent spawns already afflicted (MECHANICS §11): only resolution
 *  scores (§12), so a blank chart gives a short fight nothing to resolve.
 *  Each fielded planet rolls uniformly across its range — an integer from 0
 *  to ceiling − 1, so no planet spawns combusted. */
export function afflictedSideState(
  chart: Chart,
  roster: PlanetName[],
  rng: () => number,
): SideState {
  const state = blankSideState();
  for (const planet of roster) {
    const ceiling = combustionCeiling(chart.planets[planet]);
    state[planet].affliction = Math.floor(rng() * ceiling);
  }
  return state;
}

export function beginCombatEncounter(input: BeginCombatInput): CombatEncounter {
  const { run, opponentSeed, lifetimeEncounterCount, devUnlockAll, encounterIdSeed } = input;
  // Player-facing name: the self/other axis, never adversary (SCREENS.md).
  const opponentChart = seededChart(opponentSeed, `Other ${opponentSeed % 9999}`);
  // Mirrored matchup (MECHANICS §11.1): the opponent fields exactly the planets
  // the player has unlocked — Moon v Moon, then 2v2, up to 7v7. Turn count is
  // the map number, so a single planet may simply be sent on repeat turns.
  const roster = unlockedPlanets(lifetimeEncounterCount, devUnlockAll);
  const rng = mulberry32(encounterIdSeed ?? opponentSeed);
  const { sequence, opponentActions } = rollOpponentTurns(
    opponentChart, roster, rng, combatTurnCount(run.mapsCompleted),
  );
  // Separate stream for the spawn affliction so its draws don't perturb the
  // turn-sequence rolls above.
  const stateRng = mulberry32(hashString(`${encounterIdSeed ?? opponentSeed}_affliction`));
  return {
    kind: "combat",
    id: `enc_combat_${run.id}_${opponentSeed}`,
    opponentChart,
    opponentState: afflictedSideState(opponentChart, roster, stateRng),
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

