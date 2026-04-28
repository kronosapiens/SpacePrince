import {
  ELEMENT_BUFFS,
  EXALTATIONS,
  IN_SECT_LUCK_BONUS,
  MODALITY_BUFFS,
  PLANETS,
  PLANET_BASE_STATS,
  PLANET_SECT,
  RULERSHIP,
  SIGNS,
  SIGN_ELEMENT,
  SIGN_MODALITY,
} from "./data";
import { mulberry32, randomSeed } from "./rng";
import type {
  Chart,
  Dignity,
  PlanetBaseStats,
  PlanetName,
  PlanetPlacement,
  SignName,
} from "./types";

export function getDignity(planet: PlanetName, sign: SignName): Dignity {
  if (RULERSHIP[sign] === planet) return "Domicile";
  const exalted = EXALTATIONS[planet];
  if (exalted && exalted === sign) return "Exaltation";
  const opposite = oppositeSign(sign);
  if (RULERSHIP[opposite] === planet) return "Detriment";
  if (exalted && oppositeSign(exalted) === sign) return "Fall";
  return "Neutral";
}

function oppositeSign(s: SignName): SignName {
  const idx = SIGNS.indexOf(s);
  return SIGNS[(idx + 6) % 12]!;
}

function addStats(a: PlanetBaseStats, b: PlanetBaseStats): PlanetBaseStats {
  return {
    damage: a.damage + b.damage,
    healing: a.healing + b.healing,
    durability: a.durability + b.durability,
    luck: a.luck + b.luck,
  };
}

function normalizeLongitude(value: number): number {
  const n = value % 360;
  return n < 0 ? n + 360 : n;
}

function resolvePlanetSect(planet: PlanetName, longitude: number, sunLong: number): "Day" | "Night" {
  const base = PLANET_SECT[planet];
  if (base !== "Flexible") return base;
  const delta = normalizeLongitude(longitude - sunLong);
  return delta > 180 ? "Day" : "Night";
}

export function signFromLongitude(longitude: number): SignName {
  const idx = Math.floor(normalizeLongitude(longitude) / 30) % 12;
  return SIGNS[idx]!;
}

export interface DerivePlacementsInput {
  longitudes: Record<PlanetName, number>;
  ascendantLongitude: number;
  isDiurnal: boolean;
}

export function derivePlacements({
  longitudes,
  ascendantLongitude,
  isDiurnal,
}: DerivePlacementsInput): {
  planets: Record<PlanetName, PlanetPlacement>;
  ascendantSign: SignName;
} {
  const sunLong = longitudes.Sun;
  const chartSect = isDiurnal ? "Day" : "Night";
  const planets = {} as Record<PlanetName, PlanetPlacement>;

  for (const planet of PLANETS) {
    const longitude = normalizeLongitude(longitudes[planet]);
    const sign = signFromLongitude(longitude);
    const element = SIGN_ELEMENT[sign];
    const modality = SIGN_MODALITY[sign];
    const base = PLANET_BASE_STATS[planet];
    const buffs = addStats(ELEMENT_BUFFS[element], MODALITY_BUFFS[modality]);
    const planetSect = resolvePlanetSect(planet, longitude, sunLong);
    if (planetSect === chartSect) buffs.luck += IN_SECT_LUCK_BONUS;
    const dignity = getDignity(planet, sign);
    planets[planet] = {
      planet,
      sign,
      eclipticLongitude: longitude,
      element,
      modality,
      base,
      buffs,
      dignity,
    };
  }

  const ascendantSign = signFromLongitude(ascendantLongitude);
  return { planets, ascendantSign };
}

export function wholeSignHouses(ascendantSign: SignName): Record<number, SignName> {
  const ascIdx = SIGNS.indexOf(ascendantSign);
  const houses: Record<number, SignName> = {};
  for (let i = 0; i < 12; i++) {
    houses[i + 1] = SIGNS[(ascIdx + i) % 12]!;
  }
  return houses;
}

/**
 * Used for opponent NPC charts (random) and as a stub when no birth data is supplied.
 * Mercury within ±28° of Sun, Venus within ±47° of Sun (real elongation limits).
 */
export function seededChart(seed = randomSeed(), name = "Prince"): Chart {
  const rng = mulberry32(seed);
  const isDiurnal = rng() > 0.5;
  const sunLong = rng() * 360;
  const sample = (max: number) => (rng() + rng() - 1) * max;
  const longitudes: Record<PlanetName, number> = {
    Sun: sunLong,
    Mercury: normalizeLongitude(sunLong + sample(28)),
    Venus: normalizeLongitude(sunLong + sample(47)),
    Moon: rng() * 360,
    Mars: rng() * 360,
    Jupiter: rng() * 360,
    Saturn: rng() * 360,
  };
  const ascendantLongitude = rng() * 360;
  const { planets, ascendantSign } = derivePlacements({
    longitudes,
    ascendantLongitude,
    isDiurnal,
  });
  return {
    id: `chart_${seed}`,
    name,
    isDiurnal,
    ascendantSign,
    ascendantLongitude,
    planets,
  };
}

export function blankSideState() {
  const out = {} as Record<PlanetName, { affliction: number; combusted: boolean }>;
  for (const p of PLANETS) out[p] = { affliction: 0, combusted: false };
  return out;
}

export function cloneSideState<T extends Record<PlanetName, { affliction: number; combusted: boolean }>>(s: T): T {
  const out = {} as T;
  for (const p of PLANETS) {
    (out as any)[p] = { ...s[p] };
  }
  return out;
}
