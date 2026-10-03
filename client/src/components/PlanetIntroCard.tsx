import type { Chart, PlanetName } from "@/game/types";
import { InfoCard } from "@/components/InfoCard";
import { KandinskyComposition } from "@/components/KandinskyComposition";
import { Starfield } from "@/components/Starfield";
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
      <div className="planet-intro" key={planet}>
        <Starfield />
        {["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => (
          <svg key={corner} className={`planet-intro-corner planet-intro-corner-${corner}`}
            viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M 4 60 V 18 A 14 14 0 0 1 18 4 H 60" />
          </svg>
        ))}
        <p className="planet-intro-header">A planet comes into view</p>
        <div className="planet-intro-figure">
          <KandinskyComposition planet={planet} size={310} />
        </div>
        <h1 className="planet-intro-name">{planet}</h1>
        <p className="planet-intro-placement">
          <span>in {placement.sign}</span>
          <span aria-hidden>·</span>
          <span className="planet-intro-role">{PLANET_ROLE[planet]}</span>
        </p>
        <svg className="planet-intro-divider" viewBox="0 0 160 20" fill="none" aria-hidden="true">
          <path d="M 0 10 H 62 M 98 10 H 160 M 80 3 L 87 10 L 80 17 L 73 10 Z" />
          <circle cx="80" cy="10" r="2" fill="currentColor" stroke="none" />
          <circle cx="66" cy="10" r="1" fill="currentColor" stroke="none" />
          <circle cx="94" cy="10" r="1" fill="currentColor" stroke="none" />
        </svg>
        <p className="planet-intro-portrait">{PLANET_INTRODUCTIONS[planet][placement.sign]}</p>
      </div>
    </InfoCard>
  );
}
