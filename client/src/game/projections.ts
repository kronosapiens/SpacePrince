import { PLANETS } from "./data";
import { getProjectedPair } from "./combat";
import type {
  AspectConnection,
  Chart,
  PlanetName,
  Polarity,
  SideState,
} from "./types";

export interface ComputeProjectedEffectsInput {
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

const EMPTY: ProjectedEffectsBySide = { self: {}, other: {} };

function flipPolarity(p: Polarity): Polarity {
  return p === "Testimony" ? "Affliction" : "Testimony";
}

function applyMag(
  side: SideState,
  out: Partial<Record<PlanetName, number>>,
  target: PlanetName,
  polarity: Polarity,
  magnitude: number,
) {
  const state = side[target];
  if (!state || state.combusted || magnitude <= 0) return;
  const current = out[target] ?? state.affliction;
  out[target] = polarity === "Testimony" ? Math.max(0, current - magnitude) : current + magnitude;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function toDeltas(
  finalMap: Partial<Record<PlanetName, number>>,
  side: SideState,
): Partial<Record<PlanetName, number>> {
  const out: Partial<Record<PlanetName, number>> = {};
  for (const planet of PLANETS) {
    const final = finalMap[planet];
    if (final === undefined) continue;
    const delta = round2(final - side[planet].affliction);
    if (delta !== 0) out[planet] = delta;
  }
  return out;
}

export function computeProjectedEffects(
  input: ComputeProjectedEffectsInput,
): ProjectedEffectsBySide {
  const {
    playerChart, opponentChart, playerPlanet, opponentPlanet,
    playerState, opponentState, playerAspects, opponentAspects,
  } = input;
  if (playerState[playerPlanet].combusted || opponentState[opponentPlanet].combusted) return EMPTY;

  const projected = getProjectedPair(
    playerChart, opponentChart, playerPlanet, opponentPlanet,
    playerState[playerPlanet].combusted, opponentState[opponentPlanet].combusted,
  );

  const selfFinal: Partial<Record<PlanetName, number>> = {};
  const otherFinal: Partial<Record<PlanetName, number>> = {};

  applyMag(playerState, selfFinal, playerPlanet, projected.polarity, projected.opponentToPlayer);
  applyMag(opponentState, otherFinal, opponentPlanet, projected.polarity, projected.playerToOpponent);

  if (!playerState[playerPlanet].combusted && projected.opponentToPlayer > 0) {
    for (const a of playerAspects) {
      if (a.from !== playerPlanet) continue;
      if (playerState[a.to].combusted) continue;
      const mag = Math.abs(projected.opponentToPlayer * a.multiplier);
      const polarity = a.multiplier < 0 ? flipPolarity(projected.polarity) : projected.polarity;
      applyMag(playerState, selfFinal, a.to, polarity, mag);
    }
  }

  if (!opponentState[opponentPlanet].combusted && projected.playerToOpponent > 0) {
    for (const a of opponentAspects) {
      if (a.from !== opponentPlanet) continue;
      if (opponentState[a.to].combusted) continue;
      const mag = Math.abs(projected.playerToOpponent * a.multiplier);
      const polarity = a.multiplier < 0 ? flipPolarity(projected.polarity) : projected.polarity;
      applyMag(opponentState, otherFinal, a.to, polarity, mag);
    }
  }

  return { self: toDeltas(selfFinal, playerState), other: toDeltas(otherFinal, opponentState) };
}
