import { describe, expect, it } from "vitest";
import { beginRun } from "@/game/run";
import { beginRelationalEncounter } from "@/game/encounter";
import { isCombusted } from "@/game/combust";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
import { resolveTurn } from "@/game/turn";
import { createStubPrince } from "./fixtures";
import type { RelationalEncounter, Run } from "@/game/types";

function setup(opponentSeed = 99) {
  const prince = createStubPrince({ seed: 7 });
  const run = beginRun(prince.chart, 42);
  const enc = beginRelationalEncounter({
    run,
    opponentSeed,
    lifetimeRelationalEncounterCount: prince.numRelationalEncounters,
  });
  const r: Run = { ...run, encounter: enc };
  return { prince, run: r };
}

describe("sequential resolution — preemption", () => {
  it("combusting the opponent's acting planet in phase 1 zeroes its phase-2 response", () => {
    const { prince, run } = setup();
    const enc = run.encounter as RelationalEncounter;
    const active = enc.sequence[enc.turnIndex]!;
    // Park the opponent's acting planet one point under its Resolve — any
    // afflicting hit combusts it (tension caps at Resolve, §10).
    enc.opponentState[active].tension =
      getEffectiveStatsFromPlacement(enc.opponentChart.planets[active]).resolve - 1;
    enc.opponentActions[enc.turnIndex] = "Affliction";

    // Resolution is deterministic (§7) — rng only feeds the next-turn draw.
    const result = resolveTurn(run, prince.chart, "Mars", "Affliction", () => 0)!;
    expect(
      isCombusted(enc.opponentChart.planets[active], result.encounter.opponentState[active]),
    ).toBe(true);
    expect(result.log.opponentCombust).toBe(true);
    // Preempted: the opponent's action lands on a dead planet, so it does nothing.
    expect(result.log.playerDelta).toBe(0);
  });

  it("without a phase-1 combust, the opponent's action still lands on the player", () => {
    const { prince, run } = setup();
    const enc = run.encounter as RelationalEncounter;
    const active = "Saturn";
    enc.sequence[enc.turnIndex] = active;
    enc.opponentState[active].tension = 0;
    enc.opponentActions[enc.turnIndex] = "Affliction";

    // A clean Saturn can withstand this Mars's affliction.
    const result = resolveTurn(run, prince.chart, "Mars", "Affliction", () => 0.99)!;
    expect(
      isCombusted(enc.opponentChart.planets[active], result.encounter.opponentState[active]),
    ).toBe(false);
    expect(result.log.playerDelta).toBeGreaterThan(0);
  });

  it("tension caps at Resolve — the finishing blow applies only the remainder", () => {
    const { prince, run } = setup();
    const enc = run.encounter as RelationalEncounter;
    const active = enc.sequence[enc.turnIndex]!;
    const resolve = getEffectiveStatsFromPlacement(enc.opponentChart.planets[active]).resolve;
    enc.opponentState[active].tension = resolve - 1;

    const result = resolveTurn(run, prince.chart, "Mars", "Affliction", () => 0)!;
    expect(result.encounter.opponentState[active].tension).toBe(resolve);
    expect(
      isCombusted(enc.opponentChart.planets[active], result.encounter.opponentState[active]),
    ).toBe(true);
    // Mars swings for its full stat, but only the last point applies (§8, §10).
    expect(result.log.opponentDelta).toBe(1);
  });
});
