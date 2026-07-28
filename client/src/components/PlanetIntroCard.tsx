import type { Chart, PlanetName } from "@/game/types";
import { MACROBIAN_ORDER, MACROBIAN_THRESHOLDS, PLANET_ROLE } from "@/game/data";
import { getEffectiveStats } from "@/game/combat";
import { PLANET_GLYPH, SIGN_GLYPH } from "@/svg/glyphs";
import { PLANET_PRIMARY } from "@/svg/palette";

interface PlanetIntroCardProps {
  chart: Chart;
  planet: PlanetName;
}

/** Planet introduction — the unlock ceremony's card content. Celebrates the
 *  position, not a person (no voice, no fragment): the glyph, the sign it
 *  holds in this chart, the role, the stats, and the honest schedule line
 *  (the Macrobian thresholds are deterministic, so the next unlock is shown). */
export function PlanetIntroCard({ chart, planet }: PlanetIntroCardProps) {
  const placement = chart.planets[planet];
  const stats = getEffectiveStats(chart, planet);
  const i = MACROBIAN_ORDER.indexOf(planet);
  const threshold = MACROBIAN_THRESHOLDS[i]!;
  const next = MACROBIAN_ORDER[i + 1];

  return (
    <div className="planet-intro">
      <div className="planet-intro-eyebrow">A planet unlocks</div>
      <div className="planet-intro-disc" style={{ background: PLANET_PRIMARY[planet] }}>
        <span className="planet-intro-glyph">{PLANET_GLYPH[planet]}</span>
      </div>
      <div className="planet-intro-name">{planet}</div>
      <div className="planet-intro-role">{PLANET_ROLE[planet]}</div>
      <div className="planet-intro-sign">
        in {placement.sign} {SIGN_GLYPH[placement.sign]}
        {placement.dignity !== "Neutral" && ` · ${placement.dignity}`}
      </div>
      <div className="planet-intro-stats">
        Damage {stats.damage} · Healing {stats.healing} · Durability {stats.durability} · Luck {stats.luck}
      </div>
      <div className="planet-intro-footer">
        {threshold === 0 ? "From the first encounter" : `Encounter ${threshold}`}
        {next
          ? ` · next ${next} at ${MACROBIAN_THRESHOLDS[i + 1]}`
          : " · the seventh and last"}
      </div>
    </div>
  );
}
