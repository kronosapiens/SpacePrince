import { describe, expect, it } from "vitest";
import { currentSky } from "@/astronomy/transits";
import { PLANETS, SIGNS } from "@/game/data";

describe("transits — the current sky", () => {
  it("returns a real sign for all seven planets", () => {
    const sky = currentSky(new Date("2026-07-09T12:00:00Z"));
    for (const p of PLANETS) {
      expect(SIGNS).toContain(sky[p]);
    }
  });

  it("keeps Mercury within a sign of the Sun (geocentric elongation ≤ 28°)", () => {
    for (const iso of ["1990-03-15T06:00:00Z", "2005-11-01T18:00:00Z", "2026-07-09T00:00:00Z"]) {
      const sky = currentSky(new Date(iso));
      const sun = SIGNS.indexOf(sky.Sun);
      const mercury = SIGNS.indexOf(sky.Mercury);
      const delta = Math.min((mercury - sun + 12) % 12, (sun - mercury + 12) % 12);
      expect(delta).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic for a fixed moment", () => {
    const a = currentSky(new Date("2026-01-01T00:00:00Z"));
    const b = currentSky(new Date("2026-01-01T00:00:00Z"));
    expect(a).toEqual(b);
  });
});
