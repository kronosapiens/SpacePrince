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

/** Per-planet projection: the polarity (so the badge can be colored even
 *  when the numeric delta clamps to zero — e.g. testimony on a planet
 *  already at 0 affliction) and the actual delta after clamping. */
export interface ProjectedEffect {
  delta: number;
  polarity: Polarity;
}

export interface ProjectedEffectsBySide {
  self: Partial<Record<PlanetName, ProjectedEffect>>;
  other: Partial<Record<PlanetName, ProjectedEffect>>;
}

const EMPTY: ProjectedEffectsBySide = { self: {}, other: {} };

function flipPolarity(p: Polarity): Polarity {
  return p === "Testimony" ? "Affliction" : "Testimony";
}

interface InProgress {
  finalValue: number;
  polarity: Polarity;
}

function applyMag(
  side: SideState,
  out: Partial<Record<PlanetName, InProgress>>,
  target: PlanetName,
  polarity: Polarity,
  magnitude: number,
) {
  const state = side[target];
  if (!state || state.combusted || magnitude <= 0) return;
  const existing = out[target];
  const current = existing?.finalValue ?? state.affliction;
  const next =
    polarity === "Testimony" ? Math.max(0, current - magnitude) : current + magnitude;
  out[target] = { finalValue: next, polarity };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function toEffects(
  finalMap: Partial<Record<PlanetName, InProgress>>,
  side: SideState,
): Partial<Record<PlanetName, ProjectedEffect>> {
  const out: Partial<Record<PlanetName, ProjectedEffect>> = {};
  for (const planet of PLANETS) {
    const entry = finalMap[planet];
    if (!entry) continue;
    const delta = round2(entry.finalValue - side[planet].affliction);
    // Drop friction with zero delta as visual noise. Keep zero-delta
    // testimony so the player sees the heal-intent even when the planet
    // is already at zero affliction (otherwise they'd wonder if their
    // mental model of propagation was wrong).
    if (delta === 0 && entry.polarity !== "Testimony") continue;
    out[planet] = { delta, polarity: entry.polarity };
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

  const selfFinal: Partial<Record<PlanetName, InProgress>> = {};
  const otherFinal: Partial<Record<PlanetName, InProgress>> = {};

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

  return { self: toEffects(selfFinal, playerState), other: toEffects(otherFinal, opponentState) };
}
