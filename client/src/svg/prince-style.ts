import { CHART_SIZE, OUTER_RING_R, PRINCE_CHART_INSET } from "./viewbox";

const chartSize = 800 - 2 * PRINCE_CHART_INSET;
const wheelInset = (800 - chartSize * 2 * OUTER_RING_R / CHART_SIZE) / 2;

/** Match the wheel's side margin above the field and between it and the wheel. */
export const STAR_FIELD_BOUNDS = {
  x: wheelInset,
  y: wheelInset,
  width: 800 - 2 * wheelInset,
  height: 100 - wheelInset,
} as const;

/** Prince artwork units (800 × 1000), separate from the chart's stroke scale. */
export const ACHIEVEMENT_STYLE = {
  columns: 12,
  top: 926,
  gap: 644 / 11,
  scale: 0.65,
  radius: 21,
  stroke: 1.6,
  outlineOpacity: 0.8,
  markOpacity: 0.9,
} as const;
