import { useMemo, type CSSProperties, type MouseEvent } from "react";
import { PLANETS, SIGNS } from "@/game/data";
import { getAspects } from "@/game/aspects";
import { PropagationLine } from "@/components/PropagationLine";
import {
  CHART_CENTER, CHART_SIZE,
  INNER_RING_R, OUTER_RING_R,
  PLANET_R_REST, PLANET_R_ACTIVE,
  SIGN_LABEL_R, TICK_INNER_R, TICK_OUTER_R,
  STROKE_LIGHT,
} from "@/svg/viewbox";
import { PLANET_GLYPH, SIGN_GLYPH } from "@/svg/glyphs";
import { ASPECT_COLOR, NEUTRAL, PLANET_PRIMARY, PLANET_SECONDARY } from "@/svg/palette";
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
  /** When true, every visible planet renders in active state (full halo + larger glyph).
   *  Used for ceremonial / hero stages like the Title screen. */
  allActive?: boolean;
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
  /** Hide affliction count badges. Title / Mint use this; gameplay screens don't. */
  hideAfflictionBadges?: boolean;
  /** Show affliction badges even when value is zero. Used on gameplay surfaces. */
  alwaysShowAfflictionBadges?: boolean;
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
  /** Directed aspect keys (`Source->Target`) currently propagating. */
  activePropagationKeys?: ReadonlySet<string>;
  /** One-shot glow pulse for the action planet (player or opponent) on direct hit. */
  actionPulsePlanet?: PlanetName | null;
  /** Planets whose affliction badge should pulse (took a hit this beat). */
  impactPlanets?: ReadonlySet<PlanetName>;
  /** Planets whose direct hit was a crit — fires a radial burst. */
  critPlanets?: ReadonlySet<PlanetName>;
  /** Planets combusting this beat — desaturate the glyph + ripple a ring outward. */
  combustingPlanets?: ReadonlySet<PlanetName>;
  /** Per-turn key — bumped each turn so animation classes replay reliably. */
  animationEpoch?: number;
}

