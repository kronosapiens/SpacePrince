import { describe, expect, it } from "vitest";
import { profileReducer } from "@/state/profile-reducer";
import { createStubProfile } from "./fixtures";

describe("profileReducer", () => {
  it("profile/set replaces null state", () => {
    const p = createStubProfile();
    expect(profileReducer(null, { type: "profile/set", profile: p })).toBe(p);
  });

  it("profile/clear nulls the state", () => {
    const p = createStubProfile();
    expect(profileReducer(p, { type: "profile/clear" })).toBeNull();
  });

  it("non-set/clear actions on null state are no-ops", () => {
    expect(profileReducer(null, { type: "profile/incrementLifetime" })).toBeNull();
  });

  it("profile/incrementLifetime bumps by one", () => {
    const p = createStubProfile({ lifetimeEncounterCount: 3 });
    const next = profileReducer(p, { type: "profile/incrementLifetime" });
    expect(next?.lifetimeEncounterCount).toBe(4);
  });

  it("profile/setEncounterCount sets the value, clamped at zero", () => {
    const p = createStubProfile({ lifetimeEncounterCount: 3 });
    expect(
      profileReducer(p, { type: "profile/setEncounterCount", count: 99 })
        ?.lifetimeEncounterCount,
    ).toBe(99);
    expect(
      profileReducer(p, { type: "profile/setEncounterCount", count: -5 })
        ?.lifetimeEncounterCount,
    ).toBe(0);
  });

  it("profile/incrementScars bumps once and remembers the run id", () => {
    const p = createStubProfile({ scarsLevel: 2 });
    const next = profileReducer(p, {
      type: "profile/incrementScars",
      runId: "run_1",
    });
    expect(next?.scarsLevel).toBe(3);
    expect(next?.lastScarsBumpRunId).toBe("run_1");
  });

  it("profile/incrementScars is idempotent for the same runId", () => {
    const p = createStubProfile({ scarsLevel: 2 });
    const once = profileReducer(p, {
      type: "profile/incrementScars",
      runId: "run_1",
    });
    const twice = profileReducer(once, {
      type: "profile/incrementScars",
      runId: "run_1",
    });
    expect(twice).toBe(once);
    expect(twice?.scarsLevel).toBe(3);
  });

  it("profile/incrementScars bumps for a different runId", () => {
    const p = createStubProfile({ scarsLevel: 2 });
    const after1 = profileReducer(p, {
      type: "profile/incrementScars",
      runId: "run_1",
    });
    const after2 = profileReducer(after1, {
      type: "profile/incrementScars",
      runId: "run_2",
    });
    expect(after2?.scarsLevel).toBe(4);
    expect(after2?.lastScarsBumpRunId).toBe("run_2");
  });
});
