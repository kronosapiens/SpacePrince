import type {
  Chart,
  PlanetName,
  PlanetPlacement,
  PlanetStats,
  Polarity,
} from "./types";

/** Stat-weighted action draw — `P(afflict) = damage / (damage + healing)`.
 *  Used to precommit the opponent's verb each turn (the player chooses theirs).
 *  No planet has a zero in either stat, so no draw is fully deterministic. */
export function drawValence(stats: PlanetStats, rng: () => number): Polarity {
  const total = stats.damage + stats.healing;
  if (total <= 0) return "Affliction";
  return rng() < stats.damage / total ? "Affliction" : "Testimony";
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
  playerValence: Polarity,
  opponentValence: Polarity,
  playerStats: PlanetStats,
  opponentStats: PlanetStats,
) {
  const playerToOpponent =
    playerValence === "Testimony" ? playerStats.healing : playerStats.damage;
  const opponentToPlayer =
    opponentValence === "Testimony" ? opponentStats.healing : opponentStats.damage;
  return {
    playerToOpponent: Math.max(0, playerToOpponent),
    opponentToPlayer: Math.max(0, opponentToPlayer),
  };
}

export function getProjectedPair(
  playerChart: Chart,
  opponentChart: Chart,
  playerPlanet: PlanetName,
  opponentPlanet: PlanetName,
  playerValence: Polarity,
  opponentValence: Polarity,
  playerCombusted = false,
  opponentCombusted = false,
) {
  const playerStats = playerCombusted ? ZERO_STATS : getEffectiveStats(playerChart, playerPlanet);
  const opponentStats = opponentCombusted ? ZERO_STATS : getEffectiveStats(opponentChart, opponentPlanet);
  const exchange = computeDirectExchange(playerValence, opponentValence, playerStats, opponentStats);
  const selfDelta = opponentValence === "Testimony" ? -exchange.opponentToPlayer : exchange.opponentToPlayer;
  const otherDelta = playerValence === "Testimony" ? -exchange.playerToOpponent : exchange.playerToOpponent;
  return { playerValence, opponentValence, selfDelta, otherDelta, ...exchange };
}
