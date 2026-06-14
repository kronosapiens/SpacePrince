import { PLANETS } from "./data";
import { cloneSideState } from "./chart";
import { applyCombust } from "./combust";
import type { Dignity, PlanetName, Profile, RunState } from "./types";
import {
  resolveTargets,
  type NarrativeContext,
  type Outcome,
} from "@/data/narrative-trees";

export interface BuildContextInput {
  profile: Profile;
  run: RunState;
  joyPlanet: PlanetName | null;
  rulerPlanet: PlanetName;
  unlocked: PlanetName[];
}

export function buildNarrativeContext(input: BuildContextInput): NarrativeContext {
  const { profile, run, joyPlanet, rulerPlanet, unlocked } = input;
  const dignities = {} as Record<PlanetName, Dignity>;
  for (const p of PLANETS) dignities[p] = profile.chart.planets[p].dignity;
  return {
    joyPlanet,
    rulerPlanet,
    unlocked,
    perPlanetState: run.perPlanetState,
    dignities,
  };
}

/**
 * Apply a committed option's outcomes to run state (ENCOUNTERS.md §2). Abstract
 * targets resolve against the live (mutating) state, so "most-afflicted" tracks
 * earlier effects in the same list. Returns a new RunState; run-end is rechecked.
 */
export function applyOutcomes(
  run: RunState,
  profile: Profile,
  outcomes: Outcome[],
  ctx: NarrativeContext,
): RunState {
  const perPlanetState = cloneSideState(run.perPlanetState);
  let runDistance = run.runDistance;
  const harmed = new Set<PlanetName>();

  // resolve targets against the state as it mutates
  const liveCtx: NarrativeContext = { ...ctx, perPlanetState };

  for (const o of outcomes) {
    switch (o.kind) {
      case "distance":
        runDistance = Math.max(0, runDistance + o.delta);
        break;
      case "affliction": {
        for (const p of resolveTargets(o.target, liveCtx)) {
          const state = perPlanetState[p];
          if (state.combusted) continue;
          state.affliction = Math.max(0, state.affliction + o.delta);
          if (o.delta > 0) harmed.add(p);
        }
        break;
      }
      case "combust": {
        const p = o.target as PlanetName;
        perPlanetState[p].combusted = o.value;
        if (o.value) perPlanetState[p].affliction = Math.max(perPlanetState[p].affliction, 1);
        break;
      }
      case "uncombust": {
        const p = o.target as PlanetName;
        perPlanetState[p].combusted = false;
        perPlanetState[p].affliction = 0;
        break;
      }
    }
  }

  // combust-check every planet that took fresh affliction (MECHANICS.md §10)
  for (const p of harmed) {
    applyCombust(profile.chart.planets[p], perPlanetState[p]);
  }

  const over = PLANETS.every((p) => perPlanetState[p].combusted);
  return { ...run, perPlanetState, runDistance, over };
}
