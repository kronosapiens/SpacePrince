import { chartRuler, seededChart } from "./chart";
import { applyOtherNecessity } from "./necessity";
import { drawOpponentMove } from "./opponent-move";
import { opponentSeedForRuler, seedRuler } from "./map-content";
import { mulberry32, hashString } from "./rng";
import { unlockedPlanets } from "./unlocks";
import type {
  Chart,
  RelationalEncounter,
  NarrativeEncounter,
  PlanetName,
  Polarity,
  Run,
  SideState,
} from "./types";

/** The encounter's ruler — the planet ruling the opponent chart's Ascendant,
 *  which is the ruler the node's seed gave for the planets unlocked at entry
 *  (`seedRuler`). One planet drives three surfaces: the node's colour on the
 *  map, the relational theme, and the encounter's scoring rule (`score.ts`
 *  `RULER_RULES`). */
export function encounterRuler(enc: RelationalEncounter): PlanetName {
  return chartRuler(enc.opponentChart);
}

/** Relational encounter length is the map number (MECHANICS §11.1): 1 turn on map 1, up to 7
 *  on map 7. Difficulty ramps on two axes — roster via the unlock mirror,
 *  length via the run's progress. */
export function relationalTurnCount(mapsCompleted: number): number {
  return mapsCompleted + 1;
}

export interface BeginRelationalInput {
  run: Run;
  opponentSeed: number;
  lifetimeRelationalEncounterCount: number;
  devUnlockAll?: boolean;
  encounterIdSeed?: number;
}

/** Roll the opponent's turns from a roster: one move per turn, each drawn by
 *  its ruler's rule (`drawOpponentMove`) from `opponentState` as it stands.
 *  Resolving a turn redraws the next, so only the current turn's move is ever
 *  played. Shared by encounter start and dev re-mirroring (when the unlock
 *  tier changes, the opponent re-fields to match). */
export function rollOpponentTurns(
  opponentChart: Chart,
  opponentState: SideState,
  roster: PlanetName[],
  rng: () => number,
  turns: number,
): { sequence: PlanetName[]; opponentActions: Polarity[] } {
  const ruler = chartRuler(opponentChart);
  const sequence: PlanetName[] = [];
  const opponentActions: Polarity[] = [];
  for (let i = 0; i < turns; i++) {
    const { planet, action } = drawOpponentMove(opponentChart, opponentState, roster, ruler, rng);
    sequence.push(planet);
    opponentActions.push(action);
  }
  return { sequence, opponentActions };
}

export function beginRelationalEncounter(input: BeginRelationalInput): RelationalEncounter {
  const { run, opponentSeed, lifetimeRelationalEncounterCount, devUnlockAll, encounterIdSeed } = input;
  const roster = unlockedPlanets(lifetimeRelationalEncounterCount, devUnlockAll);
  // The node's seed names the ruler among the planets unlocked now; the Other
  // is then a chart whose Ascendant that planet rules.
  const acceptedSeed = opponentSeedForRuler(opponentSeed, seedRuler(opponentSeed, roster));
  // Player-facing name: the self/other axis, never adversary (SCREENS.md).
  const opponentChart = seededChart(acceptedSeed, `Other ${acceptedSeed % 9999}`);
  // Separate stream for the necessity so its rolls don't perturb the
  // turn-sequence rolls below. It lands first: the opening move reads the
  // tension the opponent arrives with.
  const stateRng = mulberry32(hashString(`${encounterIdSeed ?? acceptedSeed}_tension`));
  const opening = applyOtherNecessity(opponentChart, roster, stateRng);
  // Mirrored matchup (MECHANICS §11.1): the opponent fields exactly the planets
  // the player has unlocked — Moon v Moon, then 2v2, up to 7v7. Turn count is
  // the map number, so a single planet may simply be sent on repeat turns.
  const rng = mulberry32(encounterIdSeed ?? acceptedSeed);
  const { sequence, opponentActions } = rollOpponentTurns(
    opponentChart, opening.state, roster, rng, relationalTurnCount(run.mapsCompleted),
  );
  return {
    kind: "relational",
    // The ID feeds turn RNG; retain its original salt to preserve seeded outcomes.
    id: `enc_combat_${run.id}_${acceptedSeed}`,
    opponentChart,
    opponentState: opening.state,
    necessity: opening.necessity,
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
  scenarioId: string;
}

export function beginNarrativeEncounter(input: BeginNarrativeInput): NarrativeEncounter {
  const { run, house, scenarioId } = input;
  return {
    kind: "narrative",
    id: `enc_narr_${run.id}_${house}_${Date.now()}`,
    house,
    scenarioId,
    resolved: false,
  };
}
