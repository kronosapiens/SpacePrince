import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { Chart } from "@/components/Chart";
import { loadProfile } from "@/state/profile";
import { loadRun } from "@/state/run-store";
import { loadDevSettings } from "@/state/settings";
import { unlockedPlanets } from "@/game/unlocks";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import type { PlanetName, Profile, RunState } from "@/game/types";

export function ChartStudyScreen() {
  const [profile] = useState<Profile | null>(() => loadProfile());
  const [run] = useState<RunState | null>(() => loadRun());
  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    setActive(null);
  }, [setActive]);

  if (!profile) return <Navigate to={ROUTES.title} replace />;
  const settings = loadDevSettings();
  const unlocked = unlockedPlanets(profile.lifetimeEncounterCount, settings.unlockAll);

  return (
    <div className="screen center">
      <div style={{ width: "min(720px, 90vw)", aspectRatio: "1 / 1" }}>
        <Chart
          chart={profile.chart}
          state={run?.perPlanetState}
          unlockedPlanets={unlocked}
          selectedPlanet={selected}
          hoveredPlanet={hovered}
          onPlanetClick={(p) => setSelected((cur) => (cur === p ? null : p))}
          onPlanetHover={setHovered}
        />
      </div>
      <div style={{ marginTop: 24 }}>
        <Link className="title-second" to={ROUTES.title}>Back</Link>
      </div>
    </div>
  );
}
