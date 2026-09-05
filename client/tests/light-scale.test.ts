import { describe, expect, it } from "vitest";
import { lightBands } from "@/game/light-scale";

describe("lightBands", () => {
  it("shows nothing below the first point", () => {
    for (const light of [0, 0.5, -10, Number.NaN]) {
      expect(lightBands(light)).toEqual({ ticks: 0, fraction: 0 });
    }
  });

  it("earns a tick at every doubling, with the bar reset", () => {
    for (const [light, ticks] of [[1, 1], [2, 2], [4, 3], [8, 4], [1024, 11]] as const) {
      expect(lightBands(light)).toEqual({ ticks, fraction: 0 });
    }
  });

  it("fills the bar between doublings", () => {
    // Halfway in value is not halfway in the band: log2(1.5) ≈ 0.585.
    expect(lightBands(3).ticks).toBe(2);
    expect(lightBands(3).fraction).toBeCloseTo(0.585, 3);
    expect(lightBands(1536).fraction).toBeCloseTo(lightBands(3).fraction, 10);
  });

  it("never runs out of ticks — the scale has no ceiling", () => {
    expect(lightBands(4096).ticks).toBe(13);
    expect(lightBands(1_000_000).ticks).toBe(20);
  });

  it("is monotonic in Light", () => {
    let prev = -1;
    for (let light = 1; light < 5000; light += 7) {
      const { ticks, fraction } = lightBands(light);
      const v = ticks + fraction;
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });
});
