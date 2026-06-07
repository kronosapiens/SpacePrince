import type { Polarity, PropagationEntry } from "./types";

/**
 * Distance scores only **resolution** — testimony that actually reduces
 * affliction. Affliction created is the setup and scores nothing; resolving it
 * is the payoff (see MECHANICS §14).
 *
 * `playerDelta` is the opponent's action landing on the player's active planet;
 * `opponentDelta` is the player's action landing on the opponent's. Each counts
 * only when its driving valence is testimony. Propagation is filtered by the
 * polarity that actually landed on each target.
 */
export function turnScore(
  playerDelta: number,
  opponentDelta: number,
  playerValence: Polarity,
  opponentValence: Polarity,
  propagation: PropagationEntry[],
): number {
  const directResolved =
    (opponentValence === "Testimony" ? playerDelta : 0) +
    (playerValence === "Testimony" ? opponentDelta : 0);
  const propagatedResolved = propagation.reduce(
    (s, p) => (p.polarity === "Testimony" ? s + Math.abs(p.delta) : s),
    0,
  );
  return directResolved + propagatedResolved;
}
