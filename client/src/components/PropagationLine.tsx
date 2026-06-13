import { ASPECT_COLOR } from "@/svg/palette";
import { STROKE_HEAVY } from "@/svg/viewbox";
import type { PlanetName } from "@/game/types";

type AspectKind = "Conjunction" | "Sextile" | "Square" | "Trine" | "Opposition";

// A bright pulse travels source → target along the aspect line, arriving as the
// target blooms — so you can follow which planet acted and where its effect
// lands, rather than seeing the whole web flash at once. Direction comes from
// the line orientation (from = source = path origin); the travel is a single
// dash sweeping the normalised pathLength (see motion.css `prop-travel`). The
// head keeps the aspect's harmony/tension family but brightened, with a soft
// glow, so it pops out of the dim static aspect web. The pulse signals "energy
// is flowing here, this way" — heal/harm still lives on the target's bloom.
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

// Brightened harmony/tension tints for the traveling head.
const HEAD_COLOR = { harmony: "#E4FAD6", tension: "#FFA89C" } as const;

export function PropagationLine(props: PropagationLineProps) {
  const { fromX, fromY, toX, toY, aspect, active } = props;
  if (!active) return null;
  const harmony = aspect === "Trine" || aspect === "Sextile" || aspect === "Conjunction";
  const head = harmony ? HEAD_COLOR.harmony : HEAD_COLOR.tension;
  const glow = harmony ? ASPECT_COLOR.harmony : ASPECT_COLOR.tension;
  return (
    <line
      x1={fromX} y1={fromY} x2={toX} y2={toY}
      pathLength={100}
      stroke={head}
      strokeWidth={STROKE_HEAVY}
      strokeLinecap="round"
      strokeDasharray="16 200"
      className="anim-prop-travel"
      style={{ pointerEvents: "none", filter: `drop-shadow(0 0 7px ${glow}) drop-shadow(0 0 12px ${glow})` }}
    />
  );
}
