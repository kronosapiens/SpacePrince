import { describe, expect, it } from "vitest";
import { beginRun } from "@/game/run";
import { beginCombatEncounter } from "@/game/encounter";
import { combustionCeiling } from "@/game/combust";
import { resolveTurn } from "@/game/turn";
import { createStubPrince } from "./fixtures";
import type { CombatEncounter, Run } from "@/game/types";

function setup(opponentSeed = 99) {
  const prince = createStubPrince({ seed: 7 });
  const run = beginRun(42);
  const enc = beginCombatEncounter({
    run,
    opponentSeed,
    lifetimeEncounterCount: prince.numEncounters,
  });
  const r: Run = { ...run, encounter: enc };
  return { prince, run: r };
}

describe("sequential resolution — preemption", () => {
  it("combusting the opponent's acting planet in phase 1 zeroes its phase-2 response", () => {
    const { prince, run } = setup();
    const enc = run.encounter as CombatEncounter;
    const active = enc.sequence[enc.turnIndex]!;
    // Park the opponent's acting planet one point under its ceiling — any
    // afflicting hit combusts it (affliction caps at the ceiling, §10).
    enc.opponentState[active].affliction =
      combustionCeiling(enc.opponentChart.planets[active]) - 1;
    enc.opponentActions[enc.turnIndex] = "Affliction";

    // Resolution is deterministic (§7) — rng only feeds the next-turn draw.
    const result = resolveTurn(run, prince.chart, "Mars", "Affliction", () => 0)!;
    expect(result.encounter.opponentState[active].combusted).toBe(true);
    expect(result.log.opponentCombust).toBe(true);
    // Preempted: the opponent's action lands on a dead planet, so it does nothing.
    expect(result.log.playerDelta).toBe(0);
  });

  it("without a phase-1 combust, the opponent's action still lands on the player", () => {
    const { prince, run } = setup();
    const enc = run.encounter as CombatEncounter;
    const active = enc.sequence[enc.turnIndex]!;
    enc.opponentState[active].affliction = 0;
    enc.opponentActions[enc.turnIndex] = "Affliction";

    // From zero affliction, one hit stays far below any ceiling — no combust.
    const result = resolveTurn(run, prince.chart, "Mars", "Affliction", () => 0.99)!;
    expect(result.encounter.opponentState[active].combusted).toBe(false);
    expect(result.log.playerDelta).toBeGreaterThan(0);
  });

  it("affliction caps at the ceiling — the finishing blow applies only the remainder", () => {
    const { prince, run } = setup();
    const enc = run.encounter as CombatEncounter;
    const active = enc.sequence[enc.turnIndex]!;
    const ceiling = combustionCeiling(enc.opponentChart.planets[active]);
    enc.opponentState[active].affliction = ceiling - 1;

    const result = resolveTurn(run, prince.chart, "Mars", "Affliction", () => 0)!;
    expect(result.encounter.opponentState[active].affliction).toBe(ceiling);
    expect(result.encounter.opponentState[active].combusted).toBe(true);
    // Mars swings for its full stat, but only the last point applies (§8, §10).
    expect(result.log.opponentDelta).toBe(1);
  });
});
