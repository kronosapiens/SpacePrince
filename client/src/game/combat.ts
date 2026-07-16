import type {
  Chart,
  PlanetName,
  PlanetPlacement,
  PlanetStats,
  Polarity,
} from "./types";
import { ELEMENT_BUFFS, MODALITY_BUFFS } from "./data";
import { combustionCeiling } from "./combust";

/** Stat-weighted action draw — `P(afflict) = damage / (damage + healing)`.
 *  Used to precommit the opponent's verb each turn (the player chooses theirs).
 *  No planet has a zero in either stat, so no draw is fully deterministic. */
export function drawValence(stats: PlanetStats, rng: () => number): Polarity {
  const total = stats.damage + stats.healing;
  if (total <= 0) return "Affliction";
  return rng() < stats.damage / total ? "Affliction" : "Testimony";
}

/** The fortune roll (MECHANICS.md §7) — `luck × 0.05`. The shared chance at
 *  map boundaries: uncombusting a combusted planet, halving a barrage share.
 *  Surfaced in the UI as `Fortune` (fortunePct below). */
export function fortuneChance(luck: number): number {
  return Math.max(0, Math.min(1, luck * 0.05));
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

const STAT_KEYS = ["damage", "healing", "durability", "luck"] as const;
const STAT_LABEL: Record<keyof PlanetStats, string> = {
  damage: "Dmg",
  healing: "Heal",
  durability: "Dur",
  luck: "Luck",
};

export interface StatRow {
  key: keyof PlanetStats;
  label: string;
  /** Innate base stat. */
  core: number;
  /** Sign-derived buffs: element + modality, plus in-sect luck. */
  placement: number;
  total: number;
}

export interface StatTable {
  rows: StatRow[];
  /** Operational read-outs for the closed modal, derived from the totals. */
  durability: number; // combustion ceiling = HP
  fortunePct: number; // the fortune roll as a percentage (luck total × 5, §7)
  afflict: number; // damage total
  testify: number; // healing total
}

/** The underlying-stat table behind the operational numbers (the study drop-down,
 *  spec/design/SCREENS.md §3.6.1). `placement` bundles every sign/position buff
 *  (element + modality + in-sect luck). Core + placement = total. */
export function deriveStatTable(p: PlanetPlacement): StatTable {
  const element = ELEMENT_BUFFS[p.element];
  const modality = MODALITY_BUFFS[p.modality];
  const sectLuck = p.buffs.luck - element.luck - modality.luck;

  const rows = STAT_KEYS.map((key): StatRow => {
    const core = p.base[key];
    const placement = element[key] + modality[key] + (key === "luck" ? sectLuck : 0);
    return { key, label: STAT_LABEL[key], core, placement, total: core + placement };
  });

  const total = (k: keyof PlanetStats) => rows.find((r) => r.key === k)!.total;
  return {
    rows,
    durability: combustionCeiling(p),
    fortunePct: Math.round(fortuneChance(total("luck")) * 100),
    afflict: Math.max(0, total("damage")),
    testify: Math.max(0, total("healing")),
  };
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
