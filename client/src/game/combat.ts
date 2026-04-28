import { ELEMENT_QUALITIES, PLANET_SECT } from "./data";
import type {
  Chart,
  ElementType,
  PlanetName,
  PlanetPlacement,
  PlanetStats,
  Polarity,
} from "./types";

export function getPolarity(a: ElementType, b: ElementType): Polarity {
  const qa = ELEMENT_QUALITIES[a];
  const qb = ELEMENT_QUALITIES[b];
  const shared = qa.filter((q) => qb.includes(q)).length;
  if (shared === 2) return "Testimony";
  if (shared === 1) return "Friction";
  return "Affliction";
}

export function getEffectiveStatsFromPlacement(p: PlanetPlacement): PlanetStats {
  return {
    damage: Math.max(0, p.base.damage + p.buffs.damage),
    healing: Math.max(0, p.base.healing + p.buffs.healing),
    durability: Math.max(0, p.base.durability + p.buffs.durability),
    luck: Math.max(0, p.base.luck + p.buffs.luck),
  };
}

export function getEffectiveStats(chart: Chart, planet: PlanetName): PlanetStats {
  return getEffectiveStatsFromPlacement(chart.planets[planet]);
}

const ZERO_STATS: PlanetStats = { damage: 0, healing: 0, durability: 0, luck: 0 };

export function computeDirectExchange(
  polarity: Polarity,
  playerStats: PlanetStats,
  opponentStats: PlanetStats,
) {
  const polarityMultiplier = polarity === "Affliction" ? 2 : 1;
  const playerToOpponent =
    (polarity === "Testimony" ? playerStats.healing : playerStats.damage) * polarityMultiplier;
  const opponentToPlayer =
    (polarity === "Testimony" ? opponentStats.healing : opponentStats.damage) * polarityMultiplier;
  return {
    polarityMultiplier,
    playerToOpponent: Math.max(0, playerToOpponent),
    opponentToPlayer: Math.max(0, opponentToPlayer),
  };
}

export function getProjectedPair(
  playerChart: Chart,
  opponentChart: Chart,
  playerPlanet: PlanetName,
  opponentPlanet: PlanetName,
  playerCombusted = false,
  opponentCombusted = false,
) {
  const pp = playerChart.planets[playerPlanet];
  const op = opponentChart.planets[opponentPlanet];
  const polarity = getPolarity(pp.element, op.element);
  const playerStats = playerCombusted ? ZERO_STATS : getEffectiveStats(playerChart, playerPlanet);
  const opponentStats = opponentCombusted ? ZERO_STATS : getEffectiveStats(opponentChart, opponentPlanet);
  const exchange = computeDirectExchange(polarity, playerStats, opponentStats);
  const selfDelta = polarity === "Testimony" ? -exchange.opponentToPlayer : exchange.opponentToPlayer;
  const otherDelta = polarity === "Testimony" ? -exchange.playerToOpponent : exchange.playerToOpponent;
  return { polarity, selfDelta, otherDelta, ...exchange };
}

function normalizeLongitude(value: number): number {
  const n = value % 360;
  return n < 0 ? n + 360 : n;
}

function resolveMercurySect(mercuryLongitude: number, sunLongitude: number): "Day" | "Night" {
  const delta = normalizeLongitude(mercuryLongitude - sunLongitude);
  return delta > 180 ? "Day" : "Night";
}

export function getResolvedSect(chart: Chart, planet: PlanetName): "Day" | "Night" {
  const base = PLANET_SECT[planet];
  if (base !== "Flexible") return base;
  const mercuryLong = chart.planets.Mercury.eclipticLongitude;
  const sunLong = chart.planets.Sun.eclipticLongitude;
  if (mercuryLong === undefined || sunLong === undefined) {
    return chart.isDiurnal ? "Day" : "Night";
  }
  return resolveMercurySect(mercuryLong, sunLong);
}

export function isInSect(chart: Chart, planet: PlanetName): boolean {
  const chartSect = chart.isDiurnal ? "Day" : "Night";
  return getResolvedSect(chart, planet) === chartSect;
}
