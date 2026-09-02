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

export interface ScoringRule {
  polarity: Polarity | "either";
  chart: "theirs" | "both"; // "theirs" = side "other" only
  channel: "all" | "direct" | "propagated" | "combust";
  /** Player-facing phrase completing "Distance is …". */
  label: string;
}

/**
 * The luminary and the warrior pay for your action (Moon, Mars); the benefic and
 * the malefic pay for the encounter on both charts (Venus, Saturn); the
 * remaining three split by channel — Sun the direct hit, Mercury the hops,
 * Jupiter everything.
 */
export const RULER_RULES: Record<PlanetName, ScoringRule> = {
  Moon:    { polarity: "Testimony",  chart: "theirs", channel: "all",        label: "testimony on their chart" },
  Venus:   { polarity: "Testimony",  chart: "both",   channel: "all",        label: "testimony on both charts" },
  Mars:    { polarity: "Affliction", chart: "theirs", channel: "all",        label: "affliction on their chart" },
  Saturn:  { polarity: "Affliction", chart: "both",   channel: "combust",    label: "combustion on both charts" },
  Sun:     { polarity: "either",     chart: "theirs", channel: "direct",     label: "direct hits on their chart" },
  Mercury: { polarity: "either",     chart: "theirs", channel: "propagated", label: "propagation on their chart" },
  Jupiter: { polarity: "either",     chart: "theirs", channel: "all",        label: "everything on their chart" },
};

export interface ScoreCharts {
  self: Chart;
  other: Chart;
}

/**
 * One beat's contribution under a ruler. A hit pays its magnitude when the
 * rule's polarity, chart and channel admit it; a combust pays the dying
 * planet's ceiling. The two are exclusive: channel "combust" admits no hits,
 * and every other channel admits no combusts.
 */
export function beatScore(ruler: PlanetName, beat: ScoredBeat, charts: ScoreCharts): number {
  const rule = RULER_RULES[ruler];
  if (rule.chart === "theirs" && beat.side !== "other") return 0;
  if (beat.kind === "combust") {
    if (rule.channel !== "combust") return 0;
    const chart = beat.side === "self" ? charts.self : charts.other;
    return combustionCeiling(chart.planets[beat.target]);
  }
  if (rule.channel === "combust") return 0;
  if (rule.polarity !== "either" && beat.polarity !== rule.polarity) return 0;
  if (rule.channel !== "all" && beat.channel !== rule.channel) return 0;
  return beat.magnitude;
}

export function scoreBeats(
  ruler: PlanetName,
  beats: ScoredBeat[],
  charts: ScoreCharts,
): number {
  return beats.reduce((sum, beat) => sum + beatScore(ruler, beat, charts), 0);
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
  return scoreBeats(ruler, logToBeats(entry), charts);
}
