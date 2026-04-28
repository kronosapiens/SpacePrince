import { NEUTRAL, PLANET_PRIMARY } from "@/svg/palette";
import type { PlanetName } from "@/game/types";

interface VesicaSeamProps {
  /** Planet whose color tints the vesica glow. Defaults to Mars (combat heat). */
  planet?: PlanetName;
}

/** Two intersecting circles forming a vesica piscis between the two combat charts.
 *  Carries the conceptual "facing" axis without needing a literal line between charts. */
export function VesicaSeam({ planet = "Mars" }: VesicaSeamProps) {
  const color = PLANET_PRIMARY[planet];
  return (
    <svg width={160} height={540} viewBox="0 0 160 540" style={{ pointerEvents: "none" }} aria-hidden>
      <defs>
        <radialGradient id="vesica-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={80} cy={270} rx={60} ry={220} fill="url(#vesica-glow)" />
      <circle cx={40} cy={270} r={180} fill="none" stroke={NEUTRAL.bone} strokeOpacity="0.18" strokeWidth={0.5} />
      <circle cx={120} cy={270} r={180} fill="none" stroke={NEUTRAL.bone} strokeOpacity="0.18" strokeWidth={0.5} />
      <line x1={80} y1={50} x2={80} y2={490} stroke={color} strokeOpacity="0.35" strokeWidth={0.5} />
    </svg>
  );
}
