import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { PlanetName } from "@/game/types";

/** Serializable card references, so a card can be queued by one surface and
 *  presented later by another (an unlock earned in combat shows over the map).
 *  New interstitial content kinds extend this union. */
export type InfoCardRef = { kind: "planet-intro"; planet: PlanetName };

interface InfoCardContextValue {
  /** Head of the queue — the card the host should present, if any. */
  current: InfoCardRef | null;
  /** Queue a card; it presents at the next stable surface (map, end). */
  enqueueCard: (ref: InfoCardRef) => void;
  /** Dismiss the presented card, advancing the queue. */
  dismissCard: () => void;
}

const Ctx = createContext<InfoCardContextValue>({
  current: null,
  enqueueCard: () => {},
  dismissCard: () => {},
});

export function InfoCardProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<InfoCardRef[]>([]);
  const enqueueCard = useCallback((ref: InfoCardRef) => setQueue((q) => [...q, ref]), []);
  const dismissCard = useCallback(() => setQueue((q) => q.slice(1)), []);
  const value = useMemo<InfoCardContextValue>(
    () => ({ current: queue[0] ?? null, enqueueCard, dismissCard }),
    [queue, enqueueCard, dismissCard],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInfoCards() {
  return useContext(Ctx);
}
