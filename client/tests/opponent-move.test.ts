import { describe, expect, it, vi } from "vitest";
import { blankSideState, seededChart } from "@/game/chart";
import { remainingResolve } from "@/game/combust";
import { beginRelationalEncounter } from "@/game/encounter";
import { drawOpponentMove, opponentMoveOdds } from "@/game/opponent-move";
import { drawValence, getEffectiveStatsFromPlacement } from "@/game/relational";
import { beginRun } from "@/game/run";
import { resolveTurn } from "@/game/turn";
import type { Chart, PlanetName, Polarity, Run, SideState, SignName } from "@/game/types";
import { createStubPrince } from "./fixtures";

const POOL: PlanetName[] = ["Moon", "Mercury", "Venus"];

function setStats(chart: Chart, planet: PlanetName, affliction: number, testimony: number, resolve: number) {
  chart.planets[planet].base = { affliction, testimony, resolve, luck: 12 };
  chart.planets[planet].buffs = { affliction: 0, testimony: 0, resolve: 0, luck: 0 };
}

/** Three lit planets that each measure ranks differently. Testimony: Moon 36,
 *  Mercury 24, Venus 12. Affliction: Venus 36, Mercury 24, Moon 12. Remaining
 *  Resolve: Mercury 120, Venus 84, Moon 48, though the Moon has the most Resolve. */
function fixture() {
  const chart = seededChart(7);
  const state = blankSideState();
  setStats(chart, "Moon", 12, 36, 144);
  setStats(chart, "Mercury", 24, 24, 120);
  setStats(chart, "Venus", 36, 12, 108);
  state.Moon.tension = 96;
  state.Venus.tension = 24;
  return { chart, state };
}

/** An rng that returns these rolls in order. */
function rolls(...values: number[]) {
  const rng = vi.fn<() => number>();
  for (const value of values) rng.mockReturnValueOnce(value);
  return rng;
}

/** The roll that picks `planet` from `pool`. */
const pick = (planet: PlanetName, pool = POOL) => (pool.indexOf(planet) + 0.5) / pool.length;

describe("the opponent's move", () => {
  it.each([
    ["Venus", "Moon", "Venus"],
    ["Mars", "Venus", "Moon"],
    ["Sun", "Mercury", "Moon"],
    ["Moon", "Moon", "Mercury"],
    ["Saturn", "Venus", "Mercury"],
  ] as const)("under %s keeps %s over %s, whichever is picked first", (ruler, favoured, other) => {
    const { chart, state } = fixture();
    // One action draw follows the two picks, on the kept planet.
    const action = drawValence(getEffectiveStatsFromPlacement(chart.planets[favoured]), () => 0.4);
    for (const [first, second] of [[favoured, other], [other, favoured]] as const) {
      const rng = rolls(pick(first), pick(second), 0.4);
      expect(drawOpponentMove(chart, state, POOL, ruler, rng, "Testimony")).toEqual({ planet: favoured, action });
      expect(rng).toHaveBeenCalledTimes(3);
    }
  });

  it("keeps the first picked on a tie", () => {
    const { chart, state } = fixture();
    // Mercury now matches the Moon on every measure.
    setStats(chart, "Mercury", 12, 36, 144);
    state.Mercury.tension = 96;
    for (const ruler of ["Venus", "Mars", "Sun", "Moon", "Saturn"] as const) {
      for (const [first, second] of [["Moon", "Mercury"], ["Mercury", "Moon"]] as const) {
        expect(drawOpponentMove(chart, state, POOL, ruler, rolls(pick(first), pick(second), 0)).planet).toBe(first);
      }
    }
  });

  it.each([
    ["Testimony", "Affliction", "Affliction", "Affliction"],
    ["Testimony", "Affliction", "Testimony", "Testimony"],
    ["Testimony", "Testimony", "Affliction", "Testimony"],
    ["Affliction", "Testimony", "Testimony", "Testimony"],
    ["Affliction", "Testimony", "Affliction", "Affliction"],
    ["Affliction", "Affliction", "Testimony", "Affliction"],
  ] as const)("after the player's %s, draws of %s then %s announce %s under Jupiter and Mercury", (last, first, second, announced) => {
    const { chart, state } = fixture();
    // Mercury afflicts half the time: a roll under 0.5 draws Affliction.
    const roll = { Affliction: 0.25, Testimony: 0.75 };
    for (const ruler of ["Jupiter", "Mercury"] as const) {
      const rng = rolls(pick("Mercury"), roll[first], roll[second]);
      expect(drawOpponentMove(chart, state, POOL, ruler, rng, last)).toEqual({ planet: "Mercury", action: announced });
      expect(rng).toHaveBeenCalledTimes(3);
    }
  });

  it.each(["Jupiter", "Mercury"] as const)("draws an encounter's first move once under %s", (ruler) => {
    const { chart, state } = fixture();
    for (const [roll, action] of [[0.25, "Affliction"], [0.75, "Testimony"]] as const) {
      const rng = rolls(pick("Mercury"), roll);
      expect(drawOpponentMove(chart, state, POOL, ruler, rng)).toEqual({ planet: "Mercury", action });
      expect(rng).toHaveBeenCalledTimes(2);
    }
  });

  it("gives the exact chance of every move, summing to one", () => {
    const { chart, state } = fixture();
    // In POOL order, Affliction then Testimony for each planet.
    const expectOdds = (ruler: PlanetName, last: Polarity | undefined, expected: number[]) => {
      const odds = opponentMoveOdds(chart, state, POOL, ruler, last);
      expect(odds.map(({ planet, action }) => [planet, action]))
        .toEqual(POOL.flatMap((planet) => [[planet, "Affliction"], [planet, "Testimony"]]));
      odds.forEach(({ probability }, i) => expect(probability).toBeCloseTo(expected[i]!, 12));
      expect(odds.reduce((sum, { probability }) => sum + probability, 0)).toBeCloseTo(1, 12);
    };
    // The Sun keeps more remaining Resolve: Mercury in 5 of the 9 pairs, Venus
    // in 3, the Moon in 1. One action draw follows, whatever the player last did.
    expectOdds("Sun", "Testimony", [1 / 36, 3 / 36, 5 / 18, 5 / 18, 9 / 36, 3 / 36]);
    // The Moon keeps less, so the planets' chances reverse.
    expectOdds("Moon", undefined, [5 / 36, 15 / 36, 1 / 18, 1 / 18, 9 / 36, 3 / 36]);
    // Jupiter picks evenly; after a Testimony a planet afflicts only by drawing it twice.
    expectOdds("Jupiter", "Testimony", [1 / 48, 15 / 48, 4 / 48, 12 / 48, 9 / 48, 7 / 48]);
    // A first move has no last action: one draw.
    expectOdds("Mercury", undefined, [1 / 12, 3 / 12, 2 / 12, 2 / 12, 3 / 12, 1 / 12]);
  });
});

