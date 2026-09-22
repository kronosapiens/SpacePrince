/**
 * Legacy doubling scale, unused by current rendering.
 * The live readout is numeric; NFT stars use pseudorandom positions with
 * score-derived radius and opacity (`spec/concept/NFT.md`, The Star-Field).
 */
export interface LightBands {
  /** Doublings completed. The first point on the board earns the first tick. */
  ticks: number;
  /** Progress toward the next tick, 0–1. Zero immediately after earning one. */
  fraction: number;
}

export function lightBands(light: number): LightBands {
  // Guards NaN as well as 0 and negatives — log2(0) is -Infinity.
  if (!(light >= 1)) return { ticks: 0, fraction: 0 };
  const log = Math.log2(light);
  const completed = Math.floor(log);
  return { ticks: completed + 1, fraction: log - completed };
}
