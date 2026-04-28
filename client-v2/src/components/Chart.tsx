import { useMemo, type CSSProperties, type MouseEvent } from "react";
import { PLANETS, SIGN_ELEMENT, SIGNS } from "@/game/data";
import { getAspects } from "@/game/aspects";
import {
  CHART_CENTER, CHART_SIZE,
  INNER_RING_R, OUTER_RING_R,
  PLANET_R_REST, PLANET_R_ACTIVE, PLANET_HALO_R,
  SIGN_LABEL_R, TICK_INNER_R, TICK_OUTER_R,
  STROKE_LIGHT,
} from "@/svg/viewbox";
import { PLANET_GLYPH, SIGN_GLYPH } from "@/svg/glyphs";
import { NEUTRAL, PLANET_PRIMARY, PLANET_SECONDARY, SIGN_ELEMENT_COLOR } from "@/svg/palette";
import type {
  AspectConnection,
  Chart as ChartType,
  PlanetName,
  SignName,
} from "@/game/types";

const SIGN_LABELS: Record<SignName, string> = {
  Aries: "ARI", Taurus: "TAU", Gemini: "GEM", Cancer: "CAN",
  Leo: "LEO", Virgo: "VIR", Libra: "LIB", Scorpio: "SCO",
  Sagittarius: "SAG", Capricorn: "CAP", Aquarius: "AQU", Pisces: "PIS",
};

/** Hand-tuned cluster patterns per stack size (from Claude Design v2).
 *  Each entry is [radius, angle-offset-deg]. Sized to read at 1-7 stack. */
const CLUSTER_PATTERNS: Record<number, Array<[number, number]>> = {
  1: [[308, 0]],
  2: [[315, 8], [315, -8]],
  3: [[315, 8], [315, -8], [236, 0]],
  4: [[315, 0], [243, 10.45], [243, -10.45], [162, 0]],
  5: [[320, 13.91], [320, 0], [320, -13.91], [246.26, 9.05], [246.26, -9.05]],
  6: [[320, 13.91], [320, 0], [320, -13.91], [246.26, 9.05], [246.26, -9.05], [175.76, 0]],
  7: [[320, 13.91], [320, 0], [320, -13.91], [246.26, 9.05], [246.26, -9.05], [175.76, 0], [98.26, 0]],
};

/** Slow planets (Saturn) on the rim, fast personal planets (Moon) toward center. */
const SPEED_ORDER: PlanetName[] = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];

interface PlanetPoint {
  planet: PlanetName;
  sign: SignName;
  cx: number;
  cy: number;
  glyphR: number;
  glyphRActive: number;
}

interface PlanetStatus {
  combusted?: boolean;
  affliction?: number;
}

export interface ProjectionChips {
  deltas: Partial<Record<PlanetName, number>>;
}

export interface ChartProps {
  chart: ChartType;
  state?: Partial<Record<PlanetName, PlanetStatus>>;
  /** Planets the player has not yet revealed. Render as ghost (dashed outline, faded glyph). */
  unlockedPlanets?: PlanetName[];
  /** Tap-preview selection. Highlights planet with gold inspect ring, brightens its aspects. */
  selectedPlanet?: PlanetName | null;
  /** Always-active planet (e.g. opponent-of-the-turn). Pulses with full halo. */
  activePlanet?: PlanetName | null;
  /** Hover preview state. */
  hoveredPlanet?: PlanetName | null;
  /** Sustained inspection (Chart Study). Brighter aspects, gold ring. */
  inspectPlanet?: PlanetName | null;
  /** Show the af Klint color-field blooms behind each visible planet. Default true. */
  showColorField?: boolean;
  /** Show the sacred-geometry substrate (hexagram + vesica). Mint + Chart Study. */
  showSubstrate?: boolean;
  /** Subtle aspect-graph: hairline at rest. */
  showAspects?: boolean;
  scale?: number;
  entrance?: "left" | "right" | "none";
  side?: "self" | "other";
  onPlanetClick?: (p: PlanetName) => void;
  onPlanetHover?: (p: PlanetName | null) => void;
  style?: CSSProperties;
  className?: string;
  passive?: boolean;
  aspects?: AspectConnection[];
  projection?: ProjectionChips;
}

