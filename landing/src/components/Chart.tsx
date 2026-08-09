import { useMemo, type MouseEvent } from "react";
import { PLANETS, SIGNS } from "@/game/data";
import { getAspects } from "@/game/aspects";
import {
  CHART_CENTER, CHART_SIZE,
  INNER_RING_R, INVITE_HALO_R, INTERACTION_RING_R, OUTER_RING_R,
  PLANET_R_REST,
  SIGN_LABEL_R, TICK_INNER_R, TICK_OUTER_R,
} from "@/svg/viewbox";
import { PLANET_GLYPH, SIGN_GLYPH } from "@/svg/glyphs";
import { ASPECT_COLOR, NEUTRAL, PLANET_PRIMARY, PLANET_SECONDARY } from "@/svg/palette";
import { CHART_STYLE } from "@/svg/chart-style";
import type { Chart as ChartType, PlanetName, SignName } from "@/game/types";

/**
 * The natal wheel, as the game draws it. This is a showcase copy of the client's
 * Chart (client/src/components/Chart.tsx) carrying only what a resting,
 * hover-only chart needs — no combat state, so no affliction arc, badges,
 * corona, or propagation. Styling values live in svg/chart-style.ts and mirror
 * the client's tokens, so the chart here and the chart in the game read as the
 * same object.
 */

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
}

export interface ChartProps {
  chart: ChartType;
  hoveredPlanet?: PlanetName | null;
  onPlanetHover?: (p: PlanetName | null) => void;
}

export function Chart({ chart, hoveredPlanet, onPlanetHover }: ChartProps) {
  const points = useMemo(() => buildPlanetPoints(chart), [chart]);
  const aspects = useMemo(() => getAspects(chart), [chart]);
  const pointMap = useMemo(() => {
    const m: Record<PlanetName, PlanetPoint> = {} as Record<PlanetName, PlanetPoint>;
    for (const p of points) m[p.planet] = p;
    return m;
  }, [points]);
  const ascSignIdx = SIGNS.indexOf(chart.ascendantSign);

  // Color-field blooms — one radial gradient per planet.
  const fieldBlooms = PLANETS.map((planet) => {
    const pt = pointMap[planet];
    return (
      <circle key={`bloom-${planet}`} cx={pt.cx} cy={pt.cy} r={140} fill={`url(#v2-bloom-${planet})`} />
    );
  });

  // Aspect lines, colored by the pair's harmony. Hovering a planet thickens the
  // lines it owns; nothing else changes, so the web stays legible at rest.
  const aspectLines = aspects.map((a, i) => {
    if (a.from > a.to) return null; // dedupe pairs (getAspects emits both directions)
    const from = pointMap[a.from];
    const to = pointMap[a.to];
    if (!from || !to) return null;
    const isActive = hoveredPlanet === a.from || hoveredPlanet === a.to;
    const isHarmony =
      a.aspect === "Trine" || a.aspect === "Sextile" || a.aspect === "Conjunction";
    const stroke = isHarmony ? ASPECT_COLOR.harmony : ASPECT_COLOR.tension;
    const sw = isActive ? CHART_STYLE.aspect.activeStroke : CHART_STYLE.aspect.restStroke;
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
        stroke={stroke} strokeWidth={sw} strokeOpacity={CHART_STYLE.aspect.opacity}
        strokeLinecap="round" />
    );
  });

  return (
    <svg
      viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
      className="chart-svg"
      role="img"
      aria-label={`${chart.name} natal chart`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {PLANETS.map((p) => {
          const c = PLANET_PRIMARY[p];
          return (
            <radialGradient key={`b-${p}`} id={`v2-bloom-${p}`}>
              <stop offset="0%" stopColor={c} stopOpacity={CHART_STYLE.glow.colorField.core} />
              <stop offset="60%" stopColor={c} stopOpacity={CHART_STYLE.glow.colorField.mid} />
              <stop offset="100%" stopColor={c} stopOpacity="0" />
            </radialGradient>
          );
        })}
        {PLANETS.map((p) => {
          const c = PLANET_PRIMARY[p];
          return (
            <radialGradient key={`h-${p}`} id={`v2-halo-${p}`}>
              <stop offset="0%" stopColor={c} stopOpacity={CHART_STYLE.glow.halo.core} />
              <stop offset="50%" stopColor={c} stopOpacity={CHART_STYLE.glow.halo.mid} />
              <stop offset="100%" stopColor={c} stopOpacity="0" />
            </radialGradient>
          );
        })}
      </defs>

      {/* Field layer */}
      {fieldBlooms}
      {renderSubstrate()}

      {/* Diagram layer: rings + ticks + sign labels + aspect web */}
      <circle cx={CHART_CENTER} cy={CHART_CENTER} r={OUTER_RING_R}
        fill="none" stroke={NEUTRAL.gold} strokeOpacity={CHART_STYLE.ring.outer.opacity} strokeWidth={CHART_STYLE.ring.outer.stroke} />
      <circle cx={CHART_CENTER} cy={CHART_CENTER} r={INNER_RING_R}
        fill="none" stroke={NEUTRAL.gold} strokeOpacity={CHART_STYLE.ring.inner.opacity} strokeWidth={CHART_STYLE.ring.inner.stroke} />
      <SignTicks />
      <SignLabels ascSignIdx={ascSignIdx} />
      {aspectLines}

      {/* Planet layer: halos + glyphs */}
      {points.map((p) => (
        <PlanetGlyph
          key={p.planet}
          point={p}
          hovered={hoveredPlanet === p.planet}
          onHover={onPlanetHover}
        />
      ))}
    </svg>
  );
}

