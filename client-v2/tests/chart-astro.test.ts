import { describe, expect, it } from "vitest";
import { computeBirthChart } from "@/astronomy/compute";
import { signFromLongitude } from "@/game/chart";

describe("computeBirthChart — known dates", () => {
  // Spec calls for sign-level tolerance only (CHART.md §4 — no degree precision in gameplay).
  it("Sun on 2000-03-21 ~10:00 UTC is in Pisces or Aries (around equinox)", () => {
    const { longitudes } = computeBirthChart("2000-03-21T10:00:00Z", 40.0, -74.0);
    const sign = signFromLongitude(longitudes.Sun);
    expect(["Pisces", "Aries"]).toContain(sign);
  });

  it("Sun on 2000-08-15 12:00 UTC is in Leo (mid-August)", () => {
    const { longitudes } = computeBirthChart("2000-08-15T12:00:00Z", 40.0, -74.0);
    const sign = signFromLongitude(longitudes.Sun);
    expect(sign).toBe("Leo");
  });

  it("Sun on 2000-12-22 12:00 UTC is in Sagittarius or Capricorn (winter solstice)", () => {
    const { longitudes } = computeBirthChart("2000-12-22T12:00:00Z", 40.0, -74.0);
    const sign = signFromLongitude(longitudes.Sun);
    expect(["Sagittarius", "Capricorn"]).toContain(sign);
  });

  it("returns a valid ascendant longitude in [0, 360)", () => {
    const { ascendantLongitude } = computeBirthChart("1990-06-15T15:30:00Z", 51.5, -0.13);
    expect(ascendantLongitude).toBeGreaterThanOrEqual(0);
    expect(ascendantLongitude).toBeLessThan(360);
  });

  it("isDiurnal is true at noon, false at midnight (broadly)", () => {
    const noon = computeBirthChart("2000-06-21T17:00:00Z", 40.0, -74.0); // ~13:00 NYC local
    const midnight = computeBirthChart("2000-06-21T05:00:00Z", 40.0, -74.0); // ~01:00 NYC local
    expect(noon.isDiurnal).toBe(true);
    expect(midnight.isDiurnal).toBe(false);
  });
});
