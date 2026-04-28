import { useMemo, type CSSProperties, type MouseEvent } from "react";
import { PLANETS, SIGNS } from "@/game/data";
import { getAspects } from "@/game/aspects";
import {
  CHART_CENTER, CHART_SIZE,
  INNER_RING_R, OUTER_RING_R,
  PLANET_R_REST, PLANET_R_ACTIVE, PLANET_HALO_R,
  SIGN_LABEL_R,
  STROKE_HAIRLINE, STROKE_LIGHT, STROKE_REGULAR, STROKE_MEDIUM,
} from "@/svg/viewbox";
import { PLANET_GLYPH, SIGN_GLYPH } from "@/svg/glyphs";
import { NEUTRAL, PLANET_PRIMARY } from "@/svg/palette";
import type { Chart as ChartType, PlanetName, SignName, AspectConnection } from "@/game/types";

/** Optional small numeric chip rendered next to a planet glyph showing projected delta. */
export interface ProjectionChips {
  /** Map of planet → signed delta (positive = harm, negative = heal). */
  deltas: Partial<Record<PlanetName, number>>;
}

interface PlanetPoint {
  planet: PlanetName;
  sign: SignName;
  cx: number;
  cy: number;
  angleRad: number;
}

interface PlanetStatus {
  combusted?: boolean;
  affliction?: number;
}

export interface ChartProps {
  chart: ChartType;
  state?: Partial<Record<PlanetName, PlanetStatus>>;
  /** Planets the player has not yet revealed (Macrobian schedule). Render as hairline ghost glyphs. */
  unlockedPlanets?: PlanetName[];
  /** Tap-preview selection: highlights this planet + draws its aspect lines at Light weight. */
  selectedPlanet?: PlanetName | null;
  /** Always-active planet (e.g. opponent-of-the-turn): pulses + halo. Use null for none. */
  activePlanet?: PlanetName | null;
  /** Hover preview state. */
  hoveredPlanet?: PlanetName | null;
  showHouseWedges?: boolean;
  /** Subtle aspect-graph: hairline at rest. Set false to suppress entirely. */
  showAspects?: boolean;
  /** Larger planet glyphs (e.g. for full-screen chart on title). */
  scale?: number;
  /** Encounter-open ceremonial entrance side ('left' | 'right' | 'none'). */
  entrance?: "left" | "right" | "none";
  side?: "self" | "other";
  onPlanetClick?: (p: PlanetName) => void;
  onPlanetHover?: (p: PlanetName | null) => void;
  /** Receives bounding-box style for placement in narrative chart anchors etc. */
  style?: CSSProperties;
  className?: string;
  /** When true, disables all hover/click affordances (e.g. opponent chart in study mode). */
  passive?: boolean;
  /** Per-aspect override. When omitted, computed from chart. */
  aspects?: AspectConnection[];
  /** Projection chips: numeric +/- delta rendered next to each planet glyph. */
  projection?: ProjectionChips;
}

/**
 * 1000×1000 viewBox chart wheel. Five layers (Field, Diagram, Active, Word).
 * Planets at sign midpoints on the inner ring; cluster spread when multiple share a sign.
 */
