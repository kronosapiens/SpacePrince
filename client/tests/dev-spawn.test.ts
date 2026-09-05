import { describe, expect, it } from "vitest";
import { spawnEnd } from "@/state/dev-spawn";

describe("development snapshots", () => {
  it("derives final Light from synthetic node deltas", () => {
    const prince = spawnEnd();
    const run = prince.runs.at(-1)!;
    const maps = [...run.events.map((event) => event.map), run.map];
    const light = maps.reduce(
      (mapTotal, map) =>
        mapTotal + Object.values(map.outcomes).reduce((nodeTotal, outcome) => nodeTotal + outcome.lightDelta, 0),
      0,
    );

    expect(run.light).toBe(light);
  });
});
