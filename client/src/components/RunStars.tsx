import { hashString, mulberry32 } from "@/game/rng";
import { isOver } from "@/game/run";
import type { Prince } from "@/game/types";
import { NEUTRAL } from "@/svg/palette";
import { STAR_FIELD_BOUNDS as BOUNDS, STAR_STYLE as STYLE } from "@/svg/prince-style";

export function RunStars({ prince }: { prince: Prince }) {
  // Earlier runs are already finished, including combustions at a lower unlock tier.
  const completed = prince.runs.filter((run, index) =>
    index < prince.runs.length - 1 || isOver(run, prince.chart, prince.numEncounters),
  );

  return (
    <svg {...BOUNDS} data-dev-grid fill={NEUTRAL.bone} aria-label="Past runs">
      {completed.map((run, index) => {
        const rng = mulberry32(hashString(`${prince.id}_star_${index}`));
        // Fixed across the Prince's lifetime; new records never dim older stars.
        const brightness = run.light / (run.light + STYLE.lightScale);
        return (
          <circle
            key={run.id}
            cx={STYLE.radius + rng() * (BOUNDS.width - 2 * STYLE.radius)}
            cy={STYLE.radius + rng() * (BOUNDS.height - 2 * STYLE.radius)}
            r={STYLE.radius}
            fillOpacity={STYLE.minOpacity + brightness * (STYLE.maxOpacity - STYLE.minOpacity)}
          >
            <title>{`Run ${index + 1} · ${run.light} Light`}</title>
          </circle>
        );
      })}
    </svg>
  );
}
