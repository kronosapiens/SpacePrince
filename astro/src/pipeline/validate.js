import { PLANETS } from "../types.js";
import { evaluatePlanetLongitude, signFromLongitude } from "../archive.js";
import { angularDifferenceDegrees } from "../math/angles.js";

const DEFAULT_STEP_MINUTES = 15;

/**
 * @param {import('../types.js').LongitudeArchive} archive
 * @param {{ getLongitude: (planet: import('../types.js').PlanetId, unixMs: number) => number }} referenceProvider
 * @param {{ stepMinutes?: number }} [opts]
 */
export function validateLongitudeArchive(archive, referenceProvider, opts = {}) {
  const stepMinutes = opts.stepMinutes ?? DEFAULT_STEP_MINUTES;
  const stepMs = stepMinutes * 60 * 1000;
  const results = {};

  for (const planet of PLANETS) {
    let count = 0;
    let sqSum = 0;
    let maxError = 0;
    let signMismatches = 0;

    for (let t = archive.rangeStartUnixMs; t <= archive.rangeEndUnixMs; t += stepMs) {
      const reference = referenceProvider.getLongitude(planet, t);
      const estimated = evaluatePlanetLongitude(archive, planet, t);
      const absErr = Math.abs(angularDifferenceDegrees(reference, estimated));
      sqSum += absErr * absErr;
      if (absErr > maxError) maxError = absErr;
      if (signFromLongitude(reference) !== signFromLongitude(estimated)) {
        signMismatches += 1;
      }
      count += 1;
    }

    results[planet] = {
      samples: count,
      maxError,
      rmsError: Math.sqrt(sqSum / Math.max(1, count)),
      signMismatches,
    };
  }

  return { stepMinutes, results };
}
