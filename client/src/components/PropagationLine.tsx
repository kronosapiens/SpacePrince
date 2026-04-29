import { useEffect, useId, useRef } from "react";
import { PLANET_PRIMARY, PLANET_SECONDARY } from "@/svg/palette";
import { STROKE_MEDIUM } from "@/svg/viewbox";
import type { PlanetName } from "@/game/types";

type AspectKind = "Conjunction" | "Sextile" | "Square" | "Trine" | "Opposition";

export interface PropagationLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromPlanet: PlanetName;
  toPlanet: PlanetName;
  aspect: AspectKind;
  /** When true, animates color travel along the segment exactly once. */
  active: boolean;
  /** Optional callback when the animation completes. */
  onComplete?: () => void;
}

/**
 * Renders a colored line between two planet positions and animates the color
 * travelling from source → destination along the line. Trine = monotonic 1000ms,
 * Square = ease-in to 75% → 200ms hold → ease-out to 100% (1400ms total).
 */
export function PropagationLine(props: PropagationLineProps) {
  const { fromX, fromY, toX, toY, fromPlanet, toPlanet, aspect, active, onComplete } = props;
  const gradientRef = useRef<SVGLinearGradientElement | null>(null);
  // useId guarantees uniqueness across instances even when coords collide.
  const gradientId = useId();

  const harmony = aspect === "Trine" || aspect === "Sextile" || aspect === "Conjunction";
  const fromColor = harmony ? PLANET_PRIMARY[fromPlanet] : PLANET_SECONDARY[fromPlanet];
  const toColor = harmony ? PLANET_PRIMARY[toPlanet] : PLANET_SECONDARY[toPlanet];

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const total = aspect === "Square" ? 1400 : 1000;
    const tick = (now: number) => {
      const elapsed = now - start;
      let t = Math.min(1, elapsed / total);
      if (aspect === "Square") {
        // ease-in to 75% over first 600ms, hold to 800ms, ease-out to 100% by 1400ms
        if (elapsed < 600) {
          t = (elapsed / 600) * 0.75;
          t = easeIn(t / 0.75) * 0.75;
        } else if (elapsed < 800) {
          t = 0.75;
        } else {
          const tail = (elapsed - 800) / 600;
          t = 0.75 + easeOut(Math.min(1, tail)) * 0.25;
        }
      } else {
        t = easeOut(t);
      }
      const grad = gradientRef.current;
      if (grad) {
        const stops = grad.querySelectorAll("stop");
        const offset0 = Math.max(0, t - 0.18);
        const offset1 = Math.min(1, t + 0.0);
        if (stops[0]) stops[0].setAttribute("offset", `${offset0}`);
        if (stops[1]) stops[1].setAttribute("offset", `${offset1}`);
      }
      if (elapsed < total) {
        raf = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, aspect, onComplete]);

  if (!active) return null;

  return (
    <g style={{ pointerEvents: "none" }}>
      <defs>
        <linearGradient
          ref={gradientRef}
          id={gradientId}
          x1={fromX} y1={fromY} x2={toX} y2={toY}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={fromColor} stopOpacity="1" />
          <stop offset="0" stopColor={toColor} stopOpacity="1" />
        </linearGradient>
      </defs>
      <line
        x1={fromX} y1={fromY} x2={toX} y2={toY}
        stroke={`url(#${gradientId})`}
        strokeWidth={STROKE_MEDIUM}
        strokeLinecap="round"
        opacity={0.95}
      />
    </g>
  );
}

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeIn(t: number) { return t * t * t; }
