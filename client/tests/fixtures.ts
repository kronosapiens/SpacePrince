import { seededChart } from "@/game/chart";
import type { Profile } from "@/game/types";

// Shared stub Profile for reducer/run tests. `seed` drives both the id and the
// generated chart; lifetimeEncounterCount defaults to 64 so all seven planets
// are unlocked. Pass any Profile field to override.
export function createStubProfile(opts: Partial<Profile> & { seed?: number } = {}): Profile {
  const { seed = 7, ...overrides } = opts;
  return {
    id: `stub_${seed}`,
    name: "Stub",
    birthData: { iso: "2000-01-01T00:00:00Z", lat: 0, lon: 0 },
    chart: seededChart(seed, "Stub"),
    lifetimeEncounterCount: 64,
    scarsLevel: 0,
    createdAt: 0,
    schemaVersion: 1,
    ...overrides,
  };
}