export function Chart(props: ChartProps) {
  const {
    chart,
    state,
    unlockedPlanets,
    selectedPlanet,
    activePlanet,
    allActive = false,
    hoveredPlanet,
    inspectPlanet,
    showColorField = true,
    showSubstrate = false,
    showAspects = true,
    hideAfflictionBadges = false,
    alwaysShowAfflictionBadges = false,
    entrance = "none",
    side,
    onPlanetClick,
    onPlanetHover,
    style,
    className,
    passive = false,
    aspects: aspectsProp,
    projection,
    activePropagationKeys,
    actionPulsePlanet,
    impactPlanets,
    critPlanets,
    combustingPlanets,
    animationEpoch,
  } = props;

  const points = useMemo(() => buildPlanetPoints(chart), [chart]);
  const aspects = useMemo(() => aspectsProp ?? getAspects(chart), [chart, aspectsProp]);
  const pointMap = useMemo(() => {
    const m: Record<PlanetName, PlanetPoint> = {} as Record<PlanetName, PlanetPoint>;
    for (const p of points) m[p.planet] = p;
    return m;
  }, [points]);
  const ascSignIdx = SIGNS.indexOf(chart.ascendantSign);

  // allActive overrides unlock-gating: every planet renders in full state.
  const isUnlocked = (p: PlanetName) =>
    allActive || (unlockedPlanets ? unlockedPlanets.includes(p) : true);

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
        // Aspect highlights only follow hover/select/active. Dimmed by default
        // even when allActive is true — keeps the resting Title chart calm.
        const isPropagating =
          activePropagationKeys?.has(aspectKey(a.from, a.to)) ||
          activePropagationKeys?.has(aspectKey(a.to, a.from));
        const isActive = isPropagating ||
                         activePlanet === a.from || activePlanet === a.to ||
                         hoveredPlanet === a.from || hoveredPlanet === a.to ||
                         selectedPlanet === a.from || selectedPlanet === a.to;
        const isInspect = inspectPlanet === a.from || inspectPlanet === a.to;
        // v1 convention: harmonious (trine/sextile/conjunction) = green,
        // tense (square/opposition) = red. Source-planet color is too noisy.
        const stroke =
          a.aspect === "Trine" || a.aspect === "Sextile" || a.aspect === "Conjunction"
            ? ASPECT_COLOR.harmony
            : ASPECT_COLOR.tension;
        const opacity = isActive ? 0.8 : isInspect ? 0.5 : 0.2;
        const sw = isActive ? 1.6 : isInspect ? 1.2 : 0.6;
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

  const propagationLines = activePropagationKeys
    ? aspects.map((a) => {
        const key = aspectKey(a.from, a.to);
        if (!activePropagationKeys.has(key)) return null;
        if (!isUnlocked(a.from) || !isUnlocked(a.to)) return null;
        const from = pointMap[a.from];
        const to = pointMap[a.to];
        if (!from || !to) return null;
        return (
          <PropagationLine
            key={`prop-${key}`}
            fromX={from.cx}
            fromY={from.cy}
            toX={to.cx}
            toY={to.cy}
            fromPlanet={a.from}
            toPlanet={a.to}
            aspect={a.aspect}
            active
          />
        );
      })
    : null;

  const handleClick = onPlanetClick && !passive ? onPlanetClick : undefined;
  const handleHover = onPlanetHover && !passive ? onPlanetHover : undefined;

  // Substrate (hexagram + vesica) — only when explicitly requested.
  const substrate = showSubstrate ? renderSubstrate() : null;

  return (
    <svg
      viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
      className={[entranceClass, className ?? ""].filter(Boolean).join(" ")}
      style={{ display: "block", width: "100%", ...style }}
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

      {/* Diagram layer: rings + ticks + sign labels + aspect web */}
      <circle cx={CHART_CENTER} cy={CHART_CENTER} r={OUTER_RING_R}
        fill="none" stroke={NEUTRAL.gold} strokeOpacity="0.55" strokeWidth={1.5} />
      <circle cx={CHART_CENTER} cy={CHART_CENTER} r={INNER_RING_R}
        fill="none" stroke={NEUTRAL.gold} strokeOpacity="0.45" strokeWidth={1} />
      <SignTicks />
      <SignLabels ascSignIdx={ascSignIdx} />
      {aspectLines}
      {propagationLines}

      {/* Active + Word layer: planets + halos + glyphs + badges */}
      {points.map((p) => {
        const status = state?.[p.planet];
        const combusted = status?.combusted ?? false;
        const unlocked = isUnlocked(p.planet);
        const isSelected = selectedPlanet === p.planet;
        const isActive = (allActive && !combusted) || activePlanet === p.planet;
        const isHovered = hoveredPlanet === p.planet;
        const isInspect = inspectPlanet === p.planet;
        const projectedDelta = projection?.deltas[p.planet];
        const isActionPulse = actionPulsePlanet === p.planet;
        const isImpacting = impactPlanets?.has(p.planet) ?? false;
        const isCritting = critPlanets?.has(p.planet) ?? false;
        const isCombusting = combustingPlanets?.has(p.planet) ?? false;
        return (
          <PlanetGlyph
            key={p.planet}
            point={p}
            combusted={combusted}
            affliction={status?.affliction ?? 0}
            hideAfflictionBadge={hideAfflictionBadges}
            alwaysShowAfflictionBadge={alwaysShowAfflictionBadges}
            ghost={!unlocked}
            selected={isSelected}
            active={isActive}
            hovered={isHovered}
            inspect={isInspect}
            onClick={handleClick}
            onHover={handleHover}
            passive={passive}
            projectedDelta={projectedDelta}
            actionPulse={isActionPulse}
            impact={isImpacting}
            crit={isCritting}
            combusting={isCombusting}
            animationEpoch={animationEpoch}
          />
        );
      })}
    </svg>
  );
}

export function aspectKey(from: PlanetName, to: PlanetName): string {
  return `${from}->${to}`;
}

// ─── Internal pieces ────────────────────────────────────────────────────