export function Chart(props: ChartProps) {
  const {
    chart,
    state,
    unlockedPlanets,
    selectedPlanet,
    activePlanet,
    hoveredPlanet,
    showHouseWedges = true,
    showAspects = true,
    entrance = "none",
    side,
    onPlanetClick,
    onPlanetHover,
    style,
    className,
    passive = false,
    aspects: aspectsProp,
    projection,
  } = props;

  const points = useMemo(() => buildPlanetPoints(chart), [chart]);
  const aspects = useMemo(() => aspectsProp ?? getAspects(chart), [chart, aspectsProp]);
  const pointMap = useMemo(() => {
    const m: Record<PlanetName, PlanetPoint> = {} as Record<PlanetName, PlanetPoint>;
    for (const p of points) m[p.planet] = p;
    return m;
  }, [points]);

  const ascRotationRad = useMemo(() => chartRotationDegrees(chart) * (Math.PI / 180), [chart]);
  const isUnlocked = (p: PlanetName) => (unlockedPlanets ? unlockedPlanets.includes(p) : true);

  const entranceClass =
    entrance === "left" ? "anim-encounter-open-left" :
    entrance === "right" ? "anim-encounter-open-right" :
    "";

  const aspectLines = showAspects
    ? aspects.map((a, i) => {
        if (!isUnlocked(a.from) || !isUnlocked(a.to)) return null;
        const from = pointMap[a.from];
        const to = pointMap[a.to];
        if (!from || !to) return null;
        const isActive = selectedPlanet === a.from || selectedPlanet === a.to ||
                         hoveredPlanet === a.from || hoveredPlanet === a.to;
        const stroke = isActive ? NEUTRAL.bone : NEUTRAL.mist;
        const opacity = isActive ? 0.85 : 0.18;
        const weight = isActive ? STROKE_LIGHT : STROKE_HAIRLINE;
        // glyph-edge to glyph-edge:
        const dx = to.cx - from.cx;
        const dy = to.cy - from.cy;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const x1 = from.cx + ux * PLANET_R_REST;
        const y1 = from.cy + uy * PLANET_R_REST;
        const x2 = to.cx - ux * PLANET_R_REST;
        const y2 = to.cy - uy * PLANET_R_REST;
        return (
          <line
            key={`aspect_${i}_${a.from}_${a.to}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={stroke}
            strokeWidth={weight}
            opacity={opacity}
            strokeLinecap="round"
          />
        );
      })
    : null;

  const handleClick = onPlanetClick && !passive ? onPlanetClick : undefined;
  const handleHover = onPlanetHover && !passive ? onPlanetHover : undefined;

  return (
    <svg
      viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
      className={[entranceClass, className ?? ""].filter(Boolean).join(" ")}
      style={{ width: "100%", height: "100%", maxWidth: "100%", maxHeight: "100%", ...style }}
      role="img"
      aria-label={`${chart.name} natal chart${side === "other" ? " (opponent)" : ""}`}
    >
      {/* ── Field layer ─────────────────────────────────────────────────── */}
      <g>
        {/* Whole-sign house wedges anchored to ASC sign */}
        {showHouseWedges && <HouseWedges chart={chart} />}
        {/* Sign divisions — 12 hairline ticks from inner ring to outer ring */}
        <SignDivisions ascRotationRad={ascRotationRad} />
      </g>

      {/* ── Diagram layer ───────────────────────────────────────────────── */}
      <g>
        <circle
          cx={CHART_CENTER} cy={CHART_CENTER} r={OUTER_RING_R}
          fill="none" stroke={NEUTRAL.bone} strokeWidth={STROKE_REGULAR} opacity={0.85}
        />
        <circle
          cx={CHART_CENTER} cy={CHART_CENTER} r={INNER_RING_R}
          fill="none" stroke={NEUTRAL.mist} strokeWidth={STROKE_LIGHT} opacity={0.6}
        />

        {/* Ascendant marker — single radial line from inner to outer ring at rising sign's leading edge */}
        <AscendantMarker chart={chart} ascRotationRad={ascRotationRad} />

        {/* Sign glyphs at outer edge */}
        <SignGlyphs ascRotationRad={ascRotationRad} />

        {/* Aspect lines */}
        {aspectLines}
      </g>

      {/* ── Active + Word layer ─────────────────────────────────────────── */}
      <g>
        {points.map((p) => {
          const status = state?.[p.planet];
          const combusted = status?.combusted ?? false;
          const unlocked = isUnlocked(p.planet);
          const isSelected = selectedPlanet === p.planet;
          const isActive = activePlanet === p.planet;
          const isHovered = hoveredPlanet === p.planet;
          const projectedDelta = projection?.deltas[p.planet];
          return (
            <PlanetGlyph
              key={p.planet}
              point={p}
              combusted={combusted}
              affliction={status?.affliction ?? 0}
              ghost={!unlocked}
              selected={isSelected}
              active={isActive}
              hovered={isHovered}
              onClick={handleClick}
              onHover={handleHover}
              passive={passive}
              projectedDelta={projectedDelta}
            />
          );
        })}
      </g>
    </svg>
  );
}

// ── Internal pieces ─────────────────────────────────────────────────────

function PlanetGlyph({
  point, combusted, affliction, ghost,
  selected, active, hovered,
  onClick, onHover, passive,
  projectedDelta,
}: {
  point: PlanetPoint;
  combusted: boolean;
  affliction: number;
  ghost: boolean;
  selected: boolean;
  active: boolean;
  hovered: boolean;
  onClick?: (p: PlanetName) => void;
  onHover?: (p: PlanetName | null) => void;
  passive: boolean;
  projectedDelta?: number;
}) {
  const color = PLANET_PRIMARY[point.planet];
  const radius = active ? PLANET_R_ACTIVE : PLANET_R_REST;
  const interactive = !passive && (!!onClick || !!onHover) && !combusted && !ghost;

  const handleClick = onClick && interactive
    ? (e: MouseEvent) => {
        e.stopPropagation();
        onClick(point.planet);
      }
    : undefined;
  const handleEnter = onHover && interactive ? () => onHover(point.planet) : undefined;
  const handleLeave = onHover && interactive ? () => onHover(null) : undefined;

  // Halo for active planet
  return (
    <g
      transform={`translate(${point.cx}, ${point.cy})`}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ cursor: interactive ? "pointer" : "default" }}
      className={combusted ? "anim-combust" : undefined}
    >
      {active && (
        <circle
          r={PLANET_HALO_R}
          fill="url(#none)"
          stroke={color}
          strokeWidth={STROKE_MEDIUM}
          opacity={0.5}
          className="anim-pulse-active"
        />
      )}
      {/* Selection ring */}
      {selected && (
        <circle
          r={radius + 8}
          fill="none"
          stroke={NEUTRAL.bone}
          strokeWidth={STROKE_LIGHT}
          opacity={0.95}
        />
      )}
      {hovered && !selected && (
        <circle
          r={radius + 6}
          fill="none"
          stroke={NEUTRAL.mist}
          strokeWidth={STROKE_HAIRLINE}
          opacity={0.85}
        />
      )}
      {/* Disk */}
      <circle
        r={radius}
        fill={ghost ? "none" : color}
        stroke={ghost ? NEUTRAL.mist : NEUTRAL.void}
        strokeWidth={ghost ? STROKE_HAIRLINE : STROKE_REGULAR}
        opacity={ghost ? 0.6 : 0.96}
      />
      {/* Glyph */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Cormorant Garamond', Garamond, serif"
        fontSize={radius * 1.15}
        fill={ghost ? NEUTRAL.mist : NEUTRAL.void}
        opacity={ghost ? 0.8 : 1}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {PLANET_GLYPH[point.planet]}
      </text>
      {/* Affliction badge — small Inter-set numeric to the upper-right */}
      {!ghost && !combusted && affliction > 0 && (
        <g transform={`translate(${radius * 0.85}, ${-radius * 0.85})`}>
          <circle r={12} fill={NEUTRAL.void} stroke={PLANET_PRIMARY.Mars} strokeWidth={STROKE_HAIRLINE} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'Inter', system-ui, sans-serif"
            fontSize={11}
            fill={NEUTRAL.bone}
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            {Math.round(affliction)}
          </text>
        </g>
      )}
      {/* Projection chip — projected delta if previewing a turn. */}
      {!ghost && !combusted && projectedDelta !== undefined && projectedDelta !== 0 && (
        <g transform={`translate(${radius * 1.4}, 0)`}>
          <text
            textAnchor="start"
            dominantBaseline="central"
            fontFamily="'Inter', system-ui, sans-serif"
            fontSize={13}
            fontWeight={500}
            fill={projectedDelta > 0 ? PLANET_PRIMARY.Mars : NEUTRAL.bone}
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            {projectedDelta > 0 ? "+" : "−"}{Math.abs(projectedDelta).toFixed(1).replace(/\.0$/, "")}
          </text>
        </g>
      )}
    </g>
  );
}

function HouseWedges({ chart }: { chart: ChartType }) {
  const ascIdx = SIGNS.indexOf(chart.ascendantSign);
  // Render 12 faint Field-layer arcs: each house spans 30° of the outer ring,
  // anchored to the ascendant sign's leading edge.
  const wedges = [];
  for (let i = 0; i < 12; i++) {
    const start = degToRad(-((ascIdx + i) * 30 + 90)); // place ASC at 9 o'clock
    const end = degToRad(-((ascIdx + i + 1) * 30 + 90));
    const x1 = CHART_CENTER + Math.cos(start) * OUTER_RING_R;
    const y1 = CHART_CENTER + Math.sin(start) * OUTER_RING_R;
    const x2 = CHART_CENTER + Math.cos(end) * OUTER_RING_R;
    const y2 = CHART_CENTER + Math.sin(end) * OUTER_RING_R;
    const inner1 = {
      x: CHART_CENTER + Math.cos(start) * INNER_RING_R,
      y: CHART_CENTER + Math.sin(start) * INNER_RING_R,
    };
    const inner2 = {
      x: CHART_CENTER + Math.cos(end) * INNER_RING_R,
      y: CHART_CENTER + Math.sin(end) * INNER_RING_R,
    };
    // Wedge ribbon between rings — only the Field layer flourish.
    const houseNum = i + 1;
    const opacity = houseNum === 1 ? 0.16 : 0.06;
    const path =
      `M ${inner1.x} ${inner1.y} ` +
      `L ${x1} ${y1} ` +
      `A ${OUTER_RING_R} ${OUTER_RING_R} 0 0 0 ${x2} ${y2} ` +
      `L ${inner2.x} ${inner2.y} ` +
      `A ${INNER_RING_R} ${INNER_RING_R} 0 0 1 ${inner1.x} ${inner1.y} Z`;
    wedges.push(
      <path key={`house_${houseNum}`} d={path} fill={NEUTRAL.bone} opacity={opacity} />,
    );
  }
  return <g>{wedges}</g>;
}

function SignDivisions({ ascRotationRad }: { ascRotationRad: number }) {
  const lines = [];
  for (let i = 0; i < 12; i++) {
    const angle = (-i * 30 - 90) * (Math.PI / 180) + ascRotationRad;
    const x1 = CHART_CENTER + Math.cos(angle) * INNER_RING_R;
    const y1 = CHART_CENTER + Math.sin(angle) * INNER_RING_R;
    const x2 = CHART_CENTER + Math.cos(angle) * OUTER_RING_R;
    const y2 = CHART_CENTER + Math.sin(angle) * OUTER_RING_R;
    lines.push(
      <line
        key={`div_${i}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={NEUTRAL.mist}
        strokeWidth={STROKE_HAIRLINE}
        opacity={0.55}
      />,
    );
  }
  return <g>{lines}</g>;
}

function SignGlyphs({ ascRotationRad }: { ascRotationRad: number }) {
  const out = [];
  for (let i = 0; i < 12; i++) {
    const sign = SIGNS[i]!;
    const angle = (-i * 30 - 90 + 15) * (Math.PI / 180) + ascRotationRad;
    const x = CHART_CENTER + Math.cos(angle) * SIGN_LABEL_R;
    const y = CHART_CENTER + Math.sin(angle) * SIGN_LABEL_R;
    out.push(
      <text
        key={sign}
        x={x} y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Cormorant Garamond', Garamond, serif"
        fontSize={20}
        fill={NEUTRAL.mist}
        opacity={0.7}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {SIGN_GLYPH[sign]}
      </text>,
    );
  }
  return <g>{out}</g>;
}

function AscendantMarker({ chart, ascRotationRad }: { chart: ChartType; ascRotationRad: number }) {
  // Leading edge of the rising sign — angle of sign division at ASC sign index.
  const ascIdx = SIGNS.indexOf(chart.ascendantSign);
  const angle = (-ascIdx * 30 - 90) * (Math.PI / 180) + ascRotationRad;
  const x1 = CHART_CENTER + Math.cos(angle) * INNER_RING_R;
  const y1 = CHART_CENTER + Math.sin(angle) * INNER_RING_R;
  const x2 = CHART_CENTER + Math.cos(angle) * OUTER_RING_R;
  const y2 = CHART_CENTER + Math.sin(angle) * OUTER_RING_R;
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={NEUTRAL.bone}
      strokeWidth={STROKE_LIGHT}
      opacity={0.95}
    />
  );
}

// ── Geometry ────────────────────────────────────────────────────────────

const ASCENDANT_TARGET_DEG = 165; // 8:30 on the wheel — conventional 1st house left

function chartRotationDegrees(chart: ChartType): number {
  const ascIdx = SIGNS.indexOf(chart.ascendantSign);
  // Center of ASC sign in the unrotated layout = -ascIdx * 30 - 75 (sign midpoint at -90 + 15)
  const ascCenter = -ascIdx * 30 - 75;
  return ASCENDANT_TARGET_DEG - ascCenter;
}

function degToRad(d: number) {
  return d * (Math.PI / 180);
}

function buildPlanetPoints(chart: ChartType): PlanetPoint[] {
  const rotation = chartRotationDegrees(chart) * (Math.PI / 180);
  const bySign = new Map<SignName, PlanetName[]>();
  for (const p of PLANETS) {
    const sign = chart.planets[p].sign;
    const arr = bySign.get(sign) ?? [];
    arr.push(p);
    bySign.set(sign, arr);
  }

  const SPREAD = 30;            // radial offset per cluster step (units)
  const ANGLE_STEP_DEG = 7;     // angular spread per cluster step

  return PLANETS.map((planet) => {
    const sign = chart.planets[planet].sign;
    const idx = SIGNS.indexOf(sign);
    const baseAngle = (-idx * 30 - 90 + 15) * (Math.PI / 180);
    const cluster = bySign.get(sign) ?? [];
    const position = cluster.indexOf(planet);
    const offset = cluster.length > 1 ? (position - (cluster.length - 1) / 2) : 0;
    const angle = baseAngle + offset * (ANGLE_STEP_DEG * Math.PI / 180) + rotation;
    const r = INNER_RING_R + offset * SPREAD * 0.4;
    const cx = CHART_CENTER + Math.cos(angle) * r;
    const cy = CHART_CENTER + Math.sin(angle) * r;
    return { planet, sign, cx, cy, angleRad: angle };
  });
}
