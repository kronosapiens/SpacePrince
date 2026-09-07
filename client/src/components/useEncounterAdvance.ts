import { useCallback, useEffect, useRef } from "react";

/** Advance after the outcome has settled; a tap can skip the remaining pause. */
export function useEncounterAdvance(ready: boolean, onAdvance: () => void, delayMs = 1800) {
  const advanced = useRef(false);
  const callback = useRef(onAdvance);
  useEffect(() => { callback.current = onAdvance; }, [onAdvance]);

  const advance = useCallback(() => {
    if (!ready || advanced.current) return;
    advanced.current = true;
    callback.current();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(advance, delayMs);
    return () => window.clearTimeout(timer);
  }, [ready, advance, delayMs]);

  return advance;
}
