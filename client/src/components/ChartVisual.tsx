import type { AspectConnection, PlanetName, SignName } from "../game/types";
import { SIGNS } from "../game/data";
import type { ChartPoint } from "../lib/chart";

interface ChartVisualProps {
  title: string;
  points: ChartPoint[];
  planetColors: Record<PlanetName, { fill: string; glow: string }>;
  afflictionValues: Record<PlanetName, number>;
  getAfflictionLevel: (value: number) => number;
  highlightAffliction: Record<string, boolean>;
  onPlanetHover?: (planet: PlanetName | null) => void;
  onPlanetClick?: (planet: PlanetName) => void;
  combusted: Record<PlanetName, boolean>;
  activePlanet?: PlanetName | null;
  actionPlanet?: PlanetName | null;
  showAspects?: boolean;
  activeAspects?: AspectConnection[];
  pointMap?: Record<string, { x: number; y: number }>;
  highlightLines?: Record<string, boolean>;
  diurnal?: boolean;
  rotationDegrees?: number;
  ascendantSign?: SignName;
  mode: "self" | "other";
}

export function ChartVisual({
  title,
  points,
  planetColors,
  afflictionValues,
  getAfflictionLevel,
  highlightAffliction,
  onPlanetHover,
  onPlanetClick,
  combusted,
  activePlanet,
  actionPlanet,
  showAspects,
  activeAspects = [],
  pointMap = {},
  highlightLines = {},
  diurnal,
  rotationDegrees = 0,
  ascendantSign,
  mode,
}: ChartVisualProps) {
  const glyphTone = (hex: string) => {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) {
      return { color: "rgba(248, 243, 230, 0.92)", shadow: "rgba(16, 24, 26, 0.65)" };
    }
    const r = Number.parseInt(clean.slice(0, 2), 16) / 255;
    const g = Number.parseInt(clean.slice(2, 4), 16) / 255;
    const b = Number.parseInt(clean.slice(4, 6), 16) / 255;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness > 0.6) {
      return { color: "rgba(36, 30, 22, 0.86)", shadow: "rgba(255, 245, 220, 0.26)" };
    }
    return { color: "rgba(248, 243, 230, 0.92)", shadow: "rgba(16, 24, 26, 0.65)" };
  };

  const planetGlyph: Record<PlanetName, string> = {
    Sun: "☉",
    Moon: "☽",
    Mercury: "☿",
    Venus: "♀",
    Mars: "♂",
    Jupiter: "♃",
    Saturn: "♄",
  };
  const signGlyph: Record<string, string> = {
    Aries: "♈︎",
    Taurus: "♉︎",
    Gemini: "♊︎",
    Cancer: "♋︎",
    Leo: "♌︎",
    Virgo: "♍︎",
    Libra: "♎︎",
    Scorpio: "♏︎",
    Sagittarius: "♐︎",
    Capricorn: "♑︎",
    Aquarius: "♒︎",
    Pisces: "♓︎",
  };

  const formatMultiplier = (value: number) => {
    const rounded = Number(value.toFixed(3));
    const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
    return `${rounded > 0 ? "+" : ""}${text}x`;
  };
  const sunPoint = points.find((point) => point.planet === "Sun");
  const sunAboveMidpoint = sunPoint ? sunPoint.y <= 0 : diurnal ?? true;
  const sectClass = sunAboveMidpoint ? "day-top" : "day-bottom";
  const visibleAspects = activeAspects
    .filter((aspect) => !combusted[aspect.from] && !combusted[aspect.to])
    .map((aspect) => {
      const from = pointMap[aspect.from];
      const to = pointMap[aspect.to];
      if (!from || !to) return null;
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const offset = 12;
      const labelX = midX + (-dy / length) * offset;
      const labelY = midY + (dx / length) * offset;
      return { aspect, from, to, labelX, labelY };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="chart-shell">
      <p className="chart-title">{title}</p>
      <div className={`chart-visual ${sectClass}`}>
        <div className="inner-ring" />
        {SIGNS.map((sign, index) => (
          <div
            key={`${title}-${sign}`}
            className="chart-tick"
            style={{
              transform: `translate(-50%, -50%) rotate(${rotationDegrees - index * 30}deg) translateY(-227px)`,
            }}
          />
        ))}
        {SIGNS.map((sign, index) => (
          <div
            key={`${title}-${sign}-label`}
            className={`chart-sign-label ${ascendantSign === sign ? "ascendant" : ""}`}
            style={{
              transform: `translate(-50%, -50%) rotate(${rotationDegrees + 15 - index * 30}deg) translateY(-226px) rotate(${
                -(rotationDegrees + 15 - index * 30)
              }deg)`,
            }}
          >
            <span className="sign-abbr">{sign.slice(0, 3).toUpperCase()}</span>
            <span className="sign-glyph">{signGlyph[sign]}</span>
          </div>
        ))}
        {points.map((point) => {
          const glyph = glyphTone(planetColors[point.planet].fill);
          const affliction = afflictionValues[point.planet] ?? 0;
          const afflictionLevel = getAfflictionLevel(affliction);
          return (
          <div
            key={`${title}-${point.planet}`}
            className={`chart-planet ${activePlanet === point.planet ? "active" : ""} ${
              combusted[point.planet] ? "combusted" : ""
            } ${actionPlanet === point.planet ? "impact" : ""}`}
            style={{
              transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
              backgroundColor: combusted[point.planet]
                ? "rgba(110, 110, 110, 0.9)"
                : planetColors[point.planet].fill,
              boxShadow: combusted[point.planet] ? "none" : `0 0 14px ${planetColors[point.planet].glow}`,
            }}
            onMouseEnter={() => onPlanetHover?.(point.planet)}
            onMouseLeave={() => onPlanetHover?.(null)}
            onClick={() => onPlanetClick?.(point.planet)}
          >
            <span
              className="planet-glyph"
              style={{ color: glyph.color, textShadow: `0 1px 2px ${glyph.shadow}` }}
              aria-hidden="true"
            >
              {planetGlyph[point.planet]}
            </span>
            {combusted[point.planet] && <span className="chart-combust" />}
            {!combusted[point.planet] && (
              <span
                className={`chart-affliction-chip ${point.y < 0 ? "top-half" : ""} affliction-${afflictionLevel} ${
                  highlightAffliction[`${mode}-${point.planet}`] ? "flash" : ""
                }`}
              >
                {affliction}
              </span>
            )}
          </div>
          );
        })}
        {showAspects && (
          <>
            <svg className="chart-aspects chart-aspects-lines" viewBox="-255 -255 510 510">
              {visibleAspects.map(({ aspect, from, to }) => (
                <line
                  key={`${aspect.from}-${aspect.to}-${aspect.aspect}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className={`aspect-line aspect-${aspect.aspect.toLowerCase()} ${
                    actionPlanet ? "impact" : ""
                  } ${highlightLines[`${aspect.from}-${aspect.to}`] ? "active" : ""}`}
                  style={{ opacity: Math.min(1, Math.abs(aspect.multiplier)) }}
                />
              ))}
            </svg>
            <svg className="chart-aspects chart-aspects-labels" viewBox="-255 -255 510 510">
              {visibleAspects.map(({ aspect, labelX, labelY }) => (
                <text
                  key={`${aspect.from}-${aspect.to}-${aspect.aspect}-label`}
                  x={labelX}
                  y={labelY}
                  className="aspect-label"
                >
                  {formatMultiplier(aspect.multiplier)}
                </text>
              ))}
            </svg>
          </>
        )}
      </div>
    </div>
  );
}
