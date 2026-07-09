import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { usePrince, useActiveRun } from "@/state/PrinceStore";
import { useStartRun } from "@/state/store-actions";
import { isMuted, setMuted } from "@/audio/engine";
import { isOver } from "@/game/run";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { Chart } from "@/components/Chart";
import { PLANETS } from "@/game/data";
import { seededChart } from "@/game/chart";
import { randomSeed } from "@/game/rng";
import type { Chart as ChartType, PlanetName } from "@/game/types";

const RECHART_INTERVAL_MS = 3000;
const TITLE_FADE_MS = 420; // matches the .title opacity transition (layout.css)

/** Quiet functional chrome (SCREENS §3.7 register): the one player-facing
 *  sound control, on the one screen that carries the wordmark. */
function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted());
  const toggle = () => {
    setMuted(!muted);
    setMutedState(!muted);
  };
  return (
    <button className="sound-toggle" onClick={toggle} type="button">
      {muted ? "SOUND OFF" : "SOUND ON"}
    </button>
  );
}

export function TitleScreen() {
  const navigate = useNavigate();
  const prince = usePrince();
  const run = useActiveRun();
  const startRun = useStartRun();
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const [leaving, setLeaving] = useState(false);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    // Neutral bone glow on Title — clear any planet tint carried in from
    // another screen so the background falls back to the resting neutral.
    setActive(null);
  }, [setActive]);

  // Cycle a fresh random sample chart every few seconds so the Title canvas
  // stays alive. Only the interval re-rolls it — hover and other state changes
  // during the visit don't.
  const [chart, setChart] = useState<ChartType>(() => seededChart(randomSeed(), "Sample"));

  useEffect(() => {
    const id = window.setInterval(
      () => setChart(seededChart(randomSeed(), "Sample")),
      RECHART_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  // Continue resumes a live (non-over) run; Begin starts a new run on the same
  // Prince (identity persists — the lifetime layer, SCREENS §9.2). A player
  // with no Prince falls through to the mint at /play. Which surface /play
  // shows is derived from run state by PlaySurface — the Title just routes there.
  const hasLiveRun = !!(prince && run && !isOver(run, prince.numEncounters));
  const label = hasLiveRun ? "Continue" : "Begin";
  const handleBegin = () => {
    if (leaving) return;
    if (prince && !hasLiveRun) startRun();
    setLeaving(true); // fade out, then hand off to /play
    window.setTimeout(() => navigate(ROUTES.play), TITLE_FADE_MS);
  };

  return (
    <div className={`title ${leaving ? "is-leaving" : ""}`}>
      <div className="title-wordmark">SPACE&nbsp;&nbsp;PRINCE</div>
      <div className="title-stage">
        <div className="title-chart">
          <Chart
            chart={chart}
            unlockedPlanets={PLANETS}
            hoveredPlanet={hovered}
            onPlanetHover={setHovered}
            hideAfflictionBadges
            showColorField
          />
        </div>
      </div>
      <div className="title-foot">
        <button className="begin-btn" onClick={handleBegin} type="button">
          {label}
        </button>
        <SoundToggle />
      </div>
    </div>
  );
}
