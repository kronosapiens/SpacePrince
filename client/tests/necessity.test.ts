import { describe, expect, it, vi } from "vitest";
import { applyNecessity } from "@/game/necessity";
import { blankSideState, derivePlacements, runChart, seededChart } from "@/game/chart";
import { combustionCeiling, isCombusted } from "@/game/combust";
import { fortuneChance, getEffectiveStats } from "@/game/combat";
import { beginCombatEncounter, rollOpponentTurns } from "@/game/encounter";
import { beginRun, enterNode, newMapState } from "@/game/run";
import { hashString, mulberry32 } from "@/game/rng";
import { PLANETS, SIGNS } from "@/game/data";
import { unlockedPlanets } from "@/game/unlocks";
import type { Chart, CombatEncounter, PlanetName } from "@/game/types";

const chart = seededChart(7);

describe("necessity", () => {
  it.each([0, 1, 2])("draws uniform tier %i and Fortune blocks at luck/120", (tier) => {
    const chance = fortuneChance(getEffectiveStats(chart, "Sun").luck);
    for (const fortunate of [false, true]) {
      for (const edge of [0, 0.999]) {
        const rng = vi.fn().mockReturnValueOnce((tier + edge) / 3)
          .mockReturnValueOnce(fortunate ? chance - 0.001 : chance);
        const result = applyNecessity(chart, blankSideState(), ["Sun"], rng);
        const draw = [12, 24, 36][tier]!;
        const amount = fortunate ? 0 : draw;
        expect(result.state.Sun.affliction).toBe(amount);
        expect(result.necessity).toEqual([{ planet: "Sun", amount, blocked: fortunate, draw }]);
        expect(rng).toHaveBeenCalledTimes(2);
      }
    }
  });

  it("can combust wounded planets, caps at Resolve, and does not mutate the input", () => {
    const ceiling = combustionCeiling(chart.planets.Moon);
    for (const initial of [12, ceiling - 2, ceiling - 1, ceiling - 0.5]) {
      const state = blankSideState();
      state.Moon.affliction = initial;
      const result = applyNecessity(chart, state, ["Moon"], () => 0.999);
      const expected = Math.min(initial + 36, ceiling);
      expect(result.state.Moon.affliction).toBe(expected);
      expect(state.Moon.affliction).toBe(initial);
      expect(result.necessity).toEqual([{ planet: "Moon", amount: expected - initial, blocked: false, draw: 36 }]);
    }
  });

  it("blocks the complete draw on a wounded planet and retains its zero-amount record", () => {
    const state = blankSideState();
    state.Moon.affliction = combustionCeiling(chart.planets.Moon) - 2;
    const rng = vi.fn().mockReturnValueOnce(0.999).mockReturnValueOnce(0);
    const result = applyNecessity(chart, state, ["Moon"], rng);
    expect(result.state.Moon).toEqual(state.Moon);
    expect(isCombusted(chart.planets.Moon, result.state.Moon)).toBe(false);
    expect(result.necessity).toEqual([{ planet: "Moon", amount: 0, blocked: true, draw: 36 }]);
    expect(rng).toHaveBeenCalledTimes(2);
  });

  it("skips combusted and unfielded planets without consuming their rolls", () => {
    const state = blankSideState();
    state.Mars.affliction = combustionCeiling(chart.planets.Mars);
    const rng = vi.fn(() => 0);
    const result = applyNecessity(chart, state, ["Mars", "Moon"], rng);
    expect(rng).toHaveBeenCalledTimes(2);
    expect(result.necessity).toEqual([{ planet: "Moon", amount: 0, blocked: true, draw: 12 }]);
    for (const planet of PLANETS) {
      expect(result.state[planet].affliction).toBe(state[planet].affliction);
    }
  });

  it("cannot combust a fresh planet in any sign or sect, even when Fortune fails on the maximum draw", () => {
    for (const isDiurnal of [false, true]) for (const [index] of SIGNS.entries()) {
      const longitudes = Object.fromEntries(PLANETS.map((p) => [p, index * 30])) as Record<PlanetName, number>;
      const fresh: Chart = { id: "fresh", name: "fresh", isDiurnal, ...derivePlacements({ longitudes, ascendantLongitude: 0, isDiurnal }) };
      const result = applyNecessity(fresh, blankSideState(), PLANETS, () => 0.999);
      for (const planet of PLANETS) {
        expect(combustionCeiling(fresh.planets[planet])).toBeGreaterThanOrEqual(48);
        expect(result.state[planet].affliction).toBe(36);
        expect(isCombusted(fresh.planets[planet], result.state[planet])).toBe(false);
      }
    }
  });

  it("keeps map content and Other's rolls independent, and resamples both sides for forecasts", () => {
    const roster = unlockedPlanets(32);
    const run = beginRun(chart, 42, 32);
    const mapSeed = Math.floor(mulberry32(42)() * 2 ** 31);
    expect(run.map.rolledNodes).toEqual(newMapState(mapSeed, roster).rolledNodes);
    expect(run.state).toEqual(blankSideState());
    const nodeId = Object.keys(run.map.rolledNodes).find((id) => run.map.rolledNodes[id]!.kind === "combat")!;
    const content = run.map.rolledNodes[nodeId]!;
    if (content.kind !== "combat") throw new Error("Expected combat");
    const selfOpenings = [];
    for (const encounterIdSeed of [13, 99]) {
      const enc = beginCombatEncounter({ run, opponentSeed: 99, lifetimeEncounterCount: 32, encounterIdSeed });
      const opening = applyNecessity(enc.opponentChart, blankSideState(), roster,
        mulberry32(hashString(`${encounterIdSeed}_affliction`)));
      expect(enc.opponentState).toEqual(opening.state);
      expect(enc.necessity).toEqual(opening.necessity);
      expect({ sequence: enc.sequence, opponentActions: enc.opponentActions })
        .toEqual(rollOpponentTurns(enc.opponentChart, roster, mulberry32(encounterIdSeed), 1));
      expect(beginCombatEncounter({ run, opponentSeed: 99, lifetimeEncounterCount: 32, encounterIdSeed })).toEqual(enc);
      expect(enc.selfNecessity).toBeUndefined(); // Direct dev encounters retain their manual Self state.
      const entered = enterNode({ run, chart, nodeId, lifetimeEncounterCount: 32, encounterIdSeed });
      const self = applyNecessity(chart, run.state, roster,
        mulberry32(hashString(`${encounterIdSeed}_${run.map.seed}_${nodeId}_player_necessity`)));
      expect(entered.state).toEqual(self.state);
      expect(entered.encounter).toEqual({
        ...beginCombatEncounter({ run, opponentSeed: content.opponentSeed, lifetimeEncounterCount: 32, encounterIdSeed }),
        selfNecessity: self.necessity,
      });
      const hidden = enterNode({ run: { ...run, id: "other_run", seed: 888 }, chart, nodeId, lifetimeEncounterCount: 32, encounterIdSeed });
      expect(hidden.state).toEqual(entered.state);
      expect((hidden.encounter as CombatEncounter).selfNecessity).toEqual(self.necessity);
      selfOpenings.push(JSON.stringify(self));
    }
    expect(new Set(selfOpenings).size).toBe(2);
    expect(run.state).toEqual(blankSideState());
  });

  it.each([0, 32])("adds Self Necessity to retained state and gained stats for unlock tier %i", (lifetimeEncounterCount) => {
    const run = beginRun(chart, 42, lifetimeEncounterCount);
    run.gains.Moon.resolve = 24;
    run.gains.Moon.luck = 120;
    run.state.Moon.affliction = combustionCeiling(chart.planets.Moon) + 6;
    run.state.Sun.affliction = combustionCeiling(chart.planets.Sun);
    run.state.Mercury.affliction = 12;
    const before = structuredClone(run);
    const nodeId = Object.keys(run.map.rolledNodes).find((id) => run.map.rolledNodes[id]!.kind === "combat")!;
    const entered = enterNode({ run, chart, nodeId, lifetimeEncounterCount });
    const encounter = entered.encounter as CombatEncounter;
    const opening = applyNecessity(runChart(chart, run), run.state, encounter.roster,
      mulberry32(hashString(`${run.id}_${run.map.seed}_${nodeId}_player_necessity`)));
    expect(entered.state).toEqual(opening.state);
    expect(encounter.selfNecessity).toEqual(opening.necessity);
    expect(entered.state.Moon.affliction).toBe(run.state.Moon.affliction);
    expect(encounter.selfNecessity!.find((entry) => entry.planet === "Moon")).toMatchObject({ amount: 0, blocked: true });
    expect(entered.state.Sun).toEqual(run.state.Sun);
    for (const planet of PLANETS.filter((p) => !encounter.roster.includes(p))) expect(entered.state[planet]).toEqual(run.state[planet]);
    expect(run).toEqual(before);

    const narrativeId = Object.keys(run.map.rolledNodes).find((id) => run.map.rolledNodes[id]!.kind === "narrative")!;
    expect(enterNode({ run, chart, nodeId: narrativeId, lifetimeEncounterCount }).state).toEqual(before.state);
    expect(run).toEqual(before);
  });
});
