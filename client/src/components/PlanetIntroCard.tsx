import type { Chart, PlanetName } from "@/game/types";
import { KandinskyComposition } from "@/components/KandinskyComposition";
import { MACROBIAN_ORDER, MACROBIAN_THRESHOLDS, PLANET_ROLE } from "@/game/data";
import { getEffectiveStats } from "@/game/combat";
import { SIGN_GLYPH } from "@/svg/glyphs";

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
      {/* The planet-as-presence piece the narrative screen uses — same
          presentation, same register (its own glyph centerpiece included). */}
      <div className="planet-intro-figure">
        <KandinskyComposition planet={planet} size={380} />
      </div>
      <div className="planet-intro-name">{planet}</div>
      <div className="planet-intro-role">{PLANET_ROLE[planet]}</div>
      <div className="planet-intro-sign">
        in {placement.sign} {SIGN_GLYPH[placement.sign]}
        {placement.dignity !== "Neutral" && ` · ${placement.dignity}`}
      </div>
      <div className="planet-intro-stats">
        Impact {stats.impact} · Witness {stats.witness} · Durability {stats.durability} · Luck {stats.luck}
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
