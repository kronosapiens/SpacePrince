import { PLANETS } from "./data";
import { getProjectedPair } from "./combat";
import type { AspectConnection, Chart, PlanetName, Polarity } from "./types";
import { roundDisplay } from "../lib/format";

type SideState = Record<PlanetName, { affliction: number; combusted: boolean }>;

interface ComputeProjectedEffectsInput {
  playerChart: Chart;
  opponentChart: Chart;
  playerPlanet: PlanetName;
  opponentPlanet: PlanetName;
  playerState: SideState;
  opponentState: SideState;
  playerAspects: AspectConnection[];
  opponentAspects: AspectConnection[];
}

export interface ProjectedEffectsBySide {
  self: Partial<Record<PlanetName, number>>;
  other: Partial<Record<PlanetName, number>>;
}

const EMPTY_PROJECTED_EFFECTS: ProjectedEffectsBySide = {
  self: {},
  other: {},
};

function flipPolarity(polarity: Polarity): Polarity {
  return polarity === "Testimony" ? "Affliction" : "Testimony";
}

function applyProjectedMagnitude(
  sideState: SideState,
  projectedMap: Partial<Record<PlanetName, number>>,
  target: PlanetName,
  polarity: Polarity,
  magnitude: number
) {
  const state = sideState[target];
  if (!state || state.combusted || magnitude <= 0) return;
  const currentAffliction = projectedMap[target] ?? state.affliction;
  projectedMap[target] = polarity === "Testimony" ? Math.max(0, currentAffliction - magnitude) : currentAffliction + magnitude;
}

function toDeltaMap(
  finalMap: Partial<Record<PlanetName, number>>,
  sideState: SideState
): Partial<Record<PlanetName, number>> {
  return PLANETS.reduce<Partial<Record<PlanetName, number>>>((acc, planet) => {
    if (finalMap[planet] === undefined) return acc;
    const delta = roundDisplay(finalMap[planet]! - sideState[planet].affliction);
    if (delta !== 0) acc[planet] = delta;
    return acc;
  }, {});
}

export function computeProjectedEffects(input: ComputeProjectedEffectsInput): ProjectedEffectsBySide {
  const {
    playerChart,
    opponentChart,
    playerPlanet,
    opponentPlanet,
    playerState,
    opponentState,
    playerAspects,
    opponentAspects,
  } = input;

  if (playerState[playerPlanet].combusted || opponentState[opponentPlanet].combusted) {
    return EMPTY_PROJECTED_EFFECTS;
  }

  const projected = getProjectedPair(
    playerChart,
    opponentChart,
    playerPlanet,
    opponentPlanet,
    playerState[playerPlanet].combusted,
    opponentState[opponentPlanet].combusted
  );

  const selfFinal: Partial<Record<PlanetName, number>> = {};
  const otherFinal: Partial<Record<PlanetName, number>> = {};

  applyProjectedMagnitude(playerState, selfFinal, playerPlanet, projected.polarity, projected.opponentToPlayer);
  applyProjectedMagnitude(opponentState, otherFinal, opponentPlanet, projected.polarity, projected.playerToOpponent);

  if (!playerState[playerPlanet].combusted && projected.opponentToPlayer > 0) {
    playerAspects
      .filter((aspect) => aspect.from === playerPlanet)
      .forEach((aspect) => {
        if (playerState[aspect.to].combusted) return;
        const magnitude = Math.abs(projected.opponentToPlayer * aspect.multiplier);
        const effectPolarity = aspect.multiplier < 0 ? flipPolarity(projected.polarity) : projected.polarity;
        applyProjectedMagnitude(playerState, selfFinal, aspect.to, effectPolarity, magnitude);
      });
  }

  if (!opponentState[opponentPlanet].combusted && projected.playerToOpponent > 0) {
    opponentAspects
      .filter((aspect) => aspect.from === opponentPlanet)
      .forEach((aspect) => {
        if (opponentState[aspect.to].combusted) return;
        const magnitude = Math.abs(projected.playerToOpponent * aspect.multiplier);
        const effectPolarity = aspect.multiplier < 0 ? flipPolarity(projected.polarity) : projected.polarity;
        applyProjectedMagnitude(opponentState, otherFinal, aspect.to, effectPolarity, magnitude);
      });
  }

  return {
    self: toDeltaMap(selfFinal, playerState),
    other: toDeltaMap(otherFinal, opponentState),
  };
}
