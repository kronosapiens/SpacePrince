import { describe, expect, it } from "vitest";
import { beginRun } from "@/game/run";
import { beginRelationalEncounter, encounterRuler } from "@/game/encounter";
import { getAspects } from "@/game/aspects";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
import { computeProjectedEffects } from "@/game/projections";
import { PLANETS } from "@/game/data";
import { logToBeats, scoreBeats, turnLight, type ScoreTurn } from "@/game/score";
import { resolveTurn } from "@/game/turn";
import { createStubPrince } from "./fixtures";
import type { RelationalEncounter, PlanetName, Polarity, Run } from "@/game/types";

function setup(opponentSeed: number) {
  const prince = createStubPrince({ seed: 7 });
  const base = beginRun(prince.chart, 42);
  const enc = beginRelationalEncounter({
    run: base,
    opponentSeed,
    lifetimeRelationalEncounterCount: prince.numRelationalEncounters,
  });
  // Give Testimony something to resolve even when opening Fortune blocks the draw.
  enc.opponentState[enc.sequence[0]!].tension = 12;
  const run: Run = { ...base, encounter: enc };
  return { prince, run, enc };
}

/** Resolve the turn and project it from the same pre-turn inputs, then compare
 *  the two beat lists under every ruler. Rolls are irrelevant — resolution is
 *  deterministic (§7) and the rng only feeds the next turn's draw. */
function compare(
  opponentSeed: number,
  playerValence: Polarity,
  prepare?: (ctx: { run: Run; enc: RelationalEncounter; playerPlanet: PlanetName }) => void,
) {
  const { prince, run, enc } = setup(opponentSeed);
  // A planet with a web, so the hops are exercised on the player's side too.
  const playerPlanet = getAspects(prince.chart)[0]?.from ?? "Moon";
  prepare?.({ run, enc, playerPlanet });
  const opponentPlanet = enc.sequence[enc.turnIndex]!;
  const opponentAction = enc.opponentActions[enc.turnIndex]!;
  // `resolveTurn` clones the player's state, so `run.state` stays the pre-turn read.
  const before = {
    self: prince.chart, other: enc.opponentChart, selfState: run.state, roster: enc.roster,
  };
  const turn: ScoreTurn = { ...before, playerPlanet, opponentAction };

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
      scoreBeats(ruler, projection.beats, turn),
      `${ruler} @ seed ${opponentSeed}/${playerValence}`,
    ).toBe(scoreBeats(ruler, logToBeats(result.log), turn));
  }

  // Stronger than the score alone: the two lists are the same beats, in the
  // same order, so no rule can key on something only one side produces.
  expect(projection.beats).toEqual(logToBeats(result.log));

  // Non-vacuity: every turn lands a direct hit on their chart, and Venus and
  // Mars between them admit every hit there — so the parity above is never
  // 0 === 0 throughout.
  expect(
    scoreBeats("Venus", projection.beats, turn) + scoreBeats("Mars", projection.beats, turn),
  ).toBeGreaterThan(0);

  const ruler = encounterRuler(enc);
  expect(result.log.lightGain).toBe(turnLight(result.log, ruler, before));
  expect(result.run.light - run.light).toBe(result.log.lightGain);
  return { projection, result, turn, playerPlanet, opponentPlanet, ruler };
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
    // Park the opponent's actor one point under its Resolve: the blow combusts
    // it, preempting the reply, and the projected magnitude must be that one
    // point — not the planet's full swing.
    const { projection, result, turn } = compare(99, "Affliction", ({ enc }) => {
      const active = enc.sequence[enc.turnIndex]!;
      enc.opponentState[active].tension =
        getEffectiveStatsFromPlacement(enc.opponentChart.planets[active]).resolve - 1;
      enc.opponentActions[enc.turnIndex] = "Affliction";
    });
    const active = result.log.opponentPlanet;
    expect(result.log.opponentCombust).toBe(true);
    expect(result.log.opponentDelta).toBe(1);
    expect(projection.other[active]!.delta).toBe(1);
    expect(projection.beats).toContainEqual({ kind: "combust", side: "other", target: active });
    // Saturn counts the planet that went dark at its full Resolve, not the remainder.
    expect(scoreBeats("Saturn", projection.beats, turn)).toBe(
      getEffectiveStatsFromPlacement(turn.other.planets[active]).resolve,
    );
  });

  it("your own planet going dark generates nothing under Saturn", () => {
    const { projection, result, turn, playerPlanet } = compare(11, "Testimony", ({ run, enc, playerPlanet }) => {
      // Your planet catches the reply one point under its Resolve and goes out.
      // Testify, so nothing on their side dies to preempt it.
      run.state[playerPlanet].tension =
        getEffectiveStatsFromPlacement(createStubPrince({ seed: 7 }).chart.planets[playerPlanet]).resolve - 1;
      enc.opponentActions[enc.turnIndex] = "Affliction";
    });
    expect(result.log.playerCombust).toBe(true);
    expect(projection.beats).toContainEqual({ kind: "combust", side: "self", target: playerPlanet });
    // Only the Other's planets going dark count, and none did.
    expect(scoreBeats("Saturn", projection.beats, turn)).toBe(0);
  });

  it("the Sun reads the remaining Resolve before the turn, in outcome as in preview", () => {
    // Your acting planet starts one point ahead of every other lit planet, and
    // the Other's Affliction drops it behind them. It had the most when it
    // acted, so its hits on the Other still count double.
    const { projection, result, turn, ruler } = compare(42, "Affliction", ({ run, enc, playerPlanet }) => {
      enc.opponentChart.ascendantSign = "Leo";
      enc.opponentActions[enc.turnIndex] = "Affliction";
      const chart = createStubPrince({ seed: 7 }).chart;
      for (const p of enc.roster) {
        run.state[p].tension =
          getEffectiveStatsFromPlacement(chart.planets[p]).resolve - (p === playerPlanet ? 25 : 24);
      }
    });
    expect(ruler).toBe("Sun");
    expect(result.log.playerDelta).toBeGreaterThan(1);
    expect(result.log.lightGain).toBe(
      2 * (scoreBeats("Venus", projection.beats, turn) + scoreBeats("Mars", projection.beats, turn)),
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
