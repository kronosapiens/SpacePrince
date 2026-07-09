import { useEffect, useState } from "react";
import { computeBirthChart } from "./compute";
import { PLANETS, SIGNS } from "@/game/data";
import type { PlanetName, SignName } from "@/game/types";

/**
 * Transits: the sky right now, read against the natal chart — the oldest
 * living astrological practice (ASTROLOGY.md §3, "the most widely used
 * predictive technique"). Strictly presentational: zero mechanical effect,
 * and the NFT does not respond (NFT.md forbids evolution on time passage).
 * The client simply shows today's sky around the chart the player owns.
 *
 * Planet signs are location-independent (only the Ascendant needs a place),
 * so the current sky is one ephemeris call on wall-clock time.
 */
export function currentSky(date: Date = new Date()): Record<PlanetName, SignName> {
  const { longitudes } = computeBirthChart(date.toISOString(), 0, 0);
  const sky = {} as Record<PlanetName, SignName>;
  for (const p of PLANETS) {
    sky[p] = SIGNS[Math.floor(longitudes[p] / 30) % 12]!;
  }
  return sky;
}

/** The Moon changes sign roughly every 2.5 days; half-hourly is generous. */
const REFRESH_MS = 30 * 60 * 1000;

export function useCurrentSky(): Record<PlanetName, SignName> {
  const [sky, setSky] = useState(() => currentSky());
  useEffect(() => {
    const id = window.setInterval(() => setSky(currentSky()), REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);
  return sky;
}
