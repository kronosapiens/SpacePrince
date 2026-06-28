import type { Prince, Run } from "@/game/types";

/**
 * The single store: a Prince owns its runs (STATE.md). Run mutations land on the
 * tail run (`commitRun`); a new run is appended (`startRun`). As with the prior
 * reducers, impure work (RNG, time) happens in `store-actions.ts` thunks that
 * pre-compute the next run and dispatch the resolved state here.
 */
export type PrinceAction =
  | { kind: "mint"; prince: Prince }
  | { kind: "clear" }
  | { kind: "setEncounters"; count: number }
  | { kind: "incrementEncounters" }
  | { kind: "startRun"; run: Run }
  | { kind: "commitRun"; run: Run };

export function princeReducer(state: Prince | null, action: PrinceAction): Prince | null {
  switch (action.kind) {
    case "mint":
      return action.prince;
    case "clear":
      return null;
  }
  if (!state) return state;
  switch (action.kind) {
    case "setEncounters":
      return { ...state, numEncounters: Math.max(0, action.count) };
    case "incrementEncounters":
      return { ...state, numEncounters: state.numEncounters + 1 };
    case "startRun":
      return { ...state, runs: [...state.runs, action.run] };
    case "commitRun": {
      if (state.runs.length === 0) return state;
      const runs = [...state.runs];
      runs[runs.length - 1] = action.run;
      return { ...state, runs };
    }
  }
}