describe("the next move at turn resolution", () => {
  /** A two-turn encounter of two planets with even stats and no aspect between
   *  them, opening on the opponent's afflicting Moon. */
  function turn(ascendantSign: SignName) {
    const prince = createStubPrince();
    const run: Run = { ...beginRun(prince.chart, 42, prince.numRelationalEncounters), mapsCompleted: 1 };
    const encounter = beginRelationalEncounter({ run, opponentSeed: 99, lifetimeRelationalEncounterCount: prince.numRelationalEncounters });
    const other = encounter.opponentChart;
    other.ascendantSign = ascendantSign;
    other.planets.Moon.sign = "Aries";
    other.planets.Mercury.sign = "Taurus";
    for (const chart of [prince.chart, other]) for (const planet of ["Moon", "Mercury"] as const) setStats(chart, planet, 24, 24, 120);
    encounter.roster = ["Moon", "Mercury"];
    encounter.sequence = ["Moon", "Moon"];
    encounter.opponentActions = ["Affliction", "Affliction"];
    encounter.opponentState.Moon.tension = 0;
    encounter.opponentState.Mercury.tension = 12;
    return { prince, run: { ...run, encounter }, encounter };
  }
  const roster: PlanetName[] = ["Moon", "Mercury"];
  const remaining = (chart: Chart, state: SideState, planet: PlanetName) => remainingResolve(chart.planets[planet], state[planet]);

  it("is drawn by the ruler's rule from the state the turn leaves and the action just used", () => {
    // The Sun rules. The Moon has more remaining Resolve until the player's
    // Affliction lands on it, so Mercury is kept though the Moon is picked first.
    const sun = turn("Leo");
    const before = sun.encounter.opponentState;
    expect(remaining(sun.encounter.opponentChart, before, "Moon")).toBeGreaterThan(remaining(sun.encounter.opponentChart, before, "Mercury"));
    const afflicted = resolveTurn(sun.run, sun.prince.chart, "Moon", "Affliction", rolls(pick("Moon", roster), pick("Mercury", roster), 0))!.encounter;
    expect(remaining(afflicted.opponentChart, afflicted.opponentState, "Moon")).toBeLessThan(remaining(afflicted.opponentChart, afflicted.opponentState, "Mercury"));
    expect([afflicted.sequence[1], afflicted.opponentActions[1]]).toEqual(["Mercury", "Affliction"]);

    // Jupiter rules. The player testified against an afflicting opponent, and
    // the second of two draws gives Testimony.
    const jupiter = turn("Sagittarius");
    const rng = rolls(pick("Mercury", roster), 0.25, 0.75);
    const testified = resolveTurn(jupiter.run, jupiter.prince.chart, "Moon", "Testimony", rng)!.encounter;
    expect([testified.sequence[1], testified.opponentActions[1]]).toEqual(["Mercury", "Testimony"]);
    expect(rng).toHaveBeenCalledTimes(3);
  });
});
