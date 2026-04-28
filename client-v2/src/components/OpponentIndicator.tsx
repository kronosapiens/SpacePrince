import type { PlanetName } from "@/game/types";
import { PLANET_GLYPH } from "@/svg/glyphs";
import { PLANET_PRIMARY } from "@/svg/palette";

export function OpponentIndicator({ planet, dim = false }: { planet: PlanetName | null; dim?: boolean }) {
  if (!planet) return null;
  return (
    <div className={`opponent-indicator${dim ? " is-dim" : ""}`}>
      <div className="opponent-indicator-glyph" style={{ color: PLANET_PRIMARY[planet] }}>
        {PLANET_GLYPH[planet]}
      </div>
      <div className="opponent-indicator-label">{planet.toLowerCase()}</div>
    </div>
  );
}
