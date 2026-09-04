import { describe, expect, it } from "vitest";
import { beginRun } from "@/game/run";
import { beginCombatEncounter, encounterRuler } from "@/game/encounter";
import { getAspects } from "@/game/aspects";
import { combustionCeiling } from "@/game/combust";
import { computeProjectedEffects } from "@/game/projections";
import { PLANETS } from "@/game/data";
import { logToBeats, scoreBeats, turnScore, type ScoreCharts } from "@/game/score";
import { resolveTurn } from "@/game/turn";
import { createStubPrince } from "./fixtures";
import type { CombatEncounter, PlanetName, Polarity, Run } from "@/game/types";

function setup(opponentSeed: number) {
  const prince = createStubPrince({ seed: 7 });
  const base = beginRun(42);
  const enc = beginCombatEncounter({
    run: base,
    opponentSeed,
    lifetimeEncounterCount: prince.numEncounters,
  });
  const run: Run = { ...base, encounter: enc };
  return { prince, run, enc };
}

/** Resolve the turn and project it from the same pre-turn inputs, then compare
 *  the two beat lists under every ruler. Rolls are irrelevant — resolution is
 *  deterministic (§7) and the rng only feeds the next turn's draw. */
function compare(
  opponentSeed: number,
  playerValence: Polarity,
  prepare?: (ctx: { run: Run; enc: CombatEncounter; playerPlanet: PlanetName }) => void,
) {
  const { prince, run, enc } = setup(opponentSeed);
  // A planet with a web, so the hops are exercised on the player's side too.
  const playerPlanet = getAspects(prince.chart)[0]?.from ?? "Moon";
  prepare?.({ run, enc, playerPlanet });
  const opponentPlanet = enc.sequence[enc.turnIndex]!;
  const opponentAction = enc.opponentActions[enc.turnIndex]!;
  const charts: ScoreCharts = { self: prince.chart, other: enc.opponentChart };

  const projection = computeProjectedEffects({
    playerChart: prince.chart,
    opponentChart: enc.opponentChart,
    playerPlanet,
    opponentPlanet,
    playerValence,
    opponentValence: opponentAction,
    playerState: run.state,
    opponentState: enc.opponentState,
    playerAspects: getAspects(prince.chart),
    opponentAspects: getAspects(enc.opponentChart),
    roster: enc.roster,
  });
  const result = resolveTurn(run, prince.chart, playerPlanet, playerValence, () => 0)!;

  for (const ruler of PLANETS) {
    expect(
      scoreBeats(ruler, projection.beats, charts, opponentAction),
      `${ruler} @ seed ${opponentSeed}/${playerValence}`,
    ).toBe(scoreBeats(ruler, logToBeats(result.log), charts, opponentAction));
  }

  // Stronger than the score alone: the two lists are the same beats, in the
  // same order, so no rule can key on something only one side produces.
  expect(projection.beats).toEqual(logToBeats(result.log));

  // Non-vacuity: every turn lands a direct hit on their chart, which Jupiter's
  // rule always admits — so the parity above is never 0 === 0 throughout.
  expect(scoreBeats("Jupiter", projection.beats, charts, opponentAction)).toBeGreaterThan(0);

  const ruler = encounterRuler(enc);
  expect(result.log.turnScore).toBe(turnScore(result.log, ruler, charts));
  expect(result.run.distance - run.distance).toBe(result.log.turnScore);
  return { projection, result, charts, playerPlanet, opponentPlanet, ruler };
}

const SEEDS = [11, 42, 99, 123];
const VALENCES: Polarity[] = ["Testimony", "Affliction"];

describe("preview and outcome score the same beats", () => {
  for (const seed of SEEDS) {
    for (const valence of VALENCES) {
      it(`seed ${seed}, ${valence}`, () => {
        compare(seed, valence);
      });
    }
  }

  it("a fatal blow pays only the remainder, in preview as in outcome", () => {
    // Park the opponent's actor one point under its ceiling: the blow combusts
    // it, preempting the reply, and the projected magnitude must be that one
    // point — not the planet's full swing.
    const { projection, result } = compare(99, "Affliction", ({ enc }) => {
      const active = enc.sequence[enc.turnIndex]!;
      enc.opponentState[active].affliction =
        combustionCeiling(enc.opponentChart.planets[active]) - 1;
      enc.opponentActions[enc.turnIndex] = "Affliction";
    });
    const active = result.log.opponentPlanet;
    expect(result.log.opponentCombust).toBe(true);
    expect(result.log.opponentDelta).toBe(1);
    expect(projection.other[active]!.delta).toBe(1);
    expect(projection.beats).toContainEqual({ kind: "combust", side: "other", target: active });
  });

  it("a catcher combusted by the incoming blow pays its ceiling under Saturn", () => {
    const { projection, result, charts, playerPlanet } = compare(11, "Testimony", ({ run, enc, playerPlanet }) => {
      // Your planet catches the reply one point under its ceiling and goes out.
      // Testify, so nothing on their side dies to preempt it.
      run.state[playerPlanet].affliction =
        combustionCeiling(createStubPrince({ seed: 7 }).chart.planets[playerPlanet]) - 1;
      enc.opponentActions[enc.turnIndex] = "Affliction";
    });
    expect(result.log.playerCombust).toBe(true);
    expect(projection.beats).toContainEqual({ kind: "combust", side: "self", target: playerPlanet });
    // Saturn is the one rule that pays for it — and it pays the ceiling.
    expect(
      scoreBeats("Saturn", projection.beats, charts, result.log.opponentValence),
    ).toBeGreaterThanOrEqual(
      combustionCeiling(charts.self.planets[playerPlanet]),
    );
    expect(scoreBeats("Moon", projection.beats, charts, result.log.opponentValence)).toBe(
      scoreBeats("Moon", logToBeats(result.log), charts, result.log.opponentValence),
    );
  });
});

describe("the ruler rotates across encounters", () => {
  it("different opponent seeds give different scoring rules", () => {
    const seen = new Set<PlanetName>();
    for (const seed of [11, 42, 99, 123, 7, 5, 3, 2]) {
      seen.add(encounterRuler(setup(seed).enc));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
