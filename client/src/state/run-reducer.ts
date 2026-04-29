import type { EncounterState, RunState } from "@/game/types";

/**
 * Run-state actions. The reducer is pure — every "kind: 'commit*'" action
 * carries a pre-computed `nextRun` produced by impure work (RNG, time) in a
 * thunk hook in `store-actions.ts`. This mirrors the eventual onchain shape:
 * thunks are the "submit", reducer accepts the resolved state.
 */
export type RunAction =
  | { type: "run/start"; run: RunState }
  | { type: "run/clear" }
  | { type: "run/setEncounter"; encounter: EncounterState }
  | { type: "run/clearEncounter" }
  | { type: "run/commitTurn"; nextRun: RunState }
  | { type: "run/commitNarrative"; nextRun: RunState }
  | { type: "run/rolloverMap"; nextRun: RunState }
  | { type: "run/setOver"; over: boolean };

export function runReducer(
  state: RunState | null,
  action: RunAction,
): RunState | null {
  switch (action.type) {
    case "run/start":
      return action.run;
    case "run/clear":
      return null;
  }
  if (!state) return null;
  switch (action.type) {
    case "run/setEncounter":
      return { ...state, currentEncounter: action.encounter };
    case "run/clearEncounter":
      return { ...state, currentEncounter: null };
    case "run/commitTurn":
    case "run/commitNarrative":
    case "run/rolloverMap":
      return action.nextRun;
    case "run/setOver":
      return { ...state, over: action.over };
  }
}