// ─── Internal pieces ────────────────────────────────────────────────────

function PlanetGlyph({
  point, hovered, onHover,
}: {
  point: PlanetPoint;
  hovered: boolean;
  onHover?: (p: PlanetName | null) => void;
}) {
  const c = PLANET_PRIMARY[point.planet];
  const sec = PLANET_SECONDARY[point.planet];
  const r = point.glyphR;

  const handleEnter = onHover ? () => onHover(point.planet) : undefined;
  const handleLeave = onHover ? () => onHover(null) : undefined;
  const handleClick = onHover
    ? (e: MouseEvent) => { e.stopPropagation(); onHover(point.planet); }
    : undefined;

  // Glyph in a deep shade of the planet's own color: colored and high-contrast
  // (via value), but on-palette — same hue family, so no complementary clash
  // and the rainbow corona stays coherent.
  const glyphFill = deepShade(c);

  return (
    <g
      transform={`translate(${point.cx}, ${point.cy})`}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ cursor: onHover ? "pointer" : "default", color: c }}
    >
      {/* Hover = the interaction ring, steady, in mist rather than the planet's
          own hue — which the disc, glyph and halo already carry. The client
          breathes this same ring while a planet is merely tappable; here there
          is only ever the answered reading. */}
      {hovered && (
        <>
          <circle r={INVITE_HALO_R}
            fill={`url(#v2-halo-${point.planet})`}
            style={{ opacity: CHART_STYLE.invite.halo.steady, pointerEvents: "none" }} />
          <circle r={INTERACTION_RING_R} fill="none"
            stroke={NEUTRAL.mist} strokeWidth={CHART_STYLE.interactionRing.stroke}
            className="invite-ring"
            style={{
              // The class's drop-shadow is currentColor, so the glow follows the
              // stroke rather than staying on the planet's hue.
              color: NEUTRAL.mist,
              opacity: CHART_STYLE.interactionRing.steady,
              pointerEvents: "none",
            }} />
        </>
      )}
      <circle r={r}
        fill={c} fillOpacity={CHART_STYLE.planet.discOpacity}
        stroke={sec} strokeOpacity={CHART_STYLE.planet.rimOpacity}
        strokeWidth={Math.max(CHART_STYLE.planet.rimStrokeMin, r * CHART_STYLE.planet.rimStrokeRatio)} />
      <text textAnchor="middle" dominantBaseline="central"
        fontSize={Math.round(r * CHART_STYLE.planet.symbolRatio)}
        fill={glyphFill}
        fontFamily="'Cormorant Garamond', 'Noto Sans Symbols 2', 'Apple Symbols', serif"
        fontWeight={600}
        style={{ pointerEvents: "none", userSelect: "none" }}>
        {PLANET_GLYPH[point.planet]}
      </text>
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
        stroke={NEUTRAL.gold} strokeOpacity={CHART_STYLE.tick.opacity} strokeWidth={CHART_STYLE.tick.stroke} strokeLinecap="round" />,
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
    out.push(
      <g key={`sl_${i}`} transform={`translate(${p.x}, ${p.y})`}>
        <text textAnchor="middle" dominantBaseline="central" y={-12}
          fontSize={20} fill={NEUTRAL.bone} fillOpacity={CHART_STYLE.signLabel.opacity}
          letterSpacing="2"
          fontFamily="'Cormorant Garamond', serif" fontWeight={500}
          style={{ pointerEvents: "none", userSelect: "none" }}>
          {SIGN_LABELS[sign]}
        </text>
        <text textAnchor="middle" dominantBaseline="central" y={14}
          fontSize={22} fill={NEUTRAL.bone} fillOpacity={CHART_STYLE.signLabel.opacity}
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
  const { hexagramR, vesicaR, vesicaOffset } = CHART_STYLE.substrate;
  // Two interlaced hexagrams (four triangles) → a twelve-point star.
  const triangles = [0, 30, 60, 90].map((base) =>
    [0, 120, 240].map((step) => polar(cx, cy, hexagramR, base + step)),
  );
  // Same period, opposite signs — see the client's copy for why the two halves
  // counter-rotate and why they must share one period.
  const turn = (deg: number) =>
    prefersReducedMotion() ? null : (
      <animateTransform attributeName="transform" attributeType="XML" type="rotate"
        from={`0 ${cx} ${cy}`} to={`${deg} ${cx} ${cy}`} dur="120s" repeatCount="indefinite" />
    );
  return (
    <g opacity={CHART_STYLE.substrate.opacity}>
      <g>
        {turn(-360)}
        {triangles.map((tri, i) => (
          <polygon key={`hex_${i}`} points={tri.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none" stroke={NEUTRAL.bone} strokeWidth={CHART_STYLE.substrate.stroke} />
        ))}
      </g>
      {/* Four-fold vesica: left/right + top/bottom. */}
      <g>
        {turn(360)}
        <circle cx={cx - vesicaOffset} cy={cy} r={vesicaR} fill="none" stroke={NEUTRAL.bone} strokeWidth={CHART_STYLE.substrate.stroke} />
        <circle cx={cx + vesicaOffset} cy={cy} r={vesicaR} fill="none" stroke={NEUTRAL.bone} strokeWidth={CHART_STYLE.substrate.stroke} />
        <circle cx={cx} cy={cy - vesicaOffset} r={vesicaR} fill="none" stroke={NEUTRAL.bone} strokeWidth={CHART_STYLE.substrate.stroke} />
        <circle cx={cx} cy={cy + vesicaOffset} r={vesicaR} fill="none" stroke={NEUTRAL.bone} strokeWidth={CHART_STYLE.substrate.stroke} />
      </g>
    </g>
  );
}

/** Whether the OS asks for reduced motion. SMIL can't read the media query, so
 *  we gate the rotation in JS instead (the NFT SVG just always includes it). */
function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ─── Geometry ───────────────────────────────────────────────────────────

/** Polar→Cartesian with y-axis flipped (math convention y-up; SVG y-down).
 *  Sign offset 0 (= ASC sign) sits at deg=180 (left = 9 o'clock = conventional ASC). */
function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

/** Deep shade of a planet's own color for its glyph: same hue, saturation
 *  nudged up, lightness dropped low. Every disc sits at HSL lightness ≥ ~0.5,
 *  so a fixed low-lightness glyph reads with strong value contrast while
 *  staying in the planet's hue family (no off-palette clash). */
function deepShade(hex: string): string {
  const rgb = parseHexColor(hex);
  if (!rgb) return NEUTRAL.void;
  const [h, s] = rgbToHsl(rgb);
  return hslToHex(h, clamp(s * 1.25 + 0.1, 0.45, 0.95), 0.2);
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h = h * 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function parseHexColor(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return null;
  const value = match[1]!;
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
      });
    });
  }
  return out;
}
