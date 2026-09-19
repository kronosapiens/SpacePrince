/** Prince artwork units (800 × 1000), separate from the chart's stroke scale. */
export const ACHIEVEMENT_STYLE = {
  rows: [
    [0, 7],
    [0, 1, 6, 7],
    [0, 1, 2, 5, 6, 7],
    [0, 1, 2, 3, 4, 5, 6, 7],
  ],
  // Top of each column on the left half, mirrored on the right.
  columnTops: [766, 844, 890, 948],
  columnGap: 92,
  scale: 0.65,
  radius: 21,
  stroke: 1.6,
  outlineOpacity: 0.8,
  markOpacity: 0.9,
} as const;
