import { combustionCeiling, isCombusted } from "./combust";
import type { Chart, PlanetName, Polarity, SideState, TurnLogEntry } from "./types";

/**
 * Light is one additive number on the lattice (MECHANICS §12), and each
 * ruler counts what that planet values: the encounter's scoring rule is keyed
 * on the ruler of the opponent's chart. Only effects on the Other's chart
 * generate Light; nothing on your own chart counts under any ruler. The star
 * canon is unchanged — a run's final Light is still the permanent mark it
 * leaves on the NFT.
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
    }
  | { kind: "combust"; side: "self" | "other"; target: PlanetName };

export type PolarityCondition = Polarity | "Either" | "Contrary" | "Accord";

export interface ScoringRule {
  polarity: PolarityCondition;
  /** `magnitude` counts hits at what applied; `ceiling` counts combust markers
   *  at the planet's full Resolve. */
  payout: "magnitude" | "ceiling";
  /** Only your lit planet with the least (or most) Resolve left generates
   *  Light, and its hits count double. */
  actor?: "least" | "most";
  /** Player-facing phrase completing "Gain Light from …". */
  label: string;
}

/**
 * Venus and Mars partition hits on the Other by absolute polarity; Jupiter and
 * Mercury partition them relative to the Other's announced action. The Moon
 * and the Sun count hits of either polarity, by which of your planets acts.
 * Saturn counts the Other's planets going dark.
 */
export const RULER_RULES: Record<PlanetName, ScoringRule> = {
  Moon:    { polarity: "Either",     payout: "magnitude", actor: "least", label: "tension eased on the Other's chart" },
  Mercury: { polarity: "Contrary",   payout: "magnitude",                 label: "effects contrary to the Other's action" },
  Venus:   { polarity: "Testimony",  payout: "magnitude",                 label: "tension eased directly on both charts" },
  Sun:     { polarity: "Either",     payout: "magnitude", actor: "most",  label: "effects in accord with the Other's action" },
  Mars:    { polarity: "Affliction", payout: "magnitude",                 label: "tension created on the Other's chart" },
  Jupiter: { polarity: "Accord",     payout: "magnitude",                 label: "direct effects on both charts" },
  Saturn:  { polarity: "Affliction", payout: "ceiling",                   label: "planets going dark on both charts" },
};

/** What the scorer reads beside the beats, all of it as it stood before the
 *  turn resolved. */
export interface ScoreTurn {
  /** The player's run chart, for the Resolve ceilings of their planets. */
  self: Chart;
  other: Chart;
  /** The player's affliction before the turn. */
  selfState: SideState;
  /** The fielded planets; only the lit ones are compared for least and most. */
  roster: PlanetName[];
  playerPlanet: PlanetName;
  /** The Other's announced action. */
  opponentAction: Polarity;
}

/**
 * What one beat generates under a ruler. Only beats on the Other's chart
 * count, each at the polarity it landed with. Accord and Contrary compare that
 * polarity with the Other's announced action.
 */
export function beatScore(ruler: PlanetName, beat: ScoredBeat, turn: ScoreTurn): number {
  if (beat.side !== "other") return 0;
  const rule = RULER_RULES[ruler];
  const beatPolarity = beat.kind === "combust" ? "Affliction" : beat.polarity;
  if (!polarityMatches(rule.polarity, beatPolarity, turn.opponentAction)) return 0;
  if (rule.payout === "ceiling") {
    return beat.kind === "combust" ? combustionCeiling(turn.other.planets[beat.target]) : 0;
  }
  if (beat.kind !== "hit") return 0;
  if (!rule.actor) return beat.magnitude;
  return actorMatches(rule.actor, turn) ? 2 * beat.magnitude : 0;
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

/** Whether the acting planet has the least (or most) Resolve left of the
 *  player's lit planets. Planets tied for it all match. */
function actorMatches(actor: "least" | "most", turn: ScoreTurn): boolean {
  const left = (p: PlanetName) =>
    combustionCeiling(turn.self.planets[p]) - turn.selfState[p].affliction;
  const lit = turn.roster.filter((p) => !isCombusted(turn.self.planets[p], turn.selfState[p]));
  const bound = (actor === "least" ? Math.min : Math.max)(...lit.map(left));
  return left(turn.playerPlanet) === bound;
}

export function scoreBeats(ruler: PlanetName, beats: ScoredBeat[], turn: ScoreTurn): number {
  return beats.reduce((sum, beat) => sum + beatScore(ruler, beat, turn), 0);
}

/**
 * The turn log as beats, in the order the UI replays them
 * (`useRelationalAnimation.ts`): phase 1 on the opponent's chart, then phase 2 on
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
    beats.push({ kind: "hit", side, target, polarity, magnitude });
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

/** The Light a resolved turn generates. `before` is the player's side as it
 *  stood before the turn; the acting planet and the Other's action come from
 *  the log entry. */
export function turnLight(
  entry: TurnLogEntry,
  ruler: PlanetName,
  before: Omit<ScoreTurn, "playerPlanet" | "opponentAction">,
): number {
  return scoreBeats(ruler, logToBeats(entry), {
    ...before,
    playerPlanet: entry.playerPlanet,
    opponentAction: entry.opponentValence,
  });
}
