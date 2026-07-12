import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { useStartRun } from "@/state/store-actions";
import { ensureAudio, isMuted, playPropagation, setMuted } from "@/audio/engine";
import { finishedRuns, isOver } from "@/game/run";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { Chart } from "@/components/Chart";
import { StarField } from "@/components/StarField";
import { useCurrentSky } from "@/astronomy/transits";
import { PLANETS } from "@/game/data";
import { seededChart } from "@/game/chart";
import { unlockedPlanets } from "@/game/unlocks";
import { randomSeed } from "@/game/rng";
import type { Chart as ChartType, PlanetName } from "@/game/types";

const RECHART_INTERVAL_MS = 3000;
const TITLE_FADE_MS = 420; // matches the .title opacity transition (layout.css)

/** Quiet functional chrome (SCREENS §3.7 register): the one player-facing
 *  sound control, on the one screen that carries the wordmark. */
function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted());
  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    // Turning sound on answers audibly — the resolving fourth doubles as the
    // confirmation note, and the click itself is the resume gesture.
    if (!next) {
      ensureAudio()
        .then(() => playPropagation(false))
        .catch(() => {});
    }
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
  const dispatch = usePrinceDispatch();
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const [leaving, setLeaving] = useState(false);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    // Neutral bone glow on Title — clear any planet tint carried in from
    // another screen so the background falls back to the resting neutral.
    setActive(null);
  }, [setActive]);

  // With a Prince, the Title is the identity surface (SCREENS §9.1): their
  // chart at its current unlock state, their star-field behind it. Without
  // one, a fresh random sample cycles every few seconds so the canvas stays
  // alive. Only the interval re-rolls it — hover and other state changes
  // during the visit don't.
  const [sample, setSample] = useState<ChartType>(() => seededChart(randomSeed(), "Sample"));

  useEffect(() => {
    if (prince) return;
    const id = window.setInterval(
      () => setSample(seededChart(randomSeed(), "Sample")),
      RECHART_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [prince]);

  const chart = prince ? prince.chart : sample;
  const shownPlanets = prince ? unlockedPlanets(prince.numEncounters) : PLANETS;
  // Finished runs each own a star; the live tail run hasn't earned its yet.
  const starRuns = prince ? finishedRuns(prince.runs, prince.numEncounters) : [];
  // The sky right now, riding the rim of the Prince's chart (transits) — the
  // Title reads differently every day. A sample chart isn't anyone, so the
  // princeless Title carries no sky.
  const sky = useCurrentSky();

  // Continue resumes a live (non-over) run; Begin starts a new run on the same
  // Prince (identity persists — the lifetime layer, SCREENS §9.2). A player
  // with no Prince falls through to the mint at /play. Which surface /play
  // shows is derived from run state by PlaySurface — the Title just routes there.
  const hasLiveRun = !!(prince && run && !isOver(run, prince.numEncounters));
  const label = hasLiveRun ? "Continue" : "Begin";
  const handleBegin = () => {
    if (leaving) return;
    // A finished sample dissolves here (FREE.md: nothing kept) — Begin leads
    // to the mint, not to a second free map.
    if (prince?.sample && !hasLiveRun) dispatch({ kind: "clear" });
    else if (prince && !hasLiveRun) startRun();
    setLeaving(true); // fade out, then hand off to /play
    window.setTimeout(() => navigate(ROUTES.play), TITLE_FADE_MS);
  };

  return (
    <div className={`title ${leaving ? "is-leaving" : ""}`}>
      <div className="title-wordmark">SPACE&nbsp;&nbsp;PRINCE</div>
      <div className="title-stage">
        <StarField runs={starRuns} />
        <div className="title-chart">
          <Chart
            chart={chart}
            unlockedPlanets={shownPlanets}
            hoveredPlanet={hovered}
            onPlanetHover={setHovered}
            hideAfflictionBadges
            showColorField
            transits={prince ? sky : undefined}
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
