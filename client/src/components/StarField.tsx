import { useMemo } from "react";
import { hashString, mulberry32 } from "@/game/rng";
import { NEUTRAL, PLANET_SECONDARY } from "@/svg/palette";
import type { Run } from "@/game/types";

/**
 * The Star-Field (NFT.md): every finished run inscribes one permanent star,
 * its position and brightness derived deterministically from the run's seed
 * and final Distance. A field, not a scoreboard — "a sky to read".
 *
 * Field-layer discipline (STYLE.md §9): plain circles at low opacity, behind
 * the chart, no halos or gradients. The one Active-layer moment is the
 * inscription (`inscribingRunId`), when the newest star blooms into place.
 */

export interface Star {
  x: number; // 0..1000 field coordinates
  y: number;
  r: number;
  opacity: number;
  color: string;
  runId: string;
}

/** Distance at which a star reaches full brightness (tuning constant). */
const FULL_BRIGHT_DISTANCE = 300;

export function starForRun(run: Pick<Run, "id" | "seed" | "distance">): Star {
  const rng = mulberry32(hashString(`${run.seed}_${Math.round(run.distance)}_star`));
  const t = Math.min(1, run.distance / FULL_BRIGHT_DISTANCE);
  return {
    x: 30 + rng() * 940,
    y: 30 + rng() * 940,
    r: 1.6 + 2.4 * t,
    opacity: 0.3 + 0.5 * t,
    // A run of greater care leaves a brighter, warmer star (NFT.md) — the top
    // tier borrows the Sun's warm white; the rest are bone.
    color: t > 0.66 ? PLANET_SECONDARY.Sun : NEUTRAL.bone,
    runId: run.id,
  };
}

interface StarFieldProps {
  /** Finished runs only — a run earns its star when it ends (MECHANICS §12). */
  runs: ReadonlyArray<Pick<Run, "id" | "seed" | "distance">>;
  /** Run whose star is being inscribed right now (End-of-run ceremony). */
  inscribingRunId?: string | null;
  className?: string;
}

export function StarField({ runs, inscribingRunId, className }: StarFieldProps) {
  const stars = useMemo(() => runs.map(starForRun), [runs]);
  if (stars.length === 0) return null;
  return (
    <svg
      className={["star-field", className ?? ""].filter(Boolean).join(" ")}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {stars.map((s) => (
        <circle
          key={s.runId}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={s.color}
          opacity={s.opacity}
          className={s.runId === inscribingRunId ? "anim-star-inscribe" : undefined}
        />
      ))}
    </svg>
  );
}
