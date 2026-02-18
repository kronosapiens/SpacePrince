import type { AspectConnection, PlanetName } from "../game/types";
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
  mode,
}: ChartVisualProps) {
  return (
    <div className="chart-shell">
      <p className="chart-title">{title}</p>
      <div className={`chart-visual ${diurnal === undefined ? "" : diurnal ? "diurnal" : "nocturnal"}`}>
        <div className="inner-ring" />
        {SIGNS.map((sign, index) => (
          <div
            key={`${title}-${sign}`}
            className="chart-tick"
            style={{
              transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-235px)`,
            }}
          />
        ))}
        {SIGNS.map((sign, index) => (
          <div
            key={`${title}-${sign}-label`}
            className="chart-sign-label"
            style={{
              transform: `translate(-50%, -50%) rotate(${index * 30 + 15}deg) translateY(-226px) rotate(${
                -(index * 30 + 15)
              }deg)`,
            }}
          >
            {sign.slice(0, 3).toUpperCase()}
          </div>
        ))}
        {points.map((point) => (
          <div
            key={`${title}-${point.planet}`}
            className={`chart-planet ${activePlanet === point.planet ? "active" : ""} ${
              combusted[point.planet] ? "combusted" : ""
            } ${actionPlanet === point.planet ? "impact" : ""}`}
            style={{
              transform: `translate(${point.x}px, ${point.y}px)`,
              backgroundColor: planetColors[point.planet].fill,
              boxShadow: `0 0 14px ${planetColors[point.planet].glow}`,
              filter: combusted[point.planet] ? "grayscale(1) brightness(0.7)" : "none",
            }}
            onMouseEnter={() => onPlanetHover?.(point.planet)}
            onMouseLeave={() => onPlanetHover?.(null)}
            onClick={() => onPlanetClick?.(point.planet)}
          >
            {combusted[point.planet] && <span className="chart-x">×</span>}
            <span className="chart-label" style={point.y > 0 ? { top: "-20px" } : undefined}>
              {point.planet.slice(0, 3).toUpperCase()}
            </span>
            <span
              className={`chart-affliction affliction-${getAfflictionLevel(
                afflictionValues[point.planet] ?? 0
              )} ${highlightAffliction[`${mode}-${point.planet}`] ? "flash" : ""}`}
              style={point.y > 0 ? { top: "-38px" } : undefined}
            >
              {afflictionValues[point.planet] ?? 0}
            </span>
          </div>
        ))}
        {showAspects && (
          <svg className="chart-aspects" viewBox="-270 -270 540 540">
            {activeAspects.map((aspect) => {
              const from = pointMap[aspect.from];
              const to = pointMap[aspect.to];
              if (!from || !to) return null;
              return (
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
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
