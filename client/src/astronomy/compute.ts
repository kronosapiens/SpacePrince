import {
  Body,
  Ecliptic,
  EclipticGeoMoon,
  GeoVector,
  Observer,
  SiderealTime,
  SunPosition,
  e_tilt,
  Equator,
  Horizon,
  MakeTime,
} from "astronomy-engine";
import type { PlanetName } from "@/game/types";

// Astrology is geocentric and tropical: positions are where a planet appears from
// Earth, in the ecliptic of date. SunPosition / EclipticGeoMoon give that directly
// for the luminaries; the five planets compose GeoVector (geocentric apparent) with
// Ecliptic (which converts to true ecliptic of date). EclipticLongitude is *not*
// usable here — it is heliocentric, so it would put Mercury/Venus nowhere near the Sun.
const NON_LUMINARY_BODIES: Partial<Record<PlanetName, Body>> = {
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
};

export interface BirthPlanetData {
  longitudes: Record<PlanetName, number>;
  ascendantLongitude: number;
  isDiurnal: boolean;
}

/**
 * Compute apparent geocentric ecliptic longitudes for the seven classical planets,
 * the Ascendant from local sidereal time + obliquity, and day/night sect.
 */
export function computeBirthChart(
  iso: string,
  latitude: number,
  longitudeDeg: number,
): BirthPlanetData {
  const date = new Date(iso);
  const time = MakeTime(date);
  const observer = new Observer(latitude, longitudeDeg, 0);

  const longitudes = {} as Record<PlanetName, number>;
  longitudes.Sun = normalizeLongitude(SunPosition(time).elon);
  longitudes.Moon = normalizeLongitude(EclipticGeoMoon(time).lon);
  for (const planet of Object.keys(NON_LUMINARY_BODIES) as PlanetName[]) {
    // GeoVector: geocentric apparent (aberration-corrected) EQJ vector.
    // Ecliptic: converts it to the true ecliptic of date — same frame as the
    // Sun/Moon above — and gives ecliptic longitude as .elon.
    const ecl = Ecliptic(GeoVector(NON_LUMINARY_BODIES[planet]!, time, true));
    longitudes[planet] = normalizeLongitude(ecl.elon);
  }

  const ascendantLongitude = computeAscendant(time, latitude, longitudeDeg);

  // isDiurnal: Sun above the horizon at birth.
  const sunEq = Equator(Body.Sun, time, observer, true, true);
  const sunHorizon = Horizon(time, observer, sunEq.ra, sunEq.dec, "normal");
  const isDiurnal = sunHorizon.altitude > 0;

  return { longitudes, ascendantLongitude, isDiurnal };
}

function normalizeLongitude(value: number): number {
  const n = value % 360;
  return n < 0 ? n + 360 : n;
}

/**
 * Ascendant from local sidereal time + obliquity at birth.
 *
 * Standard formula (e.g. Meeus, Astronomical Algorithms ch. 13):
 *   tan(asc) = -cos(LST) / (sin(eps)*tan(phi) + cos(eps)*sin(LST))
 * with quadrant adjustment so the result is the *rising* ecliptic point.
 */
function computeAscendant(time: ReturnType<typeof MakeTime>, latitude: number, longitudeDeg: number): number {
  // LST in degrees: GMST (hours from astronomy-engine) → degrees + east longitude.
  const gmstHours = SiderealTime(time);
  const lstDeg = normalizeLongitude(gmstHours * 15 + longitudeDeg);
  const obliquityDeg = e_tilt(time).tobl; // true obliquity of date in degrees
  const phi = (Math.max(-66.5, Math.min(66.5, latitude)) * Math.PI) / 180;
  const eps = (obliquityDeg * Math.PI) / 180;
  const lst = (lstDeg * Math.PI) / 180;

  // Asc = atan2(-cos LST, sin(eps)*tan(phi) + cos(eps)*sin(LST))
  const y = -Math.cos(lst);
  const x = Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(lst);
  const ascRad = Math.atan2(y, x);
  return normalizeLongitude((ascRad * 180) / Math.PI);
}
