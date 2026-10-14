import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { princeReducer, type PrinceAction } from "./prince-reducer";
import { clearPrince, loadPrince, savePrince } from "./prince";
import { runChart } from "@/game/chart";
import type { Chart, Prince, Run } from "@/game/types";

const PrinceContext = createContext<Prince | null>(null);
const PrinceDispatchContext = createContext<Dispatch<PrinceAction> | null>(null);

export function PrinceStoreProvider({ children }: { children: ReactNode }) {
  const [prince, dispatch] = useReducer(princeReducer, undefined, () => loadPrince());

  useEffect(() => {
    if (prince) savePrince(prince);
    else clearPrince();
  }, [prince]);

  return (
    <PrinceContext.Provider value={prince}>
      <PrinceDispatchContext.Provider value={dispatch}>
        {children}
      </PrinceDispatchContext.Provider>
    </PrinceContext.Provider>
  );
}

export function usePrince(): Prince | null {
  return useContext(PrinceContext);
}

export function usePrinceDispatch(): Dispatch<PrinceAction> {
  const dispatch = useContext(PrinceDispatchContext);
  if (!dispatch) {
    throw new Error("usePrinceDispatch must be used within PrinceStoreProvider");
  }
  return dispatch;
}

/** The active (tail) run, or null if the Prince has none yet. Callers check
 *  `isOver(run, prince.chart, prince.numEncounters)` to tell an in-progress
 *  run from a just-finished one. */
export function useActiveRun(): Run | null {
  const prince = usePrince();
  return prince?.runs.at(-1) ?? null;
}

/** The Prince's chart as the active run sees it (`runChart`), or the natal
 *  chart before any run. Recomputed only when the run's gains change. */
export function useRunChart(): Chart | null {
  const prince = usePrince();
  const gains = useActiveRun()?.gains;
  return useMemo(
    () => (prince && gains ? runChart(prince.chart, { gains }) : prince?.chart ?? null),
    [prince?.chart, gains],
  );
}
