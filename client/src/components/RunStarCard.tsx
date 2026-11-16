import { useEffect } from "react";
import { InfoCard } from "./InfoCard";
import { PrinceArtwork } from "./PrinceArtwork";
import { MAP_COPY } from "@/copy/map";
import { playStar } from "@/audio/engine";
import { timings } from "@/svg/timings";
import type { Prince } from "@/game/types";

/** The artifact as Inspect Prince shows it, opened by itself when a run ends:
 *  the run's star arrives a moment after the card opens, with the star bell,
 *  and the run's Light sits under the artwork. */
export function RunStarCard({ prince, runId, onClose }: { prince: Prince; runId: string; onClose: () => void }) {
  const run = prince.runs.find((candidate) => candidate.id === runId);
  const found = !!run;

  useEffect(() => {
    if (!found) {
      onClose();
      return;
    }
    const delay = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : timings().runEnd.starDelay;
    const timer = window.setTimeout(playStar, delay);
    return () => window.clearTimeout(timer);
  }, [found, onClose]);

  if (!run) return null;
  return (
    <InfoCard ariaLabel="Prince" className="prince-modal" onClose={onClose}>
      <PrinceArtwork prince={prince} draft arrivingRunId={run.id} />
      <div className="prince-light">
        <span className="eyebrow">{MAP_COPY.light}</span>
        <span className="prince-light-v">{Math.round(run.light)}</span>
      </div>
    </InfoCard>
  );
}
