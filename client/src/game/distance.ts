/**
 * Distance as doublings (`spec/concept/NFT.md`, Star-Field placement).
 *
 * Distance is an unbounded sum with no ceiling anywhere in the design, so it
 * can't be drawn as a fraction of anything without inventing one. Reading it
 * logarithmically gives it shape without a denominator: a tick per doubling
 * completed, and how far into the next one the score currently sits.
 *
 * Base 2 rather than 10 because it is already the game's own base — the
 * Macrobian unlock schedule is `2^i` (MECHANICS.md §11.1) — and because base 10
 * yields only two or three bands across a realistic score range where base 2
 * yields six. The same value places the run's star in the NFT field, so the
 * readout during a run and the mark it leaves are one idea.
 */
export interface DistanceBands {
  /** Doublings completed. The first point on the board earns the first tick. */
  ticks: number;
  /** Progress toward the next tick, 0–1. Zero immediately after earning one. */
  fraction: number;
}

export function distanceBands(distance: number): DistanceBands {
  // Guards NaN as well as 0 and negatives — log2(0) is -Infinity.
  if (!(distance >= 1)) return { ticks: 0, fraction: 0 };
  const log = Math.log2(distance);
  const completed = Math.floor(log);
  return { ticks: completed + 1, fraction: log - completed };
}
