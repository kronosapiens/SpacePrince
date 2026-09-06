import { PLANETS } from "@/game/data";
import type { PlanetName } from "@/game/types";
import { CHART_SIZE } from "@/svg/viewbox";
import {
  center,
  circleRect,
  crispRect,
  rectOf,
  type GuideRect,
  type GuideRects,
  type GuideShape,
} from "@/components/GuideOverlay";

/** The guide shapes belonging to the chart itself — planets, arcs, aspects and
 *  the wheel — shared by every screen that shows a `<Chart side=…>`. */

export type ChartSide = "self" | "other";

/** Planet rings are sized in the chart's own units around the measured disc,
 *  not around the glyph's box — the halo and interaction ring breathe, and a
 *  ring that followed them would too. Past the invite halo (54) for a planet
 *  merely open; past the active halo at full breath and the afflict corona
 *  (both ~78) for one carrying a verb. */
export const PLANET_REACH = 62;
export const CORONA_REACH = 86;
/** The capsule traced along an aspect line: its breadth, and how far it runs
 *  past the line's ends. */
const ASPECT_BREADTH = 14;
const ASPECT_OVERRUN = 4;

/** Whole wheels lift through the veil without a ring of their own — the
 *  wheel's outer ring is already the shape — and notes may sit over them. */
export const WHEELS = ["wheel-self", "wheel-other"];

export function planetAnchor(side: ChartSide, planet: PlanetName) {
  return `planet-${side}-${planet.toLowerCase()}`;
}

export function arcAnchor(side: ChartSide, planet: PlanetName) {
  return `arc-${side}-${planet.toLowerCase()}`;
}

/** The drawn line between two planets — the chart draws each pair once, in
 *  name order. */
export function aspectAnchor(side: ChartSide, a: PlanetName, b: PlanetName) {
  const [first, second] = [a, b].sort();
  return `aspect-${side}-${first!.toLowerCase()}-${second!.toLowerCase()}`;
}

export function wheelOf(id: string) {
  return `wheel-${id.split("-")[1]}`;
}

/** Every glyph on one wheel: never lit as a group, but notes keep off them
 *  whenever a clear side exists. */
export function chartGlyphs(side: ChartSide) {
  return PLANETS.map((planet) => planetAnchor(side, planet));
}

/** A circle of `reach` chart units around a planet's disc. */
export function planetCircle(id: string, reach: number, rects: GuideRects): GuideRect | null {
  const disc = rects[id];
  if (!disc) return null;
  const wheel = rects[wheelOf(id)];
  const scale = wheel ? wheel.width / CHART_SIZE : 1;
  return circleRect(center(disc), reach * scale);
}

/** A chart id names its kind and its side; a screen's own ids (`planet-panel`)
 *  never match. */
const CHART_KIND = /^(planet|arc|aspect)-(?:self|other)-/;

/** The chart's own shapes: planets and wheels are circles, and an aspect is a
 *  capsule along its line. Anything else is the screen's own. */
export function chartShape(
  id: string,
  rects: GuideRects,
  reachOf: (id: string) => number,
): GuideShape | undefined {
  const rect = rectOf(id, rects);
  if (!rect) return undefined;
  const kind = CHART_KIND.exec(id)?.[1];

  if (kind === "planet") {
    const circle = planetCircle(id, reachOf(id), rects);
    return circle ? { rect: circle, radius: circle.width / 2 } : undefined;
  }

  // A capsule along an aspect line, centred on it and turned to its angle.
  if (kind === "aspect" && rect.line) {
    const [a, b] = rect.line;
    const length = Math.hypot(b.x - a.x, b.y - a.y) + 2 * ASPECT_OVERRUN;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    return {
      rect: {
        x: mx - length / 2,
        y: my - ASPECT_BREADTH / 2,
        width: length,
        height: ASPECT_BREADTH,
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      },
      radius: ASPECT_BREADTH / 2,
    };
  }

  // A planet's arc is a span of a circle around its glyph, and its own box
  // is just that span; the ring is the whole circle, centred on the glyph and
  // reaching the arc's far edge.
  if (kind === "arc") {
    const glyph = rects[id.replace("arc-", "planet-")];
    const c = center(glyph ?? rect);
    const corners: [number, number][] = [
      [rect.x, rect.y],
      [rect.x + rect.width, rect.y],
      [rect.x, rect.y + rect.height],
      [rect.x + rect.width, rect.y + rect.height],
    ];
    const reach = Math.max(...corners.map(([x, y]) => Math.hypot(x - c.x, y - c.y)));
    const radius = Math.max(reach, glyph ? glyph.width / 2 : 0) + 8;
    return { rect: circleRect(c, radius), radius };
  }

  if (WHEELS.includes(id)) {
    const box = crispRect(rect);
    return { rect: box, radius: Math.max(box.width, box.height) / 2, lift: true };
  }

  return undefined;
}
