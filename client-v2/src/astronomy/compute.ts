import {
  Body,
  EclipticGeoMoon,
  EclipticLongitude,
  Observer,
  SiderealTime,
  SunPosition,
  e_tilt,
  Equator,
  Horizon,
  MakeTime,
} from "astronomy-engine";
import type { PlanetName } from "@/game/types";

// EclipticLongitude is helio for non-Sun/Moon and apparent for those (relative to Earth).
// astronomy-engine returns geocentric apparent ecliptic longitude for Mercury..Saturn via this function,
// so we use SunPosition + EclipticGeoMoon for those two specifically.
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
    longitudes[planet] = normalizeLongitude(EclipticLongitude(NON_LUMINARY_BODIES[planet]!, time));
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
