import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RunStars } from "@/components/RunStars";
import { beginRun, MAPS_PER_RUN } from "@/game/run";
import { combustionCeiling } from "@/game/combust";
import type { Prince } from "@/game/types";
import { createStubPrince } from "./fixtures";

function stars(prince: Prince) {
  const doc = new DOMParser().parseFromString(renderToStaticMarkup(<RunStars prince={prince} />), "image/svg+xml");
  return [...doc.querySelectorAll("circle")];
}

describe("run stars", () => {
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
    const brightness = rendered.map((star) => Number(star.getAttribute("fill-opacity")));
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
    const positions = stars(prince).map((star) => [star.getAttribute("cx"), star.getAttribute("cy")]);
    expect(positions[0]).not.toEqual(positions[1]);

    prince.runs.push({ ...beginRun(3), light: 100000, mapsCompleted: MAPS_PER_RUN });
    expect(stars(prince).slice(0, 2).map((star) => star.outerHTML)).toEqual(original);
  });
});
