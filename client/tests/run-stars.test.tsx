import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RunStars } from "@/components/RunStars";
import { beginRun, MAPS_PER_RUN } from "@/game/run";
import { combustionCeiling } from "@/game/combust";
import type { Prince } from "@/game/types";
import { createStubPrince } from "./fixtures";
import { SPANDREL, STAR_RECTANGLES } from "@/svg/prince-style";

function stars(prince: Prince) {
  const doc = new DOMParser().parseFromString(renderToStaticMarkup(<svg><RunStars prince={prince} /></svg>), "image/svg+xml");
  return [...doc.querySelectorAll('[aria-label="Past runs"] > g')];
}

describe("run stars", () => {
  it("uses mirrored, adjacent rectangles of equal area whose lower inner corners touch the arc", () => {
    const rectangles = [...STAR_RECTANGLES].sort((a, b) => a.x - b.x);
    const area = rectangles[0]!.width * rectangles[0]!.height;
    let edge = SPANDREL.left;
    for (const [index, rectangle] of rectangles.entries()) {
      const { x, y, width, height } = rectangle;
      expect(width * height).toBeCloseTo(area, 8);
      expect(x).toBeCloseTo(edge, 8);
      expect(y).toBe(SPANDREL.top);
      expect(y + height).toBeLessThanOrEqual(SPANDREL.bottom);
      const innerX = x < SPANDREL.centerX ? x + width : x;
      expect(Math.hypot(innerX - SPANDREL.centerX, y + height - SPANDREL.centerY))
        .toBeCloseTo(SPANDREL.radius, 8);
      const mirror = rectangles[rectangles.length - 1 - index]!;
      expect(mirror.x).toBeCloseTo(2 * SPANDREL.centerX - x - width, 8);
      expect(mirror.width).toBe(width);
      expect(mirror.height).toBe(height);
      edge = x + width;
    }
    expect(edge).toBeCloseTo(SPANDREL.right, 8);
  });

  it("places star centres across both corners within the rectangles", () => {
    const prince = createStubPrince({ runs: Array.from({ length: 80 }, (_, seed) => ({
      ...beginRun(seed), mapsCompleted: MAPS_PER_RUN,
    })) });
    const rendered = stars(prince);
    expect(rendered).toHaveLength(80);
    const positions = rendered.map((star) => {
      const circle = star.querySelector("circle")!;
      return { x: Number(circle.getAttribute("cx")), y: Number(circle.getAttribute("cy")) };
    });
    for (const { x, y } of positions) {
      expect(STAR_RECTANGLES.some((rectangle) =>
        x >= rectangle.x && x < rectangle.x + rectangle.width &&
        y >= rectangle.y && y < rectangle.y + rectangle.height,
      )).toBe(true);
    }
    // The old rectangular field stopped at y=100.
    expect(positions.some(({ x, y }) => x < 200 && y > 150)).toBe(true);
    expect(positions.some(({ x, y }) => x > 600 && y > 150)).toBe(true);
  });

  it("shows every finished run, including early combustion and zero Light, with brightness ordered by Light", () => {
    const prince = createStubPrince();
    const earlyRun = beginRun(1);
    earlyRun.state.Moon.affliction = combustionCeiling(prince.chart.planets.Moon);
    const completed = [64, 512, 4096].map((light, index) => ({
      ...beginRun(index + 2), light, mapsCompleted: MAPS_PER_RUN,
    }));
    prince.runs = [earlyRun, ...completed, beginRun(5)];

    const rendered = stars(prince);
    expect(rendered).toHaveLength(4);
    const brightness = rendered.map((star) => Number(star.getAttribute("opacity")));
    expect(brightness[0]).toBeGreaterThan(0);
    for (let i = 1; i < brightness.length; i++) expect(brightness[i]).toBeGreaterThan(brightness[i - 1]!);
    expect(rendered[0]!.textContent).toContain("0 Light");

    prince.runs.at(-1)!.mapsCompleted = MAPS_PER_RUN;
    expect(stars(prince)).toHaveLength(5);
  });

  it("keeps stars stable through reloads and new runs while equal scores occupy different positions", () => {
    const prince = createStubPrince({ runs: [1, 2].map((seed) => ({
      ...beginRun(seed), light: 512, mapsCompleted: MAPS_PER_RUN,
    })) });
    const original = stars(prince).map((star) => star.outerHTML);
    expect(stars(JSON.parse(JSON.stringify(prince)) as Prince).map((star) => star.outerHTML)).toEqual(original);
    const positions = stars(prince).map((star) => {
      const circle = star.querySelector("circle")!;
      return [circle.getAttribute("cx"), circle.getAttribute("cy")];
    });
    expect(positions[0]).not.toEqual(positions[1]);

    prince.runs.push({ ...beginRun(3), light: 100000, mapsCompleted: MAPS_PER_RUN });
    expect(stars(prince).slice(0, 2).map((star) => star.outerHTML)).toEqual(original);
  });
});
