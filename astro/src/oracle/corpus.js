import * as Astronomy from "astronomy-engine";

const PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
const PLANET_BODY = {
  Sun: Astronomy.Body.Sun,
  Moon: Astronomy.Body.Moon,
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
};

export const EPOCH_1900_UNIX_MS = Date.UTC(1900, 0, 1, 0, 0, 0);

export function normalizeDegrees(lon) {
  let out = lon % 360;
  if (out < 0) out += 360;
  return out;
}

export function longitudeToSign(lon) {
  return Math.floor(normalizeDegrees(lon) / 30);
}

export function minuteSince1900(unixMs) {
  return Math.floor((unixMs - EPOCH_1900_UNIX_MS) / 60_000);
}

export function quantizeMinute(minute, bucketMinutes = 15) {
  return Math.floor(minute / bucketMinutes) * bucketMinutes;
}

export function minuteToUnixMs(minute) {
  return EPOCH_1900_UNIX_MS + minute * 60_000;
}

function planetLongitude(planet, unixMs, aberration) {
  const date = new Date(unixMs);
  if (planet === "Moon") {
    return Astronomy.EclipticGeoMoon(date).lon;
  }
  const body = PLANET_BODY[planet];
  if (!body) {
    throw new Error(`Unsupported planet: ${planet}`);
  }
  const vector = Astronomy.GeoVector(body, date, aberration);
  return Astronomy.Ecliptic(vector).elon;
}

function ascendantLongitude(unixMs, latBin, lonBin) {
  const date = new Date(unixMs);
  const observer = new Astronomy.Observer(latBin / 10, lonBin / 10, 0);
  const time = Astronomy.MakeTime(date);

  // Ascendant is the eastern intersection of local horizon and ecliptic.
  const ectToEqd = Astronomy.Rotation_ECT_EQD(date);
  const eqdToHor = Astronomy.Rotation_EQD_HOR(date, observer);

  const exEqd = Astronomy.RotateVector(ectToEqd, new Astronomy.Vector(1, 0, 0, time));
  const eyEqd = Astronomy.RotateVector(ectToEqd, new Astronomy.Vector(0, 1, 0, time));
  const exHor = Astronomy.RotateVector(eqdToHor, exEqd);
  const eyHor = Astronomy.RotateVector(eqdToHor, eyEqd);

  let lon1 = normalizeDegrees((Math.atan2(-exHor.z, eyHor.z) * 180) / Math.PI);
  let lon2 = normalizeDegrees(lon1 + 180);

  function horizonYForEclipticLon(lonDeg) {
    const r = (lonDeg * Math.PI) / 180;
    const vecEct = new Astronomy.Vector(Math.cos(r), Math.sin(r), 0, time);
    const vecEqd = Astronomy.RotateVector(ectToEqd, vecEct);
    const vecHor = Astronomy.RotateVector(eqdToHor, vecEqd);
    return vecHor.y; // HOR y-axis points west, east is negative y.
  }

  const y1 = horizonYForEclipticLon(lon1);
  const y2 = horizonYForEclipticLon(lon2);
  if (y2 < y1) lon1 = lon2;

  return lon1;
}

export function generateSignCorpus({
  startUnixMs,
  endUnixMs,
  stepMinutes,
  latBins,
  lonBins,
  quantizeMinutes = 15,
  aberration = true,
}) {
  if (!Number.isFinite(startUnixMs) || !Number.isFinite(endUnixMs) || startUnixMs > endUnixMs) {
    throw new Error("Invalid [startUnixMs, endUnixMs] range");
  }
  if (!Number.isInteger(stepMinutes) || stepMinutes <= 0) {
    throw new Error(`Invalid stepMinutes=${stepMinutes}`);
  }
  if (!Array.isArray(latBins) || latBins.length === 0) {
    throw new Error("latBins must be a non-empty array");
  }
  if (!Array.isArray(lonBins) || lonBins.length === 0) {
    throw new Error("lonBins must be a non-empty array");
  }

  const entries = [];
  const stepMs = stepMinutes * 60_000;

  for (let t = startUnixMs; t <= endUnixMs; t += stepMs) {
    const minute = minuteSince1900(t);
    const qMinute = quantizeMinute(minute, quantizeMinutes);
    const qUnixMs = minuteToUnixMs(qMinute);

    for (const latBin of latBins) {
      for (const lonBin of lonBins) {
        const planet_sign = PLANETS.map((planet) =>
          longitudeToSign(planetLongitude(planet, qUnixMs, aberration)),
        );
        const asc_sign = longitudeToSign(ascendantLongitude(qUnixMs, latBin, lonBin));

        entries.push({
          time_minute: qMinute,
          lat_bin: latBin,
          lon_bin: lonBin,
          planet_sign,
          asc_sign,
        });
      }
    }
  }

  return {
    meta: {
      epoch: "1900-01-01T00:00:00Z",
      time_unit: "minute_since_1900",
      quantize_minutes: quantizeMinutes,
      range: { startUnixMs, endUnixMs, stepMinutes },
      lat_bin_unit: "0.1_degree",
      lon_bin_unit: "0.1_degree",
      planets: PLANETS,
      aberration,
    },
    entries,
  };
}
