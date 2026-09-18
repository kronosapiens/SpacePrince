import { useId } from "react";
import { PLANETS } from "@/game/data";
import { PLANET_PRIMARY } from "@/svg/palette";

export function WordmarkGlow() {
  const id = useId();

  return (
    <svg className="wordmark-glow" viewBox="0 0 700 160" aria-hidden="true" focusable="false">
      <defs>
        {PLANETS.map((planet) => (
          <radialGradient key={planet} id={`${id}-${planet}`}>
            <stop offset="0%" stopColor={PLANET_PRIMARY[planet]} stopOpacity="var(--wordmark-glow-core)" />
            <stop offset="50%" stopColor={PLANET_PRIMARY[planet]} stopOpacity="var(--wordmark-glow-mid)" />
            <stop offset="100%" stopColor={PLANET_PRIMARY[planet]} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {PLANETS.map((planet, index) => (
        <circle
          key={planet}
          cx={80 + index * 90}
          cy={80}
          fill={`url(#${id}-${planet})`}
          style={{ animationDelay: `calc(${index} * var(--wordmark-ripple-stagger))` }}
        />
      ))}
    </svg>
  );
}