export function Chart(props: ChartProps) {
  const {
    chart,
    state,
    unlockedPlanets,
    selectedPlanet,
    activePlanet,
    hoveredPlanet,
    inspectPlanet,
    showColorField = true,
    showSubstrate = false,
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
  const ascSignIdx = SIGNS.indexOf(chart.ascendantSign);

  const isUnlocked = (p: PlanetName) => (unlockedPlanets ? unlockedPlanets.includes(p) : true);

  const entranceClass =
    entrance === "left" ? "anim-encounter-open-left" :
    entrance === "right" ? "anim-encounter-open-right" :
    "";

  // Color-field blooms — one radial gradient per visible non-combust planet.
  const fieldBlooms = showColorField
    ? PLANETS.map((planet) => {
        if (!isUnlocked(planet)) return null;
        if (state?.[planet]?.combusted) return null;
        const pt = pointMap[planet];
        return (
          <circle key={`bloom-${planet}`} cx={pt.cx} cy={pt.cy} r={140} fill={`url(#v2-bloom-${planet})`} />
        );
    })
    : null;

  // Aspect lines, colored by source planet's harmony.
  const aspectLines = showAspects
    ? aspects.map((a, i) => {
        if (!isUnlocked(a.from) || !isUnlocked(a.to)) return null;
        if (a.from > a.to) return null; // dedupe pairs (getAspects emits both directions)
        const from = pointMap[a.from];
        const to = pointMap[a.to];
        if (!from || !to) return null;
        const isActive = activePlanet === a.from || activePlanet === a.to ||
                         hoveredPlanet === a.from || hoveredPlanet === a.to ||
                         selectedPlanet === a.from || selectedPlanet === a.to;
        const isInspect = inspectPlanet === a.from || inspectPlanet === a.to;
        const fromC = PLANET_PRIMARY[a.from];
        const fromS = PLANET_SECONDARY[a.from];
        const stroke =
          a.aspect === "Trine" || a.aspect === "Sextile" || a.aspect === "Conjunction" ? fromC :
          a.aspect === "Square" ? fromS :
          NEUTRAL.mist;
        const opacity = isActive ? 0.95 : isInspect ? 0.75 : 0.35;
        const sw = isActive ? 2 : isInspect ? 1.4 : 0.8;
        const dx = to.cx - from.cx;
        const dy = to.cy - from.cy;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const ra = from.glyphR + 4;
        const rb = to.glyphR + 4;
        return (
          <line key={`aspect_${i}`}
            x1={from.cx + ux * ra} y1={from.cy + uy * ra}
            x2={to.cx - ux * rb} y2={to.cy - uy * rb}
            stroke={stroke} strokeWidth={sw} strokeOpacity={opacity} strokeLinecap="round" />
        );
      })
    : null;

  const handleClick = onPlanetClick && !passive ? onPlanetClick : undefined;
  const handleHover = onPlanetHover && !passive ? onPlanetHover : undefined;

  // Substrate (hexagram + vesica) — only when explicitly requested.
  const substrate = showSubstrate ? renderSubstrate() : null;

  // ASC line — full horizontal cut across the inner ring.
  const ascLeft = polar(CHART_CENTER, CHART_CENTER, INNER_RING_R, 180);
  const ascRight = polar(CHART_CENTER, CHART_CENTER, INNER_RING_R, 0);

  return (
    <svg
      viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
      className={[entranceClass, className ?? ""].filter(Boolean).join(" ")}
      style={{ width: "100%", height: "100%", ...style }}
      role="img"
      aria-label={`${chart.name} natal chart${side === "other" ? " (opponent)" : ""}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {PLANETS.map((p) => {
          const c = PLANET_PRIMARY[p];
          return (
            <radialGradient key={`b-${p}`} id={`v2-bloom-${p}`}>
              <stop offset="0%" stopColor={c} stopOpacity="0.32" />
              <stop offset="60%" stopColor={c} stopOpacity="0.08" />
              <stop offset="100%" stopColor={c} stopOpacity="0" />
            </radialGradient>
          );
        })}
        {PLANETS.map((p) => {
          const c = PLANET_PRIMARY[p];
          return (
            <radialGradient key={`h-${p}`} id={`v2-halo-${p}`}>
              <stop offset="0%" stopColor={c} stopOpacity="0.7" />
              <stop offset="50%" stopColor={c} stopOpacity="0.18" />
              <stop offset="100%" stopColor={c} stopOpacity="0" />
            </radialGradient>
          );
        })}
      </defs>

      {/* Field layer */}
      {fieldBlooms}
      {substrate}

      {/* Diagram layer: rings + ticks + sign labels + ASC line + aspect web */}
      <circle cx={CHART_CENTER} cy={CHART_CENTER} r={OUTER_RING_R}
        fill="none" stroke={NEUTRAL.gold} strokeOpacity="0.55" strokeWidth={1.5} />
      <circle cx={CHART_CENTER} cy={CHART_CENTER} r={INNER_RING_R}
        fill="none" stroke={NEUTRAL.gold} strokeOpacity="0.45" strokeWidth={1} />
      <SignTicks />
      <line x1={ascLeft.x} y1={ascLeft.y} x2={ascRight.x} y2={ascRight.y}
        stroke={NEUTRAL.gold} strokeOpacity="0.55" strokeWidth={1} />
      <SignLabels ascSignIdx={ascSignIdx} />
      {aspectLines}

      {/* Active + Word layer: planets + halos + glyphs + badges */}
      {points.map((p) => {
        const status = state?.[p.planet];
        const combusted = status?.combusted ?? false;
        const unlocked = isUnlocked(p.planet);
        const isSelected = selectedPlanet === p.planet;
        const isActive = activePlanet === p.planet;
        const isHovered = hoveredPlanet === p.planet;
        const isInspect = inspectPlanet === p.planet;
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
            inspect={isInspect}
            onClick={handleClick}
            onHover={handleHover}
            passive={passive}
            projectedDelta={projectedDelta}
          />
        );
      })}
    </svg>
  );
}

// ─── Internal pieces ────────────────────────────────────────────────────

function PlanetGlyph({
  point, combusted, affliction, ghost,
  selected, active, hovered, inspect,
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
  inspect: boolean;
  onClick?: (p: PlanetName) => void;
  onHover?: (p: PlanetName | null) => void;
  passive: boolean;
  projectedDelta?: number;
}) {
  const c = PLANET_PRIMARY[point.planet];
  const sec = PLANET_SECONDARY[point.planet];
  const r = active ? point.glyphRActive : point.glyphR;
  const interactive = !passive && (!!onClick || !!onHover) && !combusted && !ghost;

  const handleClick = onClick && interactive
    ? (e: MouseEvent) => { e.stopPropagation(); onClick(point.planet); }
    : undefined;
  const handleEnter = onHover && interactive ? () => onHover(point.planet) : undefined;
  const handleLeave = onHover && interactive ? () => onHover(null) : undefined;

  if (ghost) {
    // Same shape, ghostly.
    return (
      <g transform={`translate(${point.cx}, ${point.cy})`}>
        <circle r={point.glyphR} fill="none"
          stroke={c} strokeOpacity={0.35} strokeWidth={Math.max(1, point.glyphR * 0.05)}
          strokeDasharray="2 4" />
        <text textAnchor="middle" dominantBaseline="central"
          fontSize={Math.round(point.glyphR * 0.85)} fill={c} fillOpacity={0.4}
          fontFamily="'Cormorant Garamond', 'Noto Sans Symbols 2', 'Apple Symbols', serif"
          fontWeight={600}
          style={{ pointerEvents: "none", userSelect: "none" }}>
          {PLANET_GLYPH[point.planet]}
        </text>
      </g>
    );
  }

  const fill = combusted ? "#3B2F2F" : c;
  const fillOpacity = combusted ? 0.4 : 0.92;
  const glyphFill = combusted ? NEUTRAL.mist : NEUTRAL.void;

  // Affliction badge — center-facing side of planet, half in / half out.
  const dx = CHART_CENTER - point.cx;
  const dy = CHART_CENTER - point.cy;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const badgeOffset = r;
  const badgeR = Math.max(9, r * 0.4);
  const badgeFontSize = Math.max(11, Math.round(r * 0.46));

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
        <circle r={PLANET_HALO_R} fill={`url(#v2-halo-${point.planet})`} className="anim-pulse-active" />
      )}
      {(inspect || selected) && !active && (
        <circle r={point.glyphR + 10} fill="none"
          stroke={NEUTRAL.goldHi} strokeOpacity="0.85" strokeWidth={1.2} />
      )}
      {hovered && !selected && !inspect && (
        <circle r={point.glyphR + 6} fill="none"
          stroke={NEUTRAL.bone} strokeOpacity="0.6" strokeWidth={STROKE_LIGHT} />
      )}
      <circle r={r}
        fill={fill} fillOpacity={fillOpacity}
        stroke={sec} strokeOpacity="0.9" strokeWidth={Math.max(1, r * 0.05)} />
      <text textAnchor="middle" dominantBaseline="central"
        fontSize={Math.round(r * 0.85)}
        fill={glyphFill}
        fontFamily="'Cormorant Garamond', 'Noto Sans Symbols 2', 'Apple Symbols', serif"
        fontWeight={600}
        style={{ pointerEvents: "none", userSelect: "none" }}>
        {PLANET_GLYPH[point.planet]}
      </text>
      {!combusted && affliction > 0 && (
        <g transform={`translate(${ux * badgeOffset}, ${uy * badgeOffset})`}>
          <circle r={badgeR} fill={NEUTRAL.void} stroke={c} strokeOpacity="0.85" strokeWidth={1.2} />
          <text textAnchor="middle" dominantBaseline="central"
            fontSize={badgeFontSize} fill={NEUTRAL.bone}
            fontFamily="'Inter', sans-serif" fontWeight={500}
            style={{ pointerEvents: "none", userSelect: "none" }}>
            {Math.round(affliction)}
          </text>
        </g>
      )}
      {!combusted && projectedDelta !== undefined && projectedDelta !== 0 && (
        <g transform={`translate(${r * 1.4}, 0)`}>
          <text textAnchor="start" dominantBaseline="central"
            fontFamily="'Inter', system-ui, sans-serif"
            fontSize={13} fontWeight={500}
            fill={projectedDelta > 0 ? PLANET_PRIMARY.Mars : NEUTRAL.bone}
            style={{ userSelect: "none", pointerEvents: "none" }}>
            {projectedDelta > 0 ? "+" : "−"}{Math.abs(projectedDelta).toFixed(1).replace(/\.0$/, "")}
          </text>
        </g>
      )}
    </g>
  );
}

function SignTicks() {
  const lines = [];
  for (let i = 0; i < 12; i++) {
    const ang = 180 + i * 30;
    const a = polar(CHART_CENTER, CHART_CENTER, TICK_INNER_R, ang);
    const b = polar(CHART_CENTER, CHART_CENTER, TICK_OUTER_R, ang);
    lines.push(
      <line key={`tick_${i}`}
        x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke={NEUTRAL.gold} strokeOpacity="0.85" strokeWidth={2.5} strokeLinecap="round" />,
    );
  }
  return <g>{lines}</g>;
}

function SignLabels({ ascSignIdx }: { ascSignIdx: number }) {
  const out = [];
  for (let i = 0; i < 12; i++) {
    const sign = SIGNS[i]!;
    const offset = (i - ascSignIdx + 12) % 12;
    const ang = 180 + offset * 30 + 15;
    const p = polar(CHART_CENTER, CHART_CENTER, SIGN_LABEL_R, ang);
    const color = SIGN_ELEMENT_COLOR[SIGN_ELEMENT[sign]];
    out.push(
      <g key={`sl_${i}`} transform={`translate(${p.x}, ${p.y})`}>
        <text textAnchor="middle" dominantBaseline="central" y={-12}
          fontSize={20} fill={color} fillOpacity="0.85"
          letterSpacing="2"
          fontFamily="'Cormorant Garamond', serif" fontWeight={500}
          style={{ pointerEvents: "none", userSelect: "none" }}>
          {SIGN_LABELS[sign]}
        </text>
        <text textAnchor="middle" dominantBaseline="central" y={14}
          fontSize={22} fill={color} fillOpacity="0.85"
          fontFamily="'Cormorant Garamond', 'Noto Sans Symbols 2', 'Apple Symbols', serif"
          style={{ pointerEvents: "none", userSelect: "none" }}>
          {SIGN_GLYPH[sign]}
        </text>
      </g>,
    );
  }
  return <g>{out}</g>;
}

function renderSubstrate() {
  const cx = CHART_CENTER, cy = CHART_CENTER;
  const r = INNER_RING_R - 20;
  const tri1: Array<{ x: number; y: number }> = [];
  const tri2: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 3; i++) {
    tri1.push(polar(cx, cy, r, 90 + i * 120));
    tri2.push(polar(cx, cy, r, 270 + i * 120));
  }
  return (
    <g opacity={0.18}>
      <polygon points={tri1.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none" stroke={NEUTRAL.bone} strokeWidth={0.5} />
      <polygon points={tri2.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none" stroke={NEUTRAL.bone} strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={INNER_RING_R - 80}
        fill="none" stroke={NEUTRAL.bone} strokeWidth={0.5} />
      <circle cx={cx - 60} cy={cy} r={INNER_RING_R - 100}
        fill="none" stroke={NEUTRAL.bone} strokeWidth={0.5} />
      <circle cx={cx + 60} cy={cy} r={INNER_RING_R - 100}
        fill="none" stroke={NEUTRAL.bone} strokeWidth={0.5} />
    </g>
  );
}

// ─── Geometry ───────────────────────────────────────────────────────────

/** Polar→Cartesian with y-axis flipped (math convention y-up; SVG y-down).
 *  Sign offset 0 (= ASC sign) sits at deg=180 (left = 9 o'clock = conventional ASC). */
function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function signMidDeg(signIdx: number, ascSignIdx: number): number {
  const offset = (signIdx - ascSignIdx + 12) % 12;
  return 180 + offset * 30 + 15;
}

function buildPlanetPoints(chart: ChartType): PlanetPoint[] {
  const ascIdx = SIGNS.indexOf(chart.ascendantSign);
  const bySign = new Map<SignName, PlanetName[]>();
  for (const planet of PLANETS) {
    const sign = chart.planets[planet].sign;
    const arr = bySign.get(sign) ?? [];
    arr.push(planet);
    bySign.set(sign, arr);
  }

  const out: PlanetPoint[] = [];
  for (const [sign, group] of bySign) {
    const sortedGroup = [...group].sort(
      (a, b) => SPEED_ORDER.indexOf(a) - SPEED_ORDER.indexOf(b),
    );
    const signIdx = SIGNS.indexOf(sign);
    const baseAng = signMidDeg(signIdx, ascIdx);
    const n = sortedGroup.length;
    const pattern = CLUSTER_PATTERNS[n] ?? CLUSTER_PATTERNS[7]!;
    sortedGroup.forEach((planet, i) => {
      const slot = pattern[i] ?? pattern[pattern.length - 1]!;
      const r = slot[0];
      const dAng = slot[1];
      const ang = baseAng + dAng;
      const cart = polar(CHART_CENTER, CHART_CENTER, r, ang);
      out.push({
        planet,
        sign,
        cx: cart.x,
        cy: cart.y,
        glyphR: PLANET_R_REST,
        glyphRActive: PLANET_R_ACTIVE,
      });
    });
  }
  return out;
}
