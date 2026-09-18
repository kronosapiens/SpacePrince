import { HOUSE_BORDER, NODE_R } from "@/svg/map-style";
import { NEUTRAL } from "@/svg/palette";

interface HouseCoinProps {
  house: number;
  color: string;
  opacity?: number;
  fillOpacity?: number;
  strokeWidth?: number;
  guideId?: string;
}

/** Shared SVG geometry, centered at the origin in map units. */
export function HouseCoin({ house, color, opacity = 1, fillOpacity = opacity, strokeWidth = 1.8, guideId }: HouseCoinProps) {
  return (
    <>
      <circle r={NODE_R} data-guide={guideId}
        fill={color} fillOpacity={fillOpacity}
        stroke={color} strokeOpacity={opacity} strokeWidth={strokeWidth} />
      <circle r={HOUSE_BORDER.rimR} fill="none"
        stroke={NEUTRAL.void} strokeOpacity={opacity}
        strokeWidth={HOUSE_BORDER.stroke} style={{ pointerEvents: "none" }} />
      <text textAnchor="middle" dominantBaseline="central"
        fontSize={14} fill={NEUTRAL.void} fillOpacity={opacity}
        fontFamily="'Cormorant Garamond', Garamond, serif" fontWeight={700}
        style={{ pointerEvents: "none", userSelect: "none" }}>
        {romanHouse(house)}
      </text>
    </>
  );
}

export function romanHouse(house: number): string {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return numerals[house - 1] ?? String(house);
}
