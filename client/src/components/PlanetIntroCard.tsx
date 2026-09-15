import type { Chart, PlanetName } from "@/game/types";
import { InfoCard } from "@/components/InfoCard";
import { KandinskyComposition } from "@/components/KandinskyComposition";
import { PLANET_INTRODUCTIONS } from "@/copy/planet-introductions";
import { PLANET_ROLE } from "@/game/data";

interface PlanetIntroCardProps {
  chart: Chart;
  planet: PlanetName;
  onClose: () => void;
}

/** An introduction to the planet through its placement and symbolism. */
export function PlanetIntroCard({ chart, planet, onClose }: PlanetIntroCardProps) {
  const placement = chart.planets[planet];

  return (
    <InfoCard className="planet-intro-modal" ariaLabel={`${planet} unlocked`} onClose={onClose}>
      <div className="planet-intro">
        <div className="planet-intro-figure">
          <KandinskyComposition planet={planet} size={280} />
        </div>
        <h1 className="planet-intro-name">{planet}</h1>
        <p className="planet-intro-placement">
          <span>in {placement.sign}</span>
          <span aria-hidden>·</span>
          <span className="planet-intro-role">{PLANET_ROLE[planet]}</span>
        </p>
        <p className="planet-intro-portrait">{PLANET_INTRODUCTIONS[planet][placement.sign]}</p>
      </div>
    </InfoCard>
  );
}
