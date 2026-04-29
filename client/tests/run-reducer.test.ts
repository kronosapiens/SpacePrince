import { describe, expect, it } from "vitest";
import { runReducer } from "@/state/run-reducer";
import { beginRun } from "@/game/run";
import { seededChart } from "@/game/chart";
import { beginCombatEncounter } from "@/game/encounter";
import type { Profile, RunState } from "@/game/types";

function makeProfile(seed = 7, lifetime = 64): Profile {
  return {
    id: `stub_${seed}`,
    name: "Stub",
    birthData: { iso: "2000-01-01T00:00:00Z", lat: 0, lon: 0 },
    chart: seededChart(seed, "Stub"),
    lifetimeEncounterCount: lifetime,
    scarsLevel: 0,
    createdAt: 0,
    schemaVersion: 1,
  };
}

describe("runReducer", () => {
  it("run/start replaces null state with the dispatched run", () => {
    const profile = makeProfile();
    const run = beginRun(profile, 42);
    expect(runReducer(null, { type: "run/start", run })).toBe(run);
  });

  it("run/start replaces existing state too", () => {
    const profile = makeProfile();
    const a = beginRun(profile, 1);
    const b = beginRun(profile, 2);
    expect(runReducer(a, { type: "run/start", run: b })).toBe(b);
  });

  it("run/clear nulls the state", () => {
    const profile = makeProfile();
    const run = beginRun(profile, 42);
    expect(runReducer(run, { type: "run/clear" })).toBeNull();
  });

  it("run/clear is a no-op when state is already null", () => {
    expect(runReducer(null, { type: "run/clear" })).toBeNull();
  });

  it("non-start/clear actions on null state are no-ops", () => {
    expect(runReducer(null, { type: "run/clearEncounter" })).toBeNull();
  });

  it("run/setEncounter assigns currentEncounter without touching other fields", () => {
    const profile = makeProfile();
    const run = beginRun(profile, 42);
    const encounter = beginCombatEncounter({
      run,
      opponentSeed: 99,
      lifetimeEncounterCount: profile.lifetimeEncounterCount,
    });
    const next = runReducer(run, { type: "run/setEncounter", encounter });
    expect(next?.currentEncounter).toBe(encounter);
    expect(next?.id).toBe(run.id);
    expect(next?.perPlanetState).toBe(run.perPlanetState);
  });

  it("run/clearEncounter sets currentEncounter to null", () => {
    const profile = makeProfile();
    const run = beginRun(profile, 42);
    const encounter = beginCombatEncounter({
      run,
      opponentSeed: 99,
      lifetimeEncounterCount: profile.lifetimeEncounterCount,
    });
    const withEnc = runReducer(run, { type: "run/setEncounter", encounter });
    const cleared = runReducer(withEnc, { type: "run/clearEncounter" });
    expect(cleared?.currentEncounter).toBeNull();
  });

  it("run/commitTurn replaces state with nextRun", () => {
    const profile = makeProfile();
    const run = beginRun(profile, 42);
    const nextRun: RunState = { ...run, runDistance: run.runDistance + 5 };
    expect(runReducer(run, { type: "run/commitTurn", nextRun })).toBe(nextRun);
  });

  it("run/commitNarrative replaces state with nextRun", () => {
    const profile = makeProfile();
    const run = beginRun(profile, 42);
    const nextRun: RunState = { ...run, runDistance: run.runDistance + 3 };
    expect(runReducer(run, { type: "run/commitNarrative", nextRun })).toBe(nextRun);
  });

  it("run/rolloverMap replaces state with nextRun", () => {
    const profile = makeProfile();
    const run = beginRun(profile, 42);
    const nextRun: RunState = { ...run, mapHistory: [...run.mapHistory, run.currentMap] };
    expect(runReducer(run, { type: "run/rolloverMap", nextRun })).toBe(nextRun);
  });

  it("run/setOver flips the over flag", () => {
    const profile = makeProfile();
    const run = beginRun(profile, 42);
    expect(runReducer(run, { type: "run/setOver", over: true })?.over).toBe(true);
  });
});
