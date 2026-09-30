import { describe, expect, it, vi } from "vitest";
import { applyNecessity } from "@/game/necessity";
import { blankSideState, seededChart } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { fortuneChance, getEffectiveStats } from "@/game/combat";
import { beginCombatEncounter, rollOpponentTurns } from "@/game/encounter";
import { beginRun, newMapState } from "@/game/run";
import { hashString, mulberry32 } from "@/game/rng";
import { PLANETS } from "@/game/data";
import { unlockedPlanets } from "@/game/unlocks";

const chart = seededChart(7);

describe("necessity", () => {
  it.each([0, 1, 2])("draws uniform tier %i and Fortune halves at luck/120", (tier) => {
    const chance = fortuneChance(getEffectiveStats(chart, "Moon").luck);
    for (const fortunate of [false, true]) {
      for (const edge of [0, 0.999]) {
        const rng = vi.fn().mockReturnValueOnce((tier + edge) / 3)
          .mockReturnValueOnce(fortunate ? chance - 0.001 : chance);
        const result = applyNecessity(chart, blankSideState(), ["Moon"], rng);
        const amount = (tier + 1) * (fortunate ? 6 : 12);
        expect(result.state.Moon.affliction).toBe(amount);
        expect(result.necessity).toEqual([{ planet: "Moon", amount, halved: fortunate, draw: (tier + 1) * 12 }]);
        expect(rng).toHaveBeenCalledTimes(2);
      }
    }
  });

  it("adds affliction without combustion or healing, even within one point of Resolve", () => {
    const ceiling = combustionCeiling(chart.planets.Moon);
    for (const initial of [12, ceiling - 2, ceiling - 1, ceiling - 0.5]) {
      const state = blankSideState();
      state.Moon.affliction = initial;
      const result = applyNecessity(chart, state, ["Moon"], () => 0.999);
      const expected = Math.max(initial, Math.min(initial + 36, ceiling - 1));
      expect(result.state.Moon.affliction).toBe(expected);
      expect(state.Moon.affliction).toBe(initial);
      expect(result.necessity).toEqual(expected > initial
        ? [{ planet: "Moon", amount: expected - initial, halved: false, draw: 36 }] : []);
    }
  });

  it("retains the raw Fortune draw when the final amount is capped", () => {
    const state = blankSideState();
    state.Moon.affliction = combustionCeiling(chart.planets.Moon) - 2;
    const rng = vi.fn().mockReturnValueOnce(0.999).mockReturnValueOnce(0);
    const result = applyNecessity(chart, state, ["Moon"], rng);
    expect(result.necessity).toEqual([{ planet: "Moon", amount: 1, halved: true, draw: 36 }]);
  });

  it("skips combusted and unfielded planets without consuming their rolls", () => {
    const state = blankSideState();
    state.Mars.affliction = combustionCeiling(chart.planets.Mars);
    const rng = vi.fn(() => 0);
    const result = applyNecessity(chart, state, ["Mars", "Moon"], rng);
    expect(rng).toHaveBeenCalledTimes(2);
    for (const planet of PLANETS) {
      expect(result.state[planet].affliction).toBe(planet === "Moon" ? 6 : state[planet].affliction);
    }
  });

  it("uses separate streams for map content and encounter turns at every opening", () => {
    const roster = unlockedPlanets(32);
    const run = beginRun(chart, 42, 32);
    const mapSeed = Math.floor(mulberry32(42)() * 2 ** 31);
    expect(run.map.rolledNodes).toEqual(newMapState(mapSeed, roster).rolledNodes);
    expect(run.state).toEqual(applyNecessity(chart, blankSideState(), roster,
      mulberry32(hashString(`${mapSeed}_boundary`))).state);
    for (const encounterIdSeed of [13, 99]) {
      const enc = beginCombatEncounter({ run, opponentSeed: 99, lifetimeEncounterCount: 32, encounterIdSeed });
      const opening = applyNecessity(enc.opponentChart, blankSideState(), roster,
        mulberry32(hashString(`${encounterIdSeed}_affliction`)));
      expect(enc.opponentState).toEqual(opening.state);
      expect(enc.necessity).toEqual(opening.necessity);
      expect({ sequence: enc.sequence, opponentActions: enc.opponentActions })
        .toEqual(rollOpponentTurns(enc.opponentChart, roster, mulberry32(encounterIdSeed), 1));
      expect(beginCombatEncounter({ run, opponentSeed: 99, lifetimeEncounterCount: 32, encounterIdSeed })).toEqual(enc);
    }
  });
});
