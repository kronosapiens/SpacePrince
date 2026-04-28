import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { loadProfile } from "@/state/profile";
import { loadRun } from "@/state/run-store";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { Chart } from "@/components/Chart";
import { unlockedPlanets } from "@/game/unlocks";
import { loadDevSettings } from "@/state/settings";
import type { Profile, RunState } from "@/game/types";

export function TitleScreen() {
  const navigate = useNavigate();
  const [profile] = useState<Profile | null>(() => loadProfile());
  const [run] = useState<RunState | null>(() => loadRun());
  const { setActive } = useActivePlanet();

  useEffect(() => {
    setActive(null);
  }, [setActive]);

  if (!profile) {
    return (
      <div className="title">
        <div className="title-wordmark t-display-em">SPACE PRINCE</div>
        <div className="title-stage">
          <div style={{ textAlign: "center", maxWidth: 400 }}>
            <p className="title-line">A position has not yet been recognized.</p>
          </div>
        </div>
        <div className="title-foot">
          <button
            className="title-begin"
            onClick={() => navigate(ROUTES.mint)}
            type="button"
          >
            Recognize a Position
          </button>
        </div>
      </div>
    );
  }

  const settings = loadDevSettings();
  const beginLabel = run && !run.over ? "Continue" : "Begin";
  const unlocked = unlockedPlanets(profile.lifetimeEncounterCount, settings.unlockAll);

  return (
    <div className="title">
      <div className="title-wordmark t-display-em">SPACE PRINCE</div>
      <div className="title-stage">
        <div style={{ width: "min(560px, 80vw)", aspectRatio: "1 / 1" }}>
          <Chart
            chart={profile.chart}
            state={run?.perPlanetState}
            unlockedPlanets={unlocked}
            passive
          />
        </div>
      </div>
      <div className="title-foot">
        <button
          className="title-begin"
          onClick={() => navigate(ROUTES.map)}
          type="button"
        >
          {beginLabel}
        </button>
        <Link className="title-second" to={ROUTES.study}>Chart Study</Link>
      </div>
    </div>
  );
}
