import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { runReducer, type RunAction } from "./run-reducer";
import { clearRun, loadRun, saveRun } from "./run-store";
import type { RunState } from "@/game/types";

const RunContext = createContext<RunState | null>(null);
const RunDispatchContext = createContext<Dispatch<RunAction> | null>(null);

export function RunStoreProvider({ children }: { children: ReactNode }) {
  const [run, dispatch] = useReducer(runReducer, undefined, () => loadRun());

  useEffect(() => {
    if (run) saveRun(run);
    else clearRun();
  }, [run]);

  return (
    <RunContext.Provider value={run}>
      <RunDispatchContext.Provider value={dispatch}>
        {children}
      </RunDispatchContext.Provider>
    </RunContext.Provider>
  );
}

export function useRun(): RunState | null {
  return useContext(RunContext);
}

export function useRunDispatch(): Dispatch<RunAction> {
  const dispatch = useContext(RunDispatchContext);
  if (!dispatch) {
    throw new Error("useRunDispatch must be used within RunStoreProvider");
  }
  return dispatch;
}
