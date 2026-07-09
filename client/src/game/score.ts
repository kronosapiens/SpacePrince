import type { Polarity, PropagationEntry } from "./types";

/**
 * Distance scores only **resolution on the opponent's chart** — testimony that
 * actually reduces affliction there, direct or propagated (including a player
 * afflict inverting to testimony across the opponent's squares/oppositions).
 * The player's own chart never scores: personal chart management is survival,
 * opponent chart management is scoring (MECHANICS §12). Phase 2 — the
 * opponent's action on the player's chart — has no score component, so every
 * point of Distance traces to the player's own action.
 */
export function turnScore(
  opponentDelta: number,
  playerValence: Polarity,
  propagation: PropagationEntry[],
): number {
  const directResolved = playerValence === "Testimony" ? opponentDelta : 0;
  const propagatedResolved = propagation.reduce(
    (s, p) => (p.side === "other" && p.polarity === "Testimony" ? s + Math.abs(p.delta) : s),
    0,
  );
  return directResolved + propagatedResolved;
}
