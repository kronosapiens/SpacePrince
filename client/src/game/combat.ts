import { ELEMENT_QUALITIES, PLANET_SECT } from "./data";
import type { Chart, ElementType, PlanetName, PlanetPlacement, PlanetStats, Polarity } from "./types";

export function getPolarity(a: ElementType, b: ElementType): Polarity {
  const qualitiesA = ELEMENT_QUALITIES[a];
  const qualitiesB = ELEMENT_QUALITIES[b];
  const shared = qualitiesA.filter((q) => qualitiesB.includes(q)).length;
  if (shared === 2) return "Testimony";
  if (shared === 1) return "Friction";
  return "Affliction";
}

export function getEffectiveStatsFromPlacement(placement: PlanetPlacement): PlanetStats {
  const base = {
    damage: placement.base.damage + placement.buffs.damage,
    healing: placement.base.healing + placement.buffs.healing,
    durability: placement.base.durability + placement.buffs.durability,
    luck: placement.base.luck + placement.buffs.luck,
  };
  return {
    damage: Math.max(0, base.damage),
    healing: Math.max(0, base.healing),
    durability: Math.max(0, base.durability),
    luck: Math.max(0, base.luck),
  };
}

export function getEffectiveStats(chart: Chart, planet: PlanetName): PlanetStats {
  return getEffectiveStatsFromPlacement(chart.planets[planet]);
}

export function computeDirectExchange(polarity: Polarity, playerStats: PlanetStats, opponentStats: PlanetStats) {
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
  opponentCombusted = false
) {
  const playerPlacement = playerChart.planets[playerPlanet];
  const opponentPlacement = opponentChart.planets[opponentPlanet];
  const polarity = getPolarity(playerPlacement.element, opponentPlacement.element);
  const playerStats = playerCombusted
    ? { damage: 0, healing: 0, durability: 0, luck: 0 }
    : getEffectiveStats(playerChart, playerPlanet);
  const opponentStats = opponentCombusted
    ? { damage: 0, healing: 0, durability: 0, luck: 0 }
    : getEffectiveStats(opponentChart, opponentPlanet);
  const exchange = computeDirectExchange(polarity, playerStats, opponentStats);
  const selfDelta = polarity === "Testimony" ? -exchange.opponentToPlayer : exchange.opponentToPlayer;
  const otherDelta = polarity === "Testimony" ? -exchange.playerToOpponent : exchange.playerToOpponent;

  return {
    polarity,
    selfDelta,
    otherDelta,
    ...exchange,
  };
}

function normalizeLongitude(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function resolveMercurySect(mercuryLongitude: number, sunLongitude: number): "Day" | "Night" {
  const delta = normalizeLongitude(mercuryLongitude - sunLongitude);
  return delta > 180 ? "Day" : "Night";
}

export function getResolvedSect(chart: Chart, planet: PlanetName): "Day" | "Night" {
  const base = PLANET_SECT[planet];
  if (base !== "Flexible") return base;

  const mercuryLongitude = chart.planets.Mercury.eclipticLongitude;
  const sunLongitude = chart.planets.Sun.eclipticLongitude;
  if (mercuryLongitude === undefined || sunLongitude === undefined) {
    return chart.isDiurnal ? "Day" : "Night";
  }
  return resolveMercurySect(mercuryLongitude, sunLongitude);
}

export function isInSect(chart: Chart, planet: PlanetName): boolean {
  const chartSect = chart.isDiurnal ? "Day" : "Night";
  return getResolvedSect(chart, planet) === chartSect;
}
