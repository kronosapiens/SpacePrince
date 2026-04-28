import type { PlanetName } from "@/game/types";
import { PLANET_GLYPH } from "@/svg/glyphs";

export function OpponentIndicator({ planet }: { planet: PlanetName | null }) {
  if (!planet) return null;
  return (
    <div className="opponent-indicator">
      <div className="opponent-indicator-glyph">{PLANET_GLYPH[planet]}</div>
      <div>Answer {planet}</div>
    </div>
  );
}
