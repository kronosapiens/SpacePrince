import type { PlanetName } from "@/game/types";
import { PLANET_GLYPH } from "@/svg/glyphs";
import { PLANET_PRIMARY } from "@/svg/palette";

interface ChorusFragmentProps {
  planet: PlanetName;
  text: string;
  attribution?: string;
}

export function ChorusFragment({ planet, text, attribution }: ChorusFragmentProps) {
  return (
    <div className="narrative-aria">
      <div className="narrative-aria-glyph" style={{ color: PLANET_PRIMARY[planet] }}>
        <span style={{ fontSize: 36, lineHeight: 1 }}>{PLANET_GLYPH[planet]}</span>
      </div>
      <div className="narrative-fragment anim-fragment-in anim-fragment-in-1">{text}</div>
      {attribution && (
        <div className="narrative-fragment-attr anim-fragment-in anim-fragment-in-2">{attribution}</div>
      )}
    </div>
  );
}
