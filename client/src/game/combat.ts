import type {
  Chart,
  PlanetName,
  PlanetPlacement,
  PlanetStats,
  Polarity,
} from "./types";
import { ELEMENT_BUFFS, MODALITY_BUFFS } from "./data";
import { RESOLVE_PER_DURABILITY, combustionCeiling } from "./combust";

/** Stat-weighted action draw — `P(afflict) = impact / (impact + witness)`.
 *  Used to precommit the opponent's verb each turn (the player chooses theirs).
 *  No planet has a zero in either stat, so no draw is fully deterministic. */
export function drawValence(stats: PlanetStats, rng: () => number): Polarity {
  const total = stats.impact + stats.witness;
  if (total <= 0) return "Affliction";
  return rng() < stats.impact / total ? "Affliction" : "Testimony";
}

/** The fortune roll (MECHANICS.md §7) — `luck / 120`, i.e. `(luck/2)` sixtieths
 *  (10–60% at effective luck 12–72). The shared chance at map boundaries:
 *  uncombusting a combusted planet, halving a barrage share. Surfaced in the
 *  UI as `Fortune` (fortuneSixtieths below). */
export function fortuneChance(luck: number): number {
  return Math.max(0, Math.min(1, luck / 120));
}

/** The same roll in the unit the player reads it in — sixtieths, the spec's
 *  own statement of it (`(luck/2) / 60`). Luck is a multiple of 12, so this is
 *  always a whole number of sixtieths. */
export function fortuneSixtieths(luck: number): number {
  return Math.max(0, Math.min(60, luck / 2));
}

export function getEffectiveStatsFromPlacement(p: PlanetPlacement): PlanetStats {
  return {
    impact: Math.max(0, p.base.impact + p.buffs.impact),
    witness: Math.max(0, p.base.witness + p.buffs.witness),
    durability: Math.max(0, p.base.durability + p.buffs.durability),
    luck: Math.max(0, p.base.luck + p.buffs.luck),
  };
}

export function getEffectiveStats(chart: Chart, planet: PlanetName): PlanetStats {
  return getEffectiveStatsFromPlacement(chart.planets[planet]);
}

// Testify leads, matching the verb pair in the panel's action buttons.
const STAT_KEYS = ["witness", "impact", "durability", "luck"] as const;

/** The one player-facing name per stat — there is no second, "inner" vocabulary.
 *  These are the words on the buttons, the headline, and the table alike. */
export const STAT_LABEL: Record<keyof PlanetStats, string> = {
  impact: "Afflict",
  witness: "Testify",
  durability: "Resolve",
  luck: "Fortune",
};

/** Display units per point of raw stat. Both transforms are linear, so scaling
 *  every column — rather than just the total — keeps `core + placement = total`
 *  exact while making each row's total the operational number the panel
 *  headlines. Resolve is the combustion ceiling (×5); Fortune is the roll in
 *  sixtieths (÷2). Stats are multiples of 12, so both stay whole. */
const STAT_DISPLAY_SCALE: Record<keyof PlanetStats, number> = {
  impact: 1,
  witness: 1,
  durability: RESOLVE_PER_DURABILITY,
  luck: 1 / 2,
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
  /** Operational read-outs for the closed modal — the same numbers, and the
   *  same units, as the matching row totals. */
  resolve: number; // combustion ceiling
  fortune: number; // the fortune roll, in sixtieths
  afflict: number; // impact
  testify: number; // witness
}

/** The stat table behind the operational numbers (the study drop-down,
 *  spec/design/SCREENS.md §3.6.1). `placement` bundles every sign/position buff
 *  (element + modality + in-sect luck). Every column is already in the stat's
 *  display unit, so core + placement = total and each total is the headline
 *  number — the player never meets a raw stat or has to apply a transform. */
export function deriveStatTable(p: PlanetPlacement): StatTable {
  const element = ELEMENT_BUFFS[p.element];
  const modality = MODALITY_BUFFS[p.modality];
  const sectLuck = p.buffs.luck - element.luck - modality.luck;

  const rows = STAT_KEYS.map((key): StatRow => {
    const scale = STAT_DISPLAY_SCALE[key];
    const core = p.base[key] * scale;
    const placement =
      (element[key] + modality[key] + (key === "luck" ? sectLuck : 0)) * scale;
    return { key, label: STAT_LABEL[key], core, placement, total: core + placement };
  });

  // The resolver's own effective stats, so the panel can't drift from combat.
  const eff = getEffectiveStatsFromPlacement(p);
  return {
    rows,
    resolve: combustionCeiling(p),
    fortune: fortuneSixtieths(eff.luck),
    afflict: eff.impact,
    testify: eff.witness,
  };
}

export function computeDirectExchange(
  playerValence: Polarity,
  opponentValence: Polarity,
  playerStats: PlanetStats,
  opponentStats: PlanetStats,
) {
  const playerToOpponent =
    playerValence === "Testimony" ? playerStats.witness : playerStats.impact;
  const opponentToPlayer =
    opponentValence === "Testimony" ? opponentStats.witness : opponentStats.impact;
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
) {
  const playerStats = getEffectiveStats(playerChart, playerPlanet);
  const opponentStats = getEffectiveStats(opponentChart, opponentPlanet);
  const exchange = computeDirectExchange(playerValence, opponentValence, playerStats, opponentStats);
  const selfDelta = opponentValence === "Testimony" ? -exchange.opponentToPlayer : exchange.opponentToPlayer;
  const otherDelta = playerValence === "Testimony" ? -exchange.playerToOpponent : exchange.playerToOpponent;
  return { playerValence, opponentValence, selfDelta, otherDelta, ...exchange };
}
