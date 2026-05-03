import { ASPECT_COLOR } from "@/svg/palette";
import { STROKE_MEDIUM } from "@/svg/viewbox";
import type { PlanetName } from "@/game/types";

type AspectKind = "Conjunction" | "Sextile" | "Square" | "Trine" | "Opposition";

// Pulse uses the same red/green as the static aspect line — just brighter,
// briefly. The pulse signals "energy is flowing along this line right now,"
// not the heal/harm of the effect. That signal lives on the projection
// badge and the target planet's impact pulse.
export interface PropagationLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromPlanet: PlanetName;
  toPlanet: PlanetName;
  aspect: AspectKind;
  /** When true, renders the pulse. Mounting + class drive the animation. */
  active: boolean;
}

export function PropagationLine(props: PropagationLineProps) {
  const { fromX, fromY, toX, toY, aspect, active } = props;
  if (!active) return null;
  const harmony = aspect === "Trine" || aspect === "Sextile" || aspect === "Conjunction";
  const stroke = harmony ? ASPECT_COLOR.harmony : ASPECT_COLOR.tension;
  return (
    <g style={{ pointerEvents: "none" }}>
      <line
        x1={fromX} y1={fromY} x2={toX} y2={toY}
        stroke={stroke}
        strokeWidth={STROKE_MEDIUM}
        strokeLinecap="round"
        className="anim-propagation-pulse"
      />
    </g>
  );
}
