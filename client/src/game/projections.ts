import { PLANETS } from "./data";
import { propagatedMagnitude } from "./aspects";
import { getProjectedPair } from "./combat";
import { combustionCeiling, isCombusted, wouldCombust } from "./combust";
import type { ScoredBeat } from "./score";
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
  /** Valence the player is choosing (lands on the opponent). */
  playerValence: Polarity;
  /** Valence the opponent precommitted (lands on the player). */
  opponentValence: Polarity;
  playerState: SideState;
  opponentState: SideState;
  playerAspects: AspectConnection[];
  opponentAspects: AspectConnection[];
  /** The fielded planets — one roster serves both charts, since the opponent's
   *  mirrors the player's unlock tier (MECHANICS §11.1). Only these conduct
   *  propagation, as in the resolver (`turn.ts`). */
  roster: PlanetName[];
  /** Model the phase-order preemption (MECHANICS §6): an afflict that combusts
   *  the opponent's actor zeroes its reply. Default true — the exact resolved
   *  future, for the panel and the commit snapshot. Bare hover passes false:
   *  with no verb chosen, the defensive read stays conservative and shows the
   *  blow landing. */
  modelPreemption?: boolean;
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
  /** The same projected turn as scoring beats, in the order `logToBeats` would
   *  produce for the resolved turn — so the previewed Light and the awarded
   *  one are one function (`score.ts` `scoreBeats`). */
  beats: ScoredBeat[];
}

const EMPTY: ProjectedEffectsBySide = { self: {}, other: {}, beats: [] };

function flipPolarity(p: Polarity): Polarity {
  return p === "Testimony" ? "Affliction" : "Testimony";
}

interface InProgress {
  finalValue: number;
  polarity: Polarity;
}

/** Applies one blow and returns the magnitude that actually landed. Bounded on
 *  both sides, as the resolver's `applyEffect` is (MECHANICS §8, §10): testimony
 *  clamps at zero, affliction caps at the ceiling — so a finishing blow projects
 *  only the remainder, and a projected beat pays what the turn will award. */
function applyMag(
  side: SideState,
  chart: Chart,
  out: Partial<Record<PlanetName, InProgress>>,
  target: PlanetName,
  polarity: Polarity,
  magnitude: number,
): number {
  // Callers guard combusted targets (they hold the placements this check needs).
  const state = side[target];
  if (!state || magnitude <= 0) return 0;
  const ceiling = combustionCeiling(chart.planets[target]);
  const existing = out[target];
  const current = existing?.finalValue ?? state.affliction;
  const next =
    polarity === "Testimony"
      ? Math.max(0, current - magnitude)
      : Math.min(ceiling, current + magnitude);
  out[target] = { finalValue: next, polarity };
  return Math.abs(next - current);
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
    playerValence, opponentValence,
    playerState, opponentState, playerAspects, opponentAspects, roster,
    modelPreemption = true,
  } = input;
  if (
    isCombusted(playerChart.planets[playerPlanet], playerState[playerPlanet]) ||
    isCombusted(opponentChart.planets[opponentPlanet], opponentState[opponentPlanet])
  ) return EMPTY;

  // Both actors are live (guarded above), so neither side's stats zero out.
  const projected = getProjectedPair(
    playerChart, opponentChart, playerPlanet, opponentPlanet,
    playerValence, opponentValence,
  );

  const selfFinal: Partial<Record<PlanetName, InProgress>> = {};
  const otherFinal: Partial<Record<PlanetName, InProgress>> = {};
  const beats: ScoredBeat[] = [];

  // A hop that carries its target to the ceiling combusts it, and the combust
  // beat follows its hit — the order `propagate` logs the pair in (`turn.ts`).
  const hopBeats = (
    side: "self" | "other",
    chart: Chart,
    final: Partial<Record<PlanetName, InProgress>>,
    target: PlanetName,
    polarity: Polarity,
    magnitude: number,
  ) => {
    beats.push({ kind: "hit", side, target, polarity, magnitude, channel: "propagated" });
    if ((final[target]?.finalValue ?? 0) >= combustionCeiling(chart.planets[target])) {
      beats.push({ kind: "combust", side, target });
    }
  };

  // Phase 1 — the player's action on the opponent's chart. Combustion resolves
  // before propagation (MECHANICS §9): a blow that combusts the actor it lands
  // on conducts nothing onward through that actor's web.
  const preempts =
    playerValence === "Affliction" &&
    wouldCombust(
      opponentChart.planets[opponentPlanet],
      opponentState[opponentPlanet],
      projected.playerToOpponent,
    );
  const direct = applyMag(
    opponentState, opponentChart, otherFinal,
    opponentPlanet, playerValence, projected.playerToOpponent,
  );
  beats.push({
    kind: "hit", side: "other", target: opponentPlanet,
    polarity: playerValence, magnitude: direct, channel: "direct",
  });
  if (!preempts && projected.playerToOpponent > 0) {
    for (const a of opponentAspects) {
      if (a.from !== opponentPlanet) continue;
      if (!roster.includes(a.to)) continue;
      if (isCombusted(opponentChart.planets[a.to], opponentState[a.to])) continue;
      const mag = propagatedMagnitude(projected.playerToOpponent, a);
      if (mag <= 0) continue;
      const polarity = a.num < 0 ? flipPolarity(playerValence) : playerValence;
      const applied = applyMag(opponentState, opponentChart, otherFinal, a.to, polarity, mag);
      hopBeats("other", opponentChart, otherFinal, a.to, polarity, applied);
    }
  }
  // The actor's own ripple plays after the hops, as the resolver logs it.
  if (preempts) beats.push({ kind: "combust", side: "other", target: opponentPlanet });

  // Phase 2 — the opponent's reply on the player's chart, read after phase 1
  // (MECHANICS §6): combusting the opponent's actor preempts it entirely.
  // The same §9 short-circuit applies on this side — a catcher combusted by
  // the blow spares its neighbours the ripple.
  const incoming = modelPreemption && preempts ? 0 : projected.opponentToPlayer;
  const caught = applyMag(
    playerState, playerChart, selfFinal, playerPlanet, opponentValence, incoming,
  );
  beats.push({
    kind: "hit", side: "self", target: playerPlanet,
    polarity: opponentValence, magnitude: caught, channel: "direct",
  });
  const catcherCombusts =
    opponentValence === "Affliction" &&
    wouldCombust(playerChart.planets[playerPlanet], playerState[playerPlanet], incoming);
  if (incoming > 0 && !catcherCombusts) {
    for (const a of playerAspects) {
      if (a.from !== playerPlanet) continue;
      if (!roster.includes(a.to)) continue;
      if (isCombusted(playerChart.planets[a.to], playerState[a.to])) continue;
      const mag = propagatedMagnitude(incoming, a);
      if (mag <= 0) continue;
      const polarity = a.num < 0 ? flipPolarity(opponentValence) : opponentValence;
      const applied = applyMag(playerState, playerChart, selfFinal, a.to, polarity, mag);
      hopBeats("self", playerChart, selfFinal, a.to, polarity, applied);
    }
  }
  if (catcherCombusts) beats.push({ kind: "combust", side: "self", target: playerPlanet });

  return {
    self: toEffects(selfFinal, playerState),
    other: toEffects(otherFinal, opponentState),
    beats,
  };
}
