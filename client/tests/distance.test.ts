import { describe, expect, it } from "vitest";
import { distanceBands } from "@/game/distance";

describe("distanceBands", () => {
  it("shows nothing below the first point", () => {
    for (const d of [0, 0.5, -10, Number.NaN]) {
      expect(distanceBands(d)).toEqual({ ticks: 0, fraction: 0 });
    }
  });

  it("earns a tick at every doubling, with the bar reset", () => {
    for (const [d, ticks] of [[1, 1], [2, 2], [4, 3], [8, 4], [1024, 11]] as const) {
      expect(distanceBands(d)).toEqual({ ticks, fraction: 0 });
    }
  });

  it("fills the bar between doublings", () => {
    // Halfway in value is not halfway in the band: log2(1.5) ≈ 0.585.
    expect(distanceBands(3).ticks).toBe(2);
    expect(distanceBands(3).fraction).toBeCloseTo(0.585, 3);
    expect(distanceBands(1536).fraction).toBeCloseTo(distanceBands(3).fraction, 10);
  });

  it("never runs out of ticks — the scale has no ceiling", () => {
    expect(distanceBands(4096).ticks).toBe(13);
    expect(distanceBands(1_000_000).ticks).toBe(20);
  });

  it("is monotonic in distance", () => {
    let prev = -1;
    for (let d = 1; d < 5000; d += 7) {
      const { ticks, fraction } = distanceBands(d);
      const v = ticks + fraction;
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });
});
