import { cloneSideState } from "./chart";
import { combustionCeiling, isCombusted, uncombust } from "./combust";
import type { PlanetName, Prince, Run } from "./types";
import {
  resolveTargets,
  type NarrativeContext,
  type Outcome,
} from "@/data/narrative-trees";

export interface BuildContextInput {
  prince: Prince;
  run: Run;
  joyPlanet: PlanetName | null;
  rulerPlanet: PlanetName;
  unlocked: PlanetName[];
}

export function buildNarrativeContext(input: BuildContextInput): NarrativeContext {
  const { prince, run, joyPlanet, rulerPlanet, unlocked } = input;
  return {
    joyPlanet,
    rulerPlanet,
    unlocked,
    perPlanetState: run.state,
    placements: prince.chart.planets,
  };
}

/**
 * Apply a committed option's outcomes to run state (ENCOUNTERS.md §2). Abstract
 * targets resolve against the live (mutating) state, so "most-afflicted" tracks
 * earlier effects in the same list. Returns a new Run; `over` is derived (isOver),
 * never stored here.
 */
export function applyOutcomes(
  run: Run,
  prince: Prince,
  outcomes: Outcome[],
  ctx: NarrativeContext,
): Run {
  const state = cloneSideState(run.state);
  let light = run.light;

  // resolve targets against the state as it mutates
  const liveCtx: NarrativeContext = { ...ctx, perPlanetState: state };

  for (const o of outcomes) {
    switch (o.kind) {
      case "light":
        light = Math.max(0, light + o.delta);
        break;
      case "affliction": {
        for (const p of resolveTargets(o.target, liveCtx)) {
          const ps = state[p];
          const placement = prince.chart.planets[p];
          if (isCombusted(placement, ps)) continue;
          // Clamped to [0, ceiling]; landing at the ceiling *is* combustion —
          // no flag to set, combusted is derived (§10, STATE.md).
          const ceiling = combustionCeiling(placement);
          ps.affliction = Math.max(0, Math.min(ceiling, ps.affliction + o.delta));
        }
        break;
      }
      case "uncombust": {
        // The rite returns the planet at half ceiling — back, but scarred (§10).
        const p = o.target as PlanetName;
        uncombust(prince.chart.planets[p], state[p]);
        break;
      }
    }
  }

  return { ...run, state, light };
}
