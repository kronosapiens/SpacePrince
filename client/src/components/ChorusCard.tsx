import { useEffect } from "react";
import { InfoCard } from "./InfoCard";
import { KandinskyComposition } from "./KandinskyComposition";
import { BeginButton } from "./BeginButton";
import { CHORUS_COPY } from "@/copy/chorus";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { playUISound, setTheme } from "@/audio/engine";
import type { ChorusPassage, EncounterState, PlanetName } from "@/game/types";

interface ChorusCardProps {
  planet: PlanetName;
  passage: ChorusPassage;
  kind: EncounterState["kind"];
  onContinue: () => void;
}

export function ChorusCard({ planet, passage, kind, onContinue }: ChorusCardProps) {
  const { setActive } = useActivePlanet();
  useEffect(() => {
    setActive(planet);
    setTheme(planet, kind);
  }, [planet, kind, setActive]);

  return (
    <InfoCard className="chorus-modal" ariaLabel={CHORUS_COPY.label(planet)} onClose={onContinue} restoreFocus={false}>
      <div className="chorus-content">
        <div className="chorus-figure" aria-hidden="true"><KandinskyComposition planet={planet} size={240} /></div>
        <h1 className="chorus-name">{planet}</h1>
        <blockquote className="chorus-passage">{passage.text}</blockquote>
        <div className="chorus-attribution">
          <p>{passage.author}</p>
          <a href={passage.source_url} target="_blank" rel="noopener noreferrer">{passage.source}</a>
          {passage.translation && <p>{passage.translation}</p>}
        </div>
      </div>
      <BeginButton className="chorus-continue" onClick={() => { playUISound("dismiss"); onContinue(); }}>
        {CHORUS_COPY.continue}
      </BeginButton>
    </InfoCard>
  );
}
