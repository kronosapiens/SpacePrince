import { Chart } from "./Chart";
import { AchievementMarks } from "./AchievementMarks";
import type { Prince } from "@/game/types";
import { unlockedPlanets } from "@/game/unlocks";
import { NEUTRAL } from "@/svg/palette";
import { STAR_FIELD_BOUNDS } from "@/svg/prince-style";
import { PRINCE_CHART_INSET } from "@/svg/viewbox";

export function PrinceArtwork({ prince, achievements = prince.achievements }: { prince: Prince; achievements?: number }) {
  return (
    <svg className="prince-artwork" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg" aria-label={`${prince.chart.name} Prince artwork`}>
      <rect width="800" height="1000" fill={NEUTRAL.void} />
      <svg {...STAR_FIELD_BOUNDS} data-dev-grid aria-hidden="true" />
      <svg
        data-dev-grid
        x={PRINCE_CHART_INSET}
        y={100 + PRINCE_CHART_INSET}
        width={800 - 2 * PRINCE_CHART_INSET}
        height={800 - 2 * PRINCE_CHART_INSET}
        viewBox="0 0 1000 1000"
      >
        <Chart
          chart={prince.chart}
          unlockedPlanets={unlockedPlanets(prince.numEncounters)}
          passive
          hideAffliction
        />
      </svg>
      <AchievementMarks achievements={achievements} />
      <rect x="1" y="1" width="798" height="998" fill="none"
        stroke={NEUTRAL.gold} strokeOpacity="0.28" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
