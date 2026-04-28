import type { PropagationEntry } from "./types";

export function turnScore(
  playerDelta: number,
  opponentDelta: number,
  propagation: PropagationEntry[],
): number {
  const direct = playerDelta + opponentDelta;
  const propagated = propagation.reduce((s, p) => s + Math.abs(p.delta), 0);
  return direct + propagated;
}
