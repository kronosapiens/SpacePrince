import { beforeEach, describe, expect, it } from "vitest";
import { loadPrince, savePrince } from "@/state/prince";
import { beginRun, rolloverMap } from "@/game/run";
import { createStubPrince } from "./fixtures";

describe("prince persistence", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a Prince through localStorage", () => {
    const p = createStubPrince({ runs: [beginRun(1)] });
    savePrince(p);
    const loaded = loadPrince();
    expect(loaded?.id).toBe(p.id);
    expect(loaded?.numEncounters).toBe(p.numEncounters);
    expect(loaded?.runs).toHaveLength(1);
  });

  it("keeps the tail run's event log; strips finished runs' logs", () => {
    // Two runs: the first (finished, inert) and the tail. Each rolls over one
    // map so both carry a map-completed event.
    const finished = rolloverMap(beginRun(1), 11);
    const tail = rolloverMap(beginRun(2), 22);
    expect(finished.events).toHaveLength(1);
    expect(tail.events).toHaveLength(1);

    savePrince(createStubPrince({ runs: [finished, tail] }));
    const loaded = loadPrince();
    expect(loaded?.runs[0]?.events).toHaveLength(0); // inert run: payload is its scalars
    expect(loaded?.runs[1]?.events).toHaveLength(1); // tail run: history survives reload
  });
});
