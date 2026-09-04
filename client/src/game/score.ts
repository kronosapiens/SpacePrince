import { combustionCeiling } from "./combust";
import type { Chart, PlanetName, Polarity, TurnLogEntry } from "./types";

/**
 * Distance is one additive number on the lattice (MECHANICS §12), and each
 * ruler pays for what that planet values: the encounter's scoring rule is keyed
 * on the ruler of the opponent's chart. "Your own chart never scores" is now the
 * Moon's rule, not the game's. The star canon is unchanged — a run's final
 * Distance is still the permanent mark it leaves on the NFT.
 *
 * Scoring runs over normalized beats, which both the resolver's turn log
 * (`logToBeats`) and the projection preview (`projections.ts`) produce, so a
 * previewed score and a resolved one can't drift.
 */

export type ScoredBeat =
  | {
      kind: "hit";
      side: "self" | "other";
      target: PlanetName;
      polarity: Polarity;
      magnitude: number;
      channel: "direct" | "propagated";
    }
  | { kind: "combust"; side: "self" | "other"; target: PlanetName };

export type PolarityCondition = Polarity | "Either" | "Contrary" | "Accord";

export interface ScoringRule {
  polarity: PolarityCondition;
  chart: "other" | "both";
  channel: "all" | "direct" | "combust";
  payout: "magnitude" | "ceiling";
  /** Player-facing phrase completing "Distance is …". */
  label: string;
}

/**
 * Moon and Mars partition effects on the Other by absolute polarity; Mercury
 * and Sun partition them relative to the Other's announced action. Venus and
 * Jupiter score the direct exchange on both charts, while Saturn scores the
 * terminal combust markers on both charts.
 */
export const RULER_RULES: Record<PlanetName, ScoringRule> = {
  Moon:    { polarity: "Testimony",  chart: "other", channel: "all",     payout: "magnitude", label: "testimony on the Other's chart" },
  Mercury: { polarity: "Contrary",   chart: "other", channel: "all",     payout: "magnitude", label: "effects contrary to the Other's action on their chart" },
  Venus:   { polarity: "Testimony",  chart: "both",   channel: "direct",  payout: "magnitude", label: "direct testimony on both charts" },
  Sun:     { polarity: "Accord",     chart: "other", channel: "all",     payout: "magnitude", label: "effects in accord with the Other's action on their chart" },
  Mars:    { polarity: "Affliction", chart: "other", channel: "all",     payout: "magnitude", label: "affliction on the Other's chart" },
  Jupiter: { polarity: "Either",     chart: "both",   channel: "direct",  payout: "magnitude", label: "direct effects on both charts" },
  Saturn:  { polarity: "Affliction", chart: "both",   channel: "combust", payout: "ceiling",   label: "combustion on both charts" },
};

export interface ScoreCharts {
  self: Chart;
  other: Chart;
}

/**
 * One beat's contribution under a ruler. Accord and Contrary compare the
 * beat's resolved polarity with the Other's precommitted action. Applied-effect
 * channels admit hits only; the combust channel admits markers only.
 */
export function beatScore(
  ruler: PlanetName,
  beat: ScoredBeat,
  charts: ScoreCharts,
  opponentAction: Polarity,
): number {
  const rule = RULER_RULES[ruler];
  if (rule.chart === "other" && beat.side !== "other") return 0;
  if (!channelMatches(rule.channel, beat)) return 0;
  const beatPolarity = beat.kind === "combust" ? "Affliction" : beat.polarity;
  if (!polarityMatches(rule.polarity, beatPolarity, opponentAction)) return 0;
  if (rule.payout === "ceiling") {
    if (beat.kind !== "combust") return 0;
    const chart = beat.side === "self" ? charts.self : charts.other;
    return combustionCeiling(chart.planets[beat.target]);
  }
  return beat.kind === "hit" ? beat.magnitude : 0;
}

function channelMatches(channel: ScoringRule["channel"], beat: ScoredBeat): boolean {
  if (channel === "combust") return beat.kind === "combust";
  if (beat.kind === "combust") return false;
  return channel === "all" || beat.channel === channel;
}

function polarityMatches(
  condition: PolarityCondition,
  beatPolarity: Polarity,
  opponentAction: Polarity,
): boolean {
  if (condition === "Either") return true;
  if (condition === "Accord") return beatPolarity === opponentAction;
  if (condition === "Contrary") return beatPolarity !== opponentAction;
  return beatPolarity === condition;
}

export function scoreBeats(
  ruler: PlanetName,
  beats: ScoredBeat[],
  charts: ScoreCharts,
  opponentAction: Polarity,
): number {
  return beats.reduce(
    (sum, beat) => sum + beatScore(ruler, beat, charts, opponentAction),
    0,
  );
}

/**
 * The turn log as beats, in the order the UI replays them
 * (`useCombatAnimation.ts`): phase 1 on the opponent's chart, then phase 2 on
 * yours. Within a phase — the direct hit, the propagation hops with each hop's
 * combust marker, then the struck planet's own combust ripple.
 */
export function logToBeats(entry: TurnLogEntry): ScoredBeat[] {
  const beats: ScoredBeat[] = [];
  const phase = (
    side: "self" | "other",
    target: PlanetName,
    polarity: Polarity,
    magnitude: number,
    combust: boolean,
  ) => {
    beats.push({ kind: "hit", side, target, polarity, magnitude, channel: "direct" });
    for (const p of entry.propagation) {
      if (p.side !== side) continue;
      if (p.note === "Combusts") beats.push({ kind: "combust", side, target: p.target });
      else
        beats.push({
          kind: "hit",
          side,
          target: p.target,
          polarity: p.polarity,
          magnitude: Math.abs(p.delta),
          channel: "propagated",
        });
    }
    if (combust) beats.push({ kind: "combust", side, target });
  };

  phase(
    "other", entry.opponentPlanet, entry.playerValence,
    entry.opponentDelta, entry.opponentCombust ?? false,
  );
  phase(
    "self", entry.playerPlanet, entry.opponentValence,
    entry.playerDelta, entry.playerCombust ?? false,
  );
  return beats;
}

export function turnScore(
  entry: TurnLogEntry,
  ruler: PlanetName,
  charts: ScoreCharts,
): number {
  return scoreBeats(ruler, logToBeats(entry), charts, entry.opponentValence);
}
