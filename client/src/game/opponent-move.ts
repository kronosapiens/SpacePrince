import { remainingResolve } from "./combust";
import { afflictionChance, drawValence, getEffectiveStatsFromPlacement } from "./relational";
import { pickWeighted } from "./rng";
import type { Chart, PlanetName, Polarity, SideState } from "./types";

/**
 * The opponent's move (MECHANICS §11.4). Under every ruler the move is drawn
 * twice, and the ruler says which of the two it keeps. Either two planets are
 * picked and the one with more (or less) of a measure acts, or one planet is
 * picked and its action is drawn twice.
 */
export type OpponentMoveRule =
  | { twice: "planet"; keep: "more" | "less"; measure: "testimony" | "affliction" | "remaining" }
  | { twice: "action" };

export const RULER_MOVES: Record<PlanetName, OpponentMoveRule> = {
  Moon:    { twice: "planet", keep: "less", measure: "remaining" },
  Mercury: { twice: "action" },
  Venus:   { twice: "planet", keep: "more", measure: "testimony" },
  Sun:     { twice: "planet", keep: "more", measure: "remaining" },
  Mars:    { twice: "planet", keep: "more", measure: "affliction" },
  Jupiter: { twice: "action" },
  Saturn:  { twice: "planet", keep: "less", measure: "remaining" },
};

export interface OpponentMove {
  planet: PlanetName;
  action: Polarity;
}

/** Which of two picked planets the ruler keeps. A tie keeps the first. */
function keptPlanet(
  rule: Extract<OpponentMoveRule, { twice: "planet" }>,
  chart: Chart,
  state: SideState,
  first: PlanetName,
  second: PlanetName,
): PlanetName {
  const measure = (p: PlanetName) =>
    rule.measure === "remaining"
      ? remainingResolve(chart.planets[p], state[p])
      : getEffectiveStatsFromPlacement(chart.planets[p])[rule.measure];
  const [a, b] = [measure(first), measure(second)];
  return (rule.keep === "more" ? b > a : b < a) ? second : first;
}

/**
 * Draw the opponent's move from `pool`, its lit fielded planets, reading
 * `state` as it stands. The planet picks come first, then the action draws.
 * Where the action is drawn twice, the action the player last used is
 * announced if either draw gives it; an encounter's first move has no last
 * action, so it is a single draw.
 */
export function drawOpponentMove(
  chart: Chart,
  state: SideState,
  pool: PlanetName[],
  ruler: PlanetName,
  rng: () => number,
  lastPlayerAction?: Polarity,
): OpponentMove {
  const rule = RULER_MOVES[ruler];
  const first = pickWeighted(pool, rng);
  const planet = rule.twice === "planet"
    ? keptPlanet(rule, chart, state, first, pickWeighted(pool, rng))
    : first;
  const stats = getEffectiveStatsFromPlacement(chart.planets[planet]);
  const action = drawValence(stats, rng);
  if (rule.twice === "planet" || !lastPlayerAction) return { planet, action };
  // Two draws that both miss the last action agree on the other one.
  const second = drawValence(stats, rng);
  return { planet, action: action === lastPlayerAction ? action : second };
}

/** The exact chance of each move `drawOpponentMove` can return for the same inputs. */
export function opponentMoveOdds(
  chart: Chart,
  state: SideState,
  pool: PlanetName[],
  ruler: PlanetName,
  lastPlayerAction?: Polarity,
): (OpponentMove & { probability: number })[] {
  const rule = RULER_MOVES[ruler];
  // The planet that acts for each of the n × n equally likely ordered pairs of
  // picks; a single pick is its first.
  const kept = pool.flatMap((first) => pool.map((second) =>
    rule.twice === "planet" ? keptPlanet(rule, chart, state, first, second) : first));
  return pool.flatMap((planet) => {
    const share = kept.filter((p) => p === planet).length / kept.length;
    const afflict = afflictionChance(getEffectiveStatsFromPlacement(chart.planets[planet]));
    const single = (action: Polarity) => (action === "Affliction" ? afflict : 1 - afflict);
    // The last action needs either of two draws; the other needs both.
    const chance = (action: Polarity) =>
      rule.twice === "planet" || !lastPlayerAction ? single(action)
      : action === lastPlayerAction ? 1 - (1 - single(action)) ** 2
      : single(action) ** 2;
    return (["Affliction", "Testimony"] as Polarity[]).map((action) =>
      ({ planet, action, probability: share * chance(action) }));
  });
}
