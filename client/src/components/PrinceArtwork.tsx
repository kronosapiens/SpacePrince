import { Chart } from "./Chart";
import { AchievementMarks } from "./AchievementMarks";
import { RunStars } from "./RunStars";
import type { Prince } from "@/game/types";
import { unlockedPlanets } from "@/game/unlocks";
import { NEUTRAL } from "@/svg/palette";
import { PRINCE_CHART_INSET } from "@/svg/viewbox";
import { SPANDREL_PATH, STAR_RECTANGLES } from "@/svg/prince-style";

export function PrinceArtwork({ prince, achievements = prince.achievements }: { prince: Prince; achievements?: number }) {
  return (
    <svg className="prince-artwork" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg" aria-label={`${prince.chart.name} Prince artwork`}>
      <rect width="800" height="1000" fill={NEUTRAL.void} />
      <RunStars prince={prince} />
      <svg
        x={PRINCE_CHART_INSET}
        y={100 + PRINCE_CHART_INSET}
        width={800 - 2 * PRINCE_CHART_INSET}
        height={800 - 2 * PRINCE_CHART_INSET}
        overflow="visible"
      >
        <Chart
          chart={prince.chart}
          unlockedPlanets={unlockedPlanets(prince.numEncounters)}
          passive
          hideAffliction
        />
      </svg>
      <AchievementMarks achievements={achievements} />
      <g fill="none" pointerEvents="none" aria-hidden="true">
        {STAR_RECTANGLES.map((rectangle) => (
          <rect key={rectangle.x} {...rectangle} data-dev-grid="shape" />
        ))}
        <path data-dev-grid="shape" d={SPANDREL_PATH} />
        <path data-dev-grid="shape" d={SPANDREL_PATH} transform="translate(0 1000) scale(1 -1)" />
      </g>
      <rect x="1" y="1" width="798" height="998" fill="none"
        stroke={NEUTRAL.gold} strokeOpacity="0.28" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
