import { PLANETS } from "./data";
import { cloneSideState } from "./chart";
import { applyCombust } from "./combust";
import type { Dignity, PlanetName, Prince, Run } from "./types";
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
  const dignities = {} as Record<PlanetName, Dignity>;
  for (const p of PLANETS) dignities[p] = prince.chart.planets[p].dignity;
  return {
    joyPlanet,
    rulerPlanet,
    unlocked,
    perPlanetState: run.state,
    dignities,
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
  let distance = run.distance;
  const harmed = new Set<PlanetName>();

  // resolve targets against the state as it mutates
  const liveCtx: NarrativeContext = { ...ctx, perPlanetState: state };

  for (const o of outcomes) {
    switch (o.kind) {
      case "distance":
        distance = Math.max(0, distance + o.delta);
        break;
      case "affliction": {
        for (const p of resolveTargets(o.target, liveCtx)) {
          const ps = state[p];
          if (ps.combusted) continue;
          ps.affliction = Math.max(0, ps.affliction + o.delta);
          if (o.delta > 0) harmed.add(p);
        }
        break;
      }
      case "combust": {
        const p = o.target as PlanetName;
        state[p].combusted = o.value;
        if (o.value) state[p].affliction = Math.max(state[p].affliction, 1);
        break;
      }
      case "uncombust": {
        const p = o.target as PlanetName;
        state[p].combusted = false;
        state[p].affliction = 0;
        break;
      }
    }
  }

  // combust-check every planet that took fresh affliction (MECHANICS.md §10)
  for (const p of harmed) {
    applyCombust(prince.chart.planets[p], state[p]);
  }

  return { ...run, state, distance };
}
