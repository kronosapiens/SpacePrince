import { describe, expect, it } from "vitest";
import {
  EquatorFromVector, Horizon, MakeTime, Observer, RotateVector,
  Rotation_ECT_EQD, Spherical, VectorFromSphere,
} from "astronomy-engine";
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

  it("places the ascendant in Scorpio for 1989-02-12 at 00:35 in Los Angeles", () => {
    // PST is UTC−8; coordinates match the city's 0.1° mint rounding.
    const { ascendantLongitude } = computeBirthChart("1989-02-12T08:35:00Z", 34.1, -118.2);
    expect(signFromLongitude(ascendantLongitude)).toBe("Scorpio");
  });

  it("places the ascendant on the eastern horizon throughout the day", () => {
    for (const [lat, lon] of [[34.1, -118.2], [-33.9, 151.2], [0, 0]] as const) {
      for (const hour of [0, 6, 12, 18]) {
        const iso = new Date(Date.UTC(2000, 5, 21, hour)).toISOString();
        const { ascendantLongitude } = computeBirthChart(iso, lat, lon);
        const time = MakeTime(new Date(iso));
        const ecliptic = VectorFromSphere(new Spherical(0, ascendantLongitude, 1), time);
        const equatorial = EquatorFromVector(RotateVector(Rotation_ECT_EQD(time), ecliptic));
        const horizon = Horizon(time, new Observer(lat, lon, 0), equatorial.ra, equatorial.dec);

        expect(ascendantLongitude).toBeGreaterThanOrEqual(0);
        expect(ascendantLongitude).toBeLessThan(360);
        expect(horizon.altitude).toBeCloseTo(0, 6);
        expect(horizon.azimuth).toBeGreaterThan(0);
        expect(horizon.azimuth).toBeLessThan(180);
      }
    }
  });

  it("isDiurnal is true at noon, false at midnight (broadly)", () => {
    const noon = computeBirthChart("2000-06-21T17:00:00Z", 40.0, -74.0); // ~13:00 NYC local
    const midnight = computeBirthChart("2000-06-21T05:00:00Z", 40.0, -74.0); // ~01:00 NYC local
    expect(noon.isDiurnal).toBe(true);
    expect(midnight.isDiurnal).toBe(false);
  });
});

describe("computeBirthChart — geocentric frame", () => {
  const sep = (a: number, b: number) => {
    const d = Math.abs(((a - b) % 360) + 360) % 360;
    return Math.min(d, 360 - d);
  };

  // The defining tell of geocentric (not heliocentric) positions: as seen from
  // Earth, Mercury never strays >28° from the Sun, Venus never >47°. Heliocentric
  // longitudes would scatter them anywhere up to 180° away.
  it("Mercury ≤28° and Venus ≤47° from the Sun, every month of 2000", () => {
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, "0");
      const { longitudes: l } = computeBirthChart(`2000-${mm}-15T12:00:00Z`, 40.0, -74.0);
      expect(sep(l.Mercury, l.Sun)).toBeLessThanOrEqual(28.5);
      expect(sep(l.Venus, l.Sun)).toBeLessThanOrEqual(47.5);
    }
  });

  // Real geocentric signs on 2000-01-01 (tropical, of-date) — locks the frame.
  it("places planets in their real signs on 2000-01-01", () => {
    const { longitudes: l } = computeBirthChart("2000-01-01T12:00:00Z", 51.5, -0.13);
    expect(signFromLongitude(l.Sun)).toBe("Capricorn");
    expect(signFromLongitude(l.Mercury)).toBe("Capricorn");
    expect(signFromLongitude(l.Venus)).toBe("Sagittarius");
    expect(signFromLongitude(l.Mars)).toBe("Aquarius");
    expect(signFromLongitude(l.Jupiter)).toBe("Aries");
    expect(signFromLongitude(l.Saturn)).toBe("Taurus");
  });
});
