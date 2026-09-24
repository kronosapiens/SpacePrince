import { PRINCE_CHART_INSET } from "./viewbox";

const wheelRadius = 400 - PRINCE_CHART_INSET;

// Extend into the corners with the same clearance from the frame and wheel.
const spandrelRadius = wheelRadius + PRINCE_CHART_INSET;
export const SPANDREL = {
  left: PRINCE_CHART_INSET,
  right: 800 - PRINCE_CHART_INSET,
  top: PRINCE_CHART_INSET,
  bottom: 500 - Math.sqrt(spandrelRadius ** 2 - wheelRadius ** 2),
  centerX: 400,
  centerY: 500,
  radius: spandrelRadius,
} as const;

const { left, right, top, bottom, radius } = SPANDREL;
export const SPANDREL_PATH = `M ${left} ${top} H ${right} V ${bottom}
  A ${radius} ${radius} 0 0 0 ${left} ${bottom} Z`;

// Precomputed centre-out boundaries for the 16-unit inset, mirrored left/right.
// The common area is solved so 22 rectangles span 384 units, each with its
// lower inner corner on the arc. Placement needs no curve calculations.
export const STAR_RECTANGLES = (() => {
  const area = 2698.8783482696153;
  const edges = [
    0, 32.12950414606685, 63.77213763411504, 94.0570294236742,
    122.4019339542582, 148.5568929553046, 172.5235796735776,
    194.4445999034985, 214.51937392357868, 232.9557673590645,
    249.9473682472838, 265.6652081126704, 280.2565089417151,
    293.8464024413207, 306.5406289698356, 318.42831462984344,
    329.58445742091493, 340.07199470150664, 349.9434188965175,
    359.2419247771066, 368.00203072334295, 376.249493129104, 384,
  ];
  return edges.slice(1).flatMap((edge, index) => {
    const inner = edges[index]!;
    const width = edge - inner;
    const rectangle = { x: SPANDREL.centerX + inner, y: SPANDREL.top, width, height: area / width };
    return [rectangle, { ...rectangle, x: SPANDREL.centerX - edge }];
  });
})();

export const STAR_STYLE = {
  minRadius: 0.75,
  coreRadius: 1,
  minOpacity: 0.1,
  lightScale: 256,
  glow: { core: 0.5, mid: 0.14 },
} as const;

/** Prince artwork units (800 × 1000), separate from the chart's stroke scale. */
export const ACHIEVEMENT_STYLE = {
  scale: 0.55,
  radius: 21,
  stroke: 1.6,
  outlineOpacity: 0.5,
  markOpacity: 0.6,
  emptyOpacity: 0.35,
} as const;

// Hex-packed courses clipped by the wheel: a full bottom row of twelve, then
// four per side in the staggered row above, overhanging the bottom row toward
// the frame, and two per side above that. Columns 58 apart, rows 50; the
// bottom row starts 81 in from the frame corner so the overhang clears it.
// Slots come in four runs of six, one per category: left bottom row, left
// upper courses, then the same on the right, each run ordered from the outer
// end inward and upward.
export const ACHIEVEMENT_SLOTS: readonly (readonly [x: number, y: number])[] = [
  [81, 954], [139, 954], [197, 954], [255, 954], [313, 954], [371, 954],
  [52, 904], [110, 904], [168, 904], [226, 904], [81, 854], [139, 854],
  [719, 954], [661, 954], [603, 954], [545, 954], [487, 954], [429, 954],
  [748, 904], [690, 904], [632, 904], [574, 904], [719, 854], [661, 854],
];

