import { describe, expect, it } from "vitest";
import { noteEncounterResolved, takePendingUnlock } from "@/state/ceremony";

describe("unlock ceremony hand-off", () => {
  it("notes the planet whose threshold the resolving encounter crosses", () => {
    noteEncounterResolved(3); // 3 → 4 crosses the Sun threshold
    expect(takePendingUnlock()).toBe("Sun");
  });

  it("take consumes the pending unlock", () => {
    noteEncounterResolved(0); // 0 → 1: Mercury
    expect(takePendingUnlock()).toBe("Mercury");
    expect(takePendingUnlock()).toBeNull();
  });

  it("non-threshold counts leave nothing pending", () => {
    noteEncounterResolved(5); // 5 → 6 crosses nothing
    expect(takePendingUnlock()).toBeNull();
  });

  it("counts past the final threshold are quiet", () => {
    noteEncounterResolved(64);
    expect(takePendingUnlock()).toBeNull();
  });
});
