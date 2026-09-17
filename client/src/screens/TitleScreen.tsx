import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { usePrince, useActiveRun } from "@/state/PrinceStore";
import { useStartRun } from "@/state/store-actions";
import { playUISound, setTheme } from "@/audio/engine";
import { isOver } from "@/game/run";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { BeginButton } from "@/components/BeginButton";
import { WordmarkGlow } from "@/components/WordmarkGlow";

const TITLE_FADE_MS = 420; // matches the .title-content opacity transition (layout.css)

export function TitleScreen() {
  const navigate = useNavigate();
  const prince = usePrince();
  const run = useActiveRun();
  const startRun = useStartRun();
  const [leaving, setLeaving] = useState(false);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    // Neutral bone glow on Title — clear any planet tint carried in from
    // another screen so the background falls back to the resting neutral.
    setActive(null);
    setTheme("Main");
  }, [setActive]);

  useEffect(() => {
    if (!leaving) return;
    const delay = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : TITLE_FADE_MS;
    const timer = window.setTimeout(() => navigate(ROUTES.play), delay);
    return () => window.clearTimeout(timer);
  }, [leaving, navigate]);

  // Continue resumes a live (non-over) run; Begin starts a new run on the same
  // Prince — identity persists, the lifetime layer accumulates (SCREENS §9.2).
  // A player with no Prince falls through to the mint at /play; wiping identity
  // is dev-only (DevConsole). Which surface /play shows is derived from run
  // state by PlaySurface — the Title just routes there.
  const hasLiveRun = !!(prince && run && !isOver(run, prince.chart, prince.numEncounters));
  const label = hasLiveRun ? "Continue" : "Begin";
  const handleBegin = () => {
    if (leaving) return;
    if (prince && !hasLiveRun) startRun();
    playUISound(prince && !hasLiveRun ? "commit" : "select");
    setLeaving(true);
  };

  return (
    <div className={`chart-layout-content title-content anim-surface-in ${leaving ? "is-leaving" : ""}`}>
      <h1 className="title-wordmark">
        <WordmarkGlow />
        SPACE&nbsp;&nbsp;PRINCE
      </h1>
      <BeginButton onClick={handleBegin} disabled={leaving}>
        {label}
      </BeginButton>
    </div>
  );
}
