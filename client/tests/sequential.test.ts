import { describe, expect, it } from "vitest";
import { beginRun } from "@/game/run";
import { beginCombatEncounter } from "@/game/encounter";
import { resolveTurn } from "@/game/turn";
import { createStubProfile } from "./fixtures";
import type { CombatEncounter, RunState } from "@/game/types";

function setup(opponentSeed = 99) {
  const profile = createStubProfile({ seed: 7 });
  const run = beginRun(profile, 42);
  const enc = beginCombatEncounter({
    run,
    opponentSeed,
    lifetimeEncounterCount: profile.lifetimeEncounterCount,
  });
  const r: RunState = { ...run, currentEncounter: enc };
  return { profile, run: r };
}

describe("sequential resolution — preemption", () => {
  it("combusting the opponent's acting planet in phase 1 zeroes its phase-2 response", () => {
    const { profile, run } = setup();
    const enc = run.currentEncounter as CombatEncounter;
    const active = enc.sequence[enc.turnIndex]!;
    // Push the opponent's acting planet to certain combustion, and have it afflict.
    enc.opponentState[active].affliction = 1000;
    enc.opponentActions[enc.turnIndex] = "Affliction";

    // rng → 0: the player crits and the opponent's planet combusts on the hit.
    const result = resolveTurn(run, profile.chart, "Mars", "Affliction", () => 0)!;
    expect(result.encounter.opponentState[active].combusted).toBe(true);
    expect(result.log.opponentCombust).toBe(true);
    // Preempted: the opponent's action lands on a dead planet, so it does nothing.
    expect(result.log.playerDelta).toBe(0);
  });

  it("without a phase-1 combust, the opponent's action still lands on the player", () => {
    const { profile, run } = setup();
    const enc = run.currentEncounter as CombatEncounter;
    const active = enc.sequence[enc.turnIndex]!;
    enc.opponentState[active].affliction = 0;
    enc.opponentActions[enc.turnIndex] = "Affliction";

    // rng → 0.99: no crit, no combust anywhere.
    const result = resolveTurn(run, profile.chart, "Mars", "Affliction", () => 0.99)!;
    expect(result.encounter.opponentState[active].combusted).toBe(false);
    expect(result.log.playerDelta).toBeGreaterThan(0);
  });
});
