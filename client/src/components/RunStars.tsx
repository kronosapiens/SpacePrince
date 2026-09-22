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
          <stop offset={STYLE.coreRadiusRatio} stopColor={NEUTRAL.bone} stopOpacity={STYLE.glow.core} />
          <stop offset={(1 + STYLE.coreRadiusRatio) / 2} stopColor={NEUTRAL.bone} stopOpacity={STYLE.glow.mid} />
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
        const radius = Math.max(STYLE.minRadius, Math.sqrt(run.light / STYLE.lightScale));
        return (
          <g
            key={run.id}
            opacity={STYLE.minOpacity + brightness * (1 - STYLE.minOpacity)}
          >
            <title>{`Run ${index + 1} · ${run.light} Light`}</title>
            <circle
              cx={x}
              cy={y}
              r={radius}
              fill={`url(#${glowId})`}
            />
            <circle cx={x} cy={y} r={radius * STYLE.coreRadiusRatio} />
          </g>
        );
      })}
    </g>
  );
}
