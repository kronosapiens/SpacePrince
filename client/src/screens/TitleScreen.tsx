import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { loadProfile } from "@/state/profile";
import { loadRun } from "@/state/run-store";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { Chart } from "@/components/Chart";
import { unlockedPlanets } from "@/game/unlocks";
import { loadDevSettings } from "@/state/settings";
import type { PlanetName, Profile, RunState } from "@/game/types";

export function TitleScreen() {
  const navigate = useNavigate();
  const [profile] = useState<Profile | null>(() => loadProfile());
  const [run] = useState<RunState | null>(() => loadRun());
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    setActive("Sun"); // ceremonial gold tint on Title
  }, [setActive]);

  if (!profile) {
    return (
      <div className="title">
        <div className="title-wordmark">SPACE&nbsp;&nbsp;PRINCE</div>
        <div className="title-stage">
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <p className="title-empty-line">A position has not yet been recognized.</p>
          </div>
        </div>
        <div className="title-foot">
          <button
            className="begin-btn"
            onClick={() => navigate(ROUTES.start)}
            type="button"
          >
            Recognize a Position
          </button>
        </div>
      </div>
    );
  }

  const settings = loadDevSettings();
  const beginLabel = run && !run.over ? "Start" : "Begin";
  const unlocked = unlockedPlanets(profile.lifetimeEncounterCount, settings.unlockAll);

  return (
    <div className="title">
      <div className="title-wordmark">SPACE&nbsp;&nbsp;PRINCE</div>
      <div className="title-stage">
        <div className="title-chart">
          <Chart
            chart={profile.chart}
            unlockedPlanets={unlocked}
            allActive
            hoveredPlanet={hovered}
            onPlanetHover={setHovered}
            hideAfflictionBadges
            showColorField
          />
        </div>
      </div>
      <div className="title-foot">
        <button className="begin-btn" onClick={() => navigate(ROUTES.map)} type="button">
          {beginLabel}
        </button>
      </div>
    </div>
  );
}
