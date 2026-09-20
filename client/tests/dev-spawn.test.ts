import { afterEach, describe, expect, it, vi } from "vitest";
import { spawn, spawnEnd } from "@/state/dev-spawn";
import { isOver } from "@/game/run";
import { loadPrince, savePrince } from "@/state/prince";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("development snapshots", () => {
  it.each(["map", "combat", "narrative", "end"] as const)("includes persistent, seeded past runs when spawning %s", (kind) => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const prince = spawn(kind, { tier: 2 });
    const history = prince.runs.slice(0, -1);

    expect(history.length).toBeGreaterThan(0);
    expect(history.every((run) => isOver(run, prince.chart, prince.numEncounters))).toBe(true);
    expect(new Set(history.map((run) => run.light)).size).toBeGreaterThan(1);
    expect(new Set(prince.runs.map((run) => run.id)).size).toBe(prince.runs.length);
    expect(prince.numEncounters).toBe(2);
    expect(isOver(prince.runs.at(-1)!, prince.chart, prince.numEncounters)).toBe(kind === "end");
    expect(spawn(kind, { tier: 2 }).runs.slice(0, -1)).toEqual(history);

    savePrince(prince);
    expect(loadPrince()!.runs.slice(0, -1)).toEqual(history);
  });

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
