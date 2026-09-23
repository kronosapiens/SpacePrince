import { useId } from "react";
import { hashString, mulberry32 } from "@/game/rng";
import { isOver } from "@/game/run";
import type { Prince } from "@/game/types";
import { NEUTRAL } from "@/svg/palette";
import { STAR_RECTANGLES, STAR_STYLE as STYLE } from "@/svg/prince-style";

export function RunStars({ prince }: { prince: Prince }) {
  const glowId = useId();
  // Earlier runs are already finished, including combustions at a lower unlock tier.
  const completed = prince.runs.filter((run, index) =>
    index < prince.runs.length - 1 || isOver(run, prince.chart, prince.numEncounters),
  );

  return (
    <g fill={NEUTRAL.bone} aria-label="Past runs">
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor={NEUTRAL.bone} stopOpacity={STYLE.glow.core} />
          <stop offset="50%" stopColor={NEUTRAL.bone} stopOpacity={STYLE.glow.mid} />
          <stop offset="100%" stopColor={NEUTRAL.bone} stopOpacity="0" />
        </radialGradient>
      </defs>
      {completed.map((run, index) => {
        const rng = mulberry32(hashString(`${prince.id}_star_${index}`));
        // Equal areas give each rectangle equal probability, with three draws per star.
        const rectangle = STAR_RECTANGLES[Math.floor(rng() * STAR_RECTANGLES.length)]!;
        const x = rectangle.x + rng() * rectangle.width;
        const y = rectangle.y + rng() * rectangle.height;
        // Fixed across the Prince's lifetime; new records never dim older stars.
        const brightness = run.light / (run.light + STYLE.lightScale);
        const coreOpacity = STYLE.minOpacity + brightness * (1 - STYLE.minOpacity);
        const haloOpacity = brightness * brightness;
        const radius = Math.max(STYLE.minRadius, Math.sqrt(run.light / STYLE.lightScale));
        return (
          <g key={run.id} opacity={coreOpacity}>
            <title>{`Run ${index + 1} · ${run.light} Light`}</title>
            <circle
              cx={x}
              cy={y}
              r={radius}
              fill={`url(#${glowId})`}
              // Cancel group opacity so the halo follows its own score curve.
              fillOpacity={haloOpacity / coreOpacity}
            />
            <circle cx={x} cy={y} r={STYLE.coreRadius} />
          </g>
        );
      })}
    </g>
  );
}
