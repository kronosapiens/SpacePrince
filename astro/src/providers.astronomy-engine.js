import * as Astronomy from "astronomy-engine";

const BODY_MAP = {
  Sun: Astronomy.Body.Sun,
  Moon: Astronomy.Body.Moon,
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
};

/**
 * Reference provider backed by astronomy-engine.
 * Returns geocentric true-ecliptic longitudes in [0, 360).
 */
export function createAstronomyEngineProvider({ aberration = true } = {}) {
  return {
    getLongitude(planet, unixMs) {
      const date = new Date(unixMs);
      if (planet === "Sun") {
        return Astronomy.SunPosition(date).elon;
      }
      if (planet === "Moon") {
        return Astronomy.EclipticGeoMoon(date).lon;
      }
      const body = BODY_MAP[planet];
      if (!body) throw new Error(`Unsupported planet: ${planet}`);
      const vector = Astronomy.GeoVector(body, date, aberration);
      return Astronomy.Ecliptic(vector).elon;
    },
  };
}
