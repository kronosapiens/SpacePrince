import { MACROBIAN_ORDER } from "@/game/data";
import { PLANET_PRIMARY } from "@/svg/palette";
import type { PlanetName } from "@/game/types";

/** Seven bands in Macrobian order, each the planet's primary, stacked down a
 *  viewport edge. Two levels: `on` rests dim, `current` sits bright. The mint
 *  reveals the chart through them; the encounter strikes them as each planet
 *  resolves (see `.combat-bands` in layout.css). */
export function PlanetBands({ on, current, className }: {
  on?: ReadonlySet<PlanetName>;
  current?: ReadonlySet<PlanetName>;
  className?: string;
}) {
  return (
    <div className={className ? `planet-bands ${className}` : "planet-bands"} aria-hidden="true">
      {MACROBIAN_ORDER.map((p) => (
        <div
          key={p}
          className={`planet-band${on?.has(p) ? " is-on" : ""}${current?.has(p) ? " is-current" : ""}`}
          style={{ background: PLANET_PRIMARY[p] }}
        />
      ))}
    </div>
  );
}