function PlanetGlyph({
  point, combusted, affliction, hideAfflictionBadge, ghost,
  alwaysShowAfflictionBadge,
  selected, active, hovered, inspect,
  onClick, onHover, passive,
  projectedDelta,
  actionPulse, impact, crit, combusting,
  animationEpoch,
}: {
  point: PlanetPoint;
  combusted: boolean;
  affliction: number;
  hideAfflictionBadge: boolean;
  alwaysShowAfflictionBadge: boolean;
  ghost: boolean;
  selected: boolean;
  active: boolean;
  hovered: boolean;
  inspect: boolean;
  onClick?: (p: PlanetName) => void;
  onHover?: (p: PlanetName | null) => void;
  passive: boolean;
  projectedDelta?: number;
  actionPulse: boolean;
  impact: boolean;
  crit: boolean;
  combusting: boolean;
  animationEpoch?: number;
}) {
  const c = PLANET_PRIMARY[point.planet];
  const sec = PLANET_SECONDARY[point.planet];
  // Active no longer enlarges the glyph — the ring carries the state,
  // matches the on-hover treatment.
  const r = point.glyphR;
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
  // Derive a neutral glyph tone from the planet fill: darker on light discs,
  // lighter on dark discs, avoiding hard black/white contrast.
  const glyphFill = combusted ? NEUTRAL.mist : contrastGrayForFill(fill);

  // Affliction + projection badges — pill-shaped, gold border, drop shadow,
  // matching the v1 treatment. Pills sit on the chart-facing side of the
  // planet; projection sits beside the affliction along the perpendicular.
  const dx = CHART_CENTER - point.cx;
  const dy = CHART_CENTER - point.cy;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const badgeOffset = r;
  const badgeR = Math.max(12, r * 0.5);
  const badgeFontSize = Math.max(12, Math.round(r * 0.48));
  // Projection badge is ~20% smaller — only ever a single digit, doesn't
  // need to fit two-digit values like the persistent affliction badge.
  const projBadgeR = Math.max(10, r * 0.4);
  const projFontSize = Math.max(10, Math.round(r * 0.38));
  // Pill width grows with text length. Floor at 2*r (square-ish).
  const widthFor = (text: string, fontSize: number, pillR: number) =>
    Math.max(2 * pillR, text.length * fontSize * 0.55 + pillR * 0.7);

  // Outer wrapper carries the optional action-glow pulse. The desaturation
  // envelope (.anim-combust) lives on the inner glyph wrapper so the burst /
  // ripple overlays don't desaturate with it.
  const epoch = animationEpoch ?? 0;
  const outerClass = actionPulse ? "anim-action-glow" : undefined;
  const glyphClass = combusted || combusting ? "anim-combust" : undefined;
  const badgeClass = impact ? "anim-impact" : undefined;

  return (
    <g
      transform={`translate(${point.cx}, ${point.cy})`}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ cursor: interactive ? "pointer" : "default", color: c }}
      className={outerClass}
    >
      {active && (
        <circle r={point.glyphR + 6} fill="none"
          stroke={c} strokeOpacity="0.9" strokeWidth={STROKE_LIGHT} />
      )}
      {(inspect || selected) && !active && (
        <circle r={point.glyphR + 10} fill="none"
          stroke={c} strokeOpacity="0.95" strokeWidth={1.8} />
      )}
      {hovered && !selected && !inspect && (
        <circle r={point.glyphR + 6} fill="none"
          stroke={NEUTRAL.bone} strokeOpacity="0.6" strokeWidth={STROKE_LIGHT} />
      )}
      <g className={glyphClass}>
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
      </g>
      {crit && (
        <circle
          key={`crit-${epoch}`}
          r={r + 4}
          fill="none"
          stroke={c}
          strokeOpacity={0.8}
          strokeWidth={2}
          className="anim-crit-burst"
          style={{ pointerEvents: "none" }}
        />
      )}
      {combusting && (
        <circle
          key={`ripple-${epoch}`}
          r={r + 2}
          fill="none"
          stroke={c}
          strokeOpacity={0.85}
          strokeWidth={1.5}
          className="anim-combust-ripple"
          style={{ pointerEvents: "none" }}
        />
      )}
      {(() => {
        const showAffliction =
          !hideAfflictionBadge && !combusted &&
          (alwaysShowAfflictionBadge || affliction > 0);
        const showProjection =
          !combusted && projectedDelta !== undefined && projectedDelta !== 0;
        if (!showAffliction && !showProjection) return null;

        const afflictionText = String(Math.round(affliction));
        const wA = widthFor(afflictionText, badgeFontSize, badgeR);
        const aX = ux * badgeOffset;
        const aY = uy * badgeOffset;

        let projection: { wP: number; pX: number; pY: number; text: string; col: string } | null = null;
        if (showProjection) {
          const positive = projectedDelta > 0;
          // Sign carried by color alone (soft pink-red = damage, sage green
          // = heal); drop the "+" / "−" prefix so the digits read cleanly.
          const text = Math.abs(projectedDelta).toFixed(1).replace(/\.0$/, "");
          const wP = widthFor(text, projFontSize, projBadgeR);
          // Both centers sit on the planet rim. Projection is rotated around
          // the rim from the affliction by the angle at which the two badges
          // just clear each other — chord = sum of their (approximated
          // circular) radii plus a small visual gap so the strokes don't
          // fuse at the tangent point.
          const chord = wA / 2 + wP / 2 + 2;
          const projAngle = 2 * Math.asin(Math.min(1, chord / (2 * badgeOffset)));
          const cos = Math.cos(projAngle);
          const sin = Math.sin(projAngle);
          const projDirX = ux * cos - uy * sin;
          const projDirY = uy * cos + ux * sin;
          projection = {
            wP,
            pX: projDirX * badgeOffset,
            pY: projDirY * badgeOffset,
            text,
            // Softer than ASPECT_COLOR.tension (#CD2626) — the saturated red
            // felt aggressive on the small preview badge. Salmon-coral reads
            // as "incoming damage" without screaming.
            col: positive ? "#FF9F90" : ASPECT_COLOR.harmony,
          };
        }

        const shadow: CSSProperties = {
          filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5))",
          pointerEvents: "none",
          userSelect: "none",
        };

        return (
          <>
            {showAffliction && (
              // Outer g positions; inner g animates. Splitting prevents the
              // CSS keyframe `transform` from clobbering the SVG translate
              // attribute mid-animation (which would snap the badge to (0,0)
              // = planet center for one frame).
              <g
                transform={`translate(${aX}, ${aY})`}
                style={shadow}
              >
                <g
                  className={badgeClass}
                  key={`badge-${epoch}-${impact ? 1 : 0}`}
                >
                  <rect
                    x={-wA / 2} y={-badgeR}
                    width={wA} height={2 * badgeR}
                    rx={badgeR} ry={badgeR}
                    fill={NEUTRAL.void} fillOpacity="0.92"
                    stroke={NEUTRAL.gold} strokeOpacity="0.55" strokeWidth={1} />
                  <foreignObject
                    x={-wA / 2} y={-badgeR}
                    width={wA} height={2 * badgeR}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: NEUTRAL.bone,
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 700,
                        fontSize: `${badgeFontSize}px`,
                        lineHeight: 1,
                        userSelect: "none",
                      }}
                    >
                      {afflictionText}
                    </div>
                  </foreignObject>
                </g>
              </g>
            )}
            {projection && (
              <g
                transform={`translate(${projection.pX}, ${projection.pY})`}
                style={shadow}
              >
                <rect
                  x={-projection.wP / 2} y={-projBadgeR}
                  width={projection.wP} height={2 * projBadgeR}
                  rx={projBadgeR} ry={projBadgeR}
                  fill={NEUTRAL.void} fillOpacity="0.84"
                  stroke={NEUTRAL.gold} strokeOpacity="0.4" strokeWidth={1} />
                <foreignObject
                  x={-projection.wP / 2} y={-projBadgeR}
                  width={projection.wP} height={2 * projBadgeR}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: projection.col,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: `${projFontSize}px`,
                      lineHeight: 1,
                      userSelect: "none",
                    }}
                  >
                    {projection.text}
                  </div>
                </foreignObject>
              </g>
            )}
          </>
        );
      })()}
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
    out.push(
      <g key={`sl_${i}`} transform={`translate(${p.x}, ${p.y})`}>
        <text textAnchor="middle" dominantBaseline="central" y={-12}
          fontSize={20} fill={NEUTRAL.bone} fillOpacity="0.7"
          letterSpacing="2"
          fontFamily="'Cormorant Garamond', serif" fontWeight={500}
          style={{ pointerEvents: "none", userSelect: "none" }}>
          {SIGN_LABELS[sign]}
        </text>
        <text textAnchor="middle" dominantBaseline="central" y={14}
          fontSize={22} fill={NEUTRAL.bone} fillOpacity="0.7"
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

function contrastGrayForFill(hex: string): string {
  const rgb = parseHexColor(hex);
  if (!rgb) return "#808080";
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  const gray = Math.round(clamp(210 - luminance * 190, 54, 190));
  const h = gray.toString(16).padStart(2, "0");
  return `#${h}${h}${h}`;
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
        glyphRActive: PLANET_R_ACTIVE,
      });
    });
  }
  return out;
}
