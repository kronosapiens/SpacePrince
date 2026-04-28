import { PLANETS } from "./data";
import { cloneSideState } from "./chart";
import { combustionProbability, maybeCombust } from "./combust";
import type {
  PlanetName,
  RunState,
  SideState,
  Profile,
} from "./types";
import type { Outcome } from "@/data/narrative-trees";

/**
 * Apply outcomes from a narrative option commit to run state.
 * Returns a new RunState with the deltas applied.
 *
 * Run-end is checked at the end (all 7 player planets combust).
 */
export function applyOutcomes(
  run: RunState,
  profile: Profile,
  outcomes: Outcome[],
): RunState {
  let perPlanetState = cloneSideState(run.perPlanetState);
  let runDistance = run.runDistance;
  const omens = [...run.runOmens];
  const loreCounters = { ...run.loreCounters };
  let touchedAfflictionPlanet: PlanetName | null = null;

  for (const o of outcomes) {
    switch (o.kind) {
      case "affliction": {
        const state = perPlanetState[o.planet];
        if (!state.combusted) {
          state.affliction = Math.max(0, state.affliction + o.delta);
          touchedAfflictionPlanet = o.planet;
        }
        break;
      }
      case "combust": {
        perPlanetState[o.planet].combusted = o.value;
        if (o.value) perPlanetState[o.planet].affliction = Math.max(perPlanetState[o.planet].affliction, 1);
        break;
      }
      case "uncombust": {
        perPlanetState[o.planet].combusted = false;
        perPlanetState[o.planet].affliction = 0;
        break;
      }
      case "distance": {
        runDistance = Math.max(0, runDistance + o.delta);
        break;
      }
      case "omen": {
        omens.push(o.omen);
        break;
      }
      case "lore": {
        loreCounters[o.id] = (loreCounters[o.id] ?? 0) + 1;
        break;
      }
    }
  }

  // After applying real-valued affliction, roll combust on touched planets.
  if (touchedAfflictionPlanet) {
    const placement = profile.chart.planets[touchedAfflictionPlanet];
    const state = perPlanetState[touchedAfflictionPlanet];
    if (combustionProbability(placement, state) > 0) {
      // Use a deterministic mini-RNG keyed on run id + planet to avoid Math.random in pure logic
      // but for narrative we can roll real rng — narrative resolution is not replayed, so Math.random is acceptable.
      maybeCombust(placement, state, Math.random);
    }
  }

  const over = PLANETS.every((p) => perPlanetState[p].combusted);
  return {
    ...run,
    perPlanetState,
    runDistance,
    runOmens: omens,
    loreCounters,
    over,
  };
}

export interface NarrativeCtxBuild {
  profile: Profile;
  run: RunState;
  joyPlanet: PlanetName | null;
  rulerPlanet: PlanetName;
}

export function buildNarrativeContext(input: NarrativeCtxBuild) {
  const { profile, run, joyPlanet, rulerPlanet } = input;
  const joyAffliction = joyPlanet ? run.perPlanetState[joyPlanet].affliction : 0;
  const joyCombusted = joyPlanet ? run.perPlanetState[joyPlanet].combusted : false;
  void profile; // reserved for future ruler-aspecting-ASC logic
  return {
    joyPlanet,
    joyAffliction,
    joyCombusted,
    rulerPlanet,
    perPlanetState: run.perPlanetState as SideState,
  };
}
