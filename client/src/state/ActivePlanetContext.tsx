import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { PlanetName } from "@/game/types";

interface ActivePlanetContextValue {
  active: PlanetName | null;
  setActive: (p: PlanetName | null) => void;
}

const Ctx = createContext<ActivePlanetContextValue>({ active: null, setActive: () => {} });

export function ActivePlanetProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<PlanetName | null>(null);
  const value = useMemo<ActivePlanetContextValue>(() => ({ active, setActive }), [active]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActivePlanet() {
  return useContext(Ctx);
}
