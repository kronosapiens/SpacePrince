import { seededChart } from "@/game/chart";
import type { Prince } from "@/game/types";

// Shared stub Prince for reducer/run tests. `seed` drives both the id and the
// generated chart; numEncounters defaults to 64 so all seven planets are
// unlocked. Pass any Prince field to override.
export function createStubPrince(opts: Partial<Prince> & { seed?: number } = {}): Prince {
  const { seed = 7, ...overrides } = opts;
  return {
    id: `stub_${seed}`,
    position: { iso: "2000-01-01T00:00:00Z", lat: 0, lon: 0 },
    chart: seededChart(seed, "Stub"),
    numEncounters: 64,
    achievements: 0,
    runs: [],
    ...overrides,
  };
}
