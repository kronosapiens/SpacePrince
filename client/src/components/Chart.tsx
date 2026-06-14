import { useMemo, type CSSProperties, type MouseEvent } from "react";
import { PLANETS, SIGNS } from "@/game/data";
import { getAspects } from "@/game/aspects";
import {
  PlanetStatsPanel,
  PLANET_STATS_PANEL_W,
  panelHeightFor,
  type PlanetStatsActions,
} from "@/components/PlanetStatsPanel";
import { PropagationLine } from "@/components/PropagationLine";
import {
  CHART_CENTER, CHART_SIZE,
  INNER_RING_R, OUTER_RING_R,
  PLANET_R_REST, PLANET_R_ACTIVE,
  SIGN_LABEL_R, TICK_INNER_R, TICK_OUTER_R,
  STROKE_LIGHT, STROKE_MEDIUM,
} from "@/svg/viewbox";
import { PLANET_GLYPH, SIGN_GLYPH } from "@/svg/glyphs";
import { ASPECT_COLOR, NEUTRAL, PLANET_PRIMARY, PLANET_SECONDARY, VALENCE_COLOR } from "@/svg/palette";
import type {
  AspectConnection,
  Chart as ChartType,
  PlanetName,
  Polarity,
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

export interface ProjectionChip {
  delta: number;
  polarity: Polarity;
}

export interface ProjectionChips {
  deltas: Partial<Record<PlanetName, ProjectionChip>>;
}

export interface ChartProps {
  chart: ChartType;
  state?: Partial<Record<PlanetName, PlanetStatus>>;
  /** Planets the player has not yet revealed. Render as ghost (dashed outline, faded glyph). */
  unlockedPlanets?: PlanetName[];
  /** Tap-preview selection. Highlights planet with gold selection ring, brightens its aspects. */
  selectedPlanet?: PlanetName | null;
  /** Always-active planet (e.g. opponent-of-the-turn). Pulses with full halo. */
  activePlanet?: PlanetName | null;
  /** When true, every visible planet renders in active state (full halo + larger glyph).
   *  Used for ceremonial / hero stages like the Title screen. */
  allActive?: boolean;
  /** Hover preview state. */
  hoveredPlanet?: PlanetName | null;
  /** Show the af Klint color-field blooms behind each visible planet. Default true. */
  showColorField?: boolean;
  /** Show the sacred-geometry substrate (hexagram + vesica). Mint + Chart Study. */
  showSubstrate?: boolean;
  /** Subtle aspect-graph: hairline at rest. */
  showAspects?: boolean;
  /** Hide affliction count badges. Title / Mint use this; gameplay screens don't. */
  hideAfflictionBadges?: boolean;
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
  /** Directed aspect keys (`Source->Target`) currently propagating. The
   *  pulse just brightens the existing aspect-line color; heal/harm signal
   *  lives on the projection badge and the planet's impact pulse. */
  activePropagationKeys?: ReadonlySet<string>;
  /** One-shot glow pulse for the action planet (player or opponent) on direct hit. */
  actionPulsePlanet?: PlanetName | null;
  /** Planets that took a hit this beat, mapped to the polarity received.
   *  Drives the badge pulse (presence) and the glyph's in-place valence
   *  bloom (heal = testimony/violet, harm = affliction/amber). */
  impactPlanets?: ReadonlyMap<PlanetName, Polarity>;
  /** Planets whose direct hit was a crit — fires a radial burst. */
  critPlanets?: ReadonlySet<PlanetName>;
  /** Planets combusting this beat — desaturate the glyph + ripple a ring outward. */
  combustingPlanets?: ReadonlySet<PlanetName>;
  /** Planets whose projection badge is sliding into the affliction badge this beat. */
  mergingPlanets?: ReadonlySet<PlanetName>;
  /** Multiplier for this chart's projection-badge values — 2 while a crit on
   *  this side's incoming attack is being shown. */
  badgeScale?: number;
  /** Per-turn key — bumped each turn so animation classes replay reliably. */
  animationEpoch?: number;
  /** When set, render the planet stats panel inside the chart at the
   *  anti-centroid placement. The position is fixed per-chart (depends only
   *  on planet positions), so swapping which planet is inspected doesn't
   *  jump the panel around. */
  statsPanelPlanet?: PlanetName | null;
  /** When set, render the combat action fan-out under the stats panel. */
  statsPanelActions?: PlanetStatsActions;
  /** Reserve the taller (action-row) panel height when placing, so the panel
   *  doesn't shift between hover (stats only) and select (stats + actions). */
  statsPanelReserveActions?: boolean;
  /** Study mode — the stats panel grows the gloss + stat derivation
   *  (spec/design/SCREENS.md §3.6.1). Reserves the taller study height. */
  statsPanelStudy?: boolean;
  /** Shows the study "i" toggle on the stats panel; called when it's tapped. */
  onToggleStudy?: () => void;
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
    showColorField = true,
    showSubstrate = false,
    showAspects = true,
    hideAfflictionBadges = false,
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
    mergingPlanets,
    badgeScale = 1,
    animationEpoch,
    statsPanelPlanet,
    statsPanelActions,
    statsPanelReserveActions,
    statsPanelStudy,
    onToggleStudy,
  } = props;

  const points = useMemo(() => buildPlanetPoints(chart), [chart]);
  // Place the panel in the emptiest interior wedge — the wheel's middle isn't
  // reliably clear (same-sign planets cluster toward the center). Reserve the
  // taller action height so the spot doesn't shift when buttons appear.
  // Placement reserves the *closed* height only — study mode anchors this box's
  // top and grows downward, so the location stays put when it opens.
  const panelHeight = panelHeightFor({ actions: !!statsPanelReserveActions });
  const panelPlacement = useMemo(
    () => computePanelPlacement(points, panelHeight),
    [points, panelHeight],
  );
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
  const isCombusted = (p: PlanetName) => state?.[p]?.combusted ?? false;

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
        // A combusted planet is dead — drop its aspect lines to others.
        if (isCombusted(a.from) || isCombusted(a.to)) return null;
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
        // Two orthogonal signals: aspect mood (harmony/tension) and effect
        // polarity (heal/harm). Aspects use the red/green of astrological
        // convention; polarity uses amber/violet — different hue families, so
        // the two channels don't fight.
        const isHarmony =
          a.aspect === "Trine" || a.aspect === "Sextile" || a.aspect === "Conjunction";
        const stroke = isHarmony ? ASPECT_COLOR.harmony : ASPECT_COLOR.tension;
        // Active lines (hovered / selected / combat-active / propagating) render
        // at full strength; the rest stay at the legible resting baseline.
        const opacity = isActive ? 1 : 0.5;
        const sw = isActive ? 1.6 : 0.6;
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
            stroke={stroke} strokeWidth={sw} strokeOpacity={opacity}
            strokeLinecap="round" />
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
      className={["chart-svg", entranceClass, className ?? ""].filter(Boolean).join(" ")}
      style={style}
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
        {/* Valence bloom — soft heal/harm glow behind a planet receiving a hit. */}
        {(["Testimony", "Affliction"] as const).map((pol) => (
          <radialGradient key={`vb-${pol}`} id={`v2-valence-${pol}`}>
            <stop offset="0%" stopColor={VALENCE_COLOR[pol]} stopOpacity="0.9" />
            <stop offset="55%" stopColor={VALENCE_COLOR[pol]} stopOpacity="0.34" />
            <stop offset="100%" stopColor={VALENCE_COLOR[pol]} stopOpacity="0" />
          </radialGradient>
        ))}
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

      {/* Planet layer: halos + glyphs. Badges draw in a separate pass below,
          so a selected/active planet's halo can't occlude a neighbouring
          planet's affliction badge (SVG paints in document order). */}
      {points.map((p) => {
        const status = state?.[p.planet];
        const combusted = status?.combusted ?? false;
        const unlocked = isUnlocked(p.planet);
        const isSelected = selectedPlanet === p.planet;
        const isActive = (allActive && !combusted) || activePlanet === p.planet;
        const isHovered = hoveredPlanet === p.planet;
        const isActionPulse = actionPulsePlanet === p.planet;
        const isCritting = critPlanets?.has(p.planet) ?? false;
        const isCombusting = combustingPlanets?.has(p.planet) ?? false;
        const impactPolarity = impactPlanets?.get(p.planet);
        return (
          <PlanetGlyph
            key={p.planet}
            point={p}
            combusted={combusted}
            ghost={!unlocked}
            selected={isSelected}
            active={isActive}
            hovered={isHovered}
            onClick={handleClick}
            onHover={handleHover}
            passive={passive}
            actionPulse={isActionPulse}
            crit={isCritting}
            combusting={isCombusting}
            impactPolarity={impactPolarity}
            animationEpoch={animationEpoch}
          />
        );
      })}

      {/* Badge layer: above every planet's halo. */}
      {points.map((p) => {
        if (!isUnlocked(p.planet)) return null;
        const status = state?.[p.planet];
        return (
          <PlanetBadges
            key={p.planet}
            point={p}
            combusted={status?.combusted ?? false}
            affliction={status?.affliction ?? 0}
            hideAfflictionBadge={hideAfflictionBadges}
            projection={projection?.deltas[p.planet]}
            impact={impactPlanets?.has(p.planet) ?? false}
            merging={mergingPlanets?.has(p.planet) ?? false}
            projectionScale={badgeScale}
            animationEpoch={animationEpoch}
          />
        );
      })}

      {/* Stats panel last = highest z. When it clashes with a planet in a busy
          chart, the panel sits on top — it's the focused read. */}
      {statsPanelPlanet && (
        <PlanetStatsPanel
          chart={chart}
          planet={statsPanelPlanet}
          cx={panelPlacement.cx}
          cy={panelPlacement.cy}
          height={panelHeight}
          actions={statsPanelActions}
          study={statsPanelStudy}
          onToggleStudy={onToggleStudy}
        />
      )}
    </svg>
  );
}

export function aspectKey(from: PlanetName, to: PlanetName): string {
  return `${from}->${to}`;
}

// ─── Internal pieces ────────────────────────────────────────────────────

function PlanetGlyph({
  point, combusted, ghost,
  selected, active, hovered,
  onClick, onHover, passive,
  actionPulse, crit, combusting,
  impactPolarity,
  animationEpoch,
}: {
  point: PlanetPoint;
  combusted: boolean;
  ghost: boolean;
  selected: boolean;
  active: boolean;
  hovered: boolean;
  onClick?: (p: PlanetName) => void;
  onHover?: (p: PlanetName | null) => void;
  passive: boolean;
  actionPulse: boolean;
  crit: boolean;
  combusting: boolean;
  impactPolarity?: Polarity;
  animationEpoch?: number;
}) {
  const c = PLANET_PRIMARY[point.planet];
  const sec = PLANET_SECONDARY[point.planet];
  // Active state is carried by the ring, not glyph size.
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
  // Glyph in a deep shade of the planet's own color: colored and high-contrast
  // (via value), but on-palette — same hue family, so no complementary clash
  // and the rainbow corona stays coherent.
  const glyphFill = combusted ? NEUTRAL.mist : deepShade(c);

  // Outer wrapper carries the optional action-glow pulse. The desaturation
  // envelope (.anim-combust) lives on the inner glyph wrapper so the burst /
  // ripple overlays don't desaturate with it.
  const epoch = animationEpoch ?? 0;
  const outerClass = actionPulse ? "anim-action-glow" : undefined;
  const glyphClass = combusted || combusting ? "anim-combust" : undefined;

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
        <circle
          className="anim-active-halo"
          r={point.glyphR * 2.5}
          fill={`url(#v2-halo-${point.planet})`}
          style={{ pointerEvents: "none" }}
        />
      )}
      {active && (
        <circle r={point.glyphR + 10} fill="none"
          stroke={c} strokeOpacity="1" strokeWidth={STROKE_MEDIUM} />
      )}
      {selected && !active && (
        <circle r={point.glyphR + 10} fill="none"
          stroke={c} strokeOpacity="0.95" strokeWidth={1.8} />
      )}
      {hovered && !selected && (
        <circle r={point.glyphR + 6} fill="none"
          stroke={NEUTRAL.bone} strokeOpacity="0.6" strokeWidth={STROKE_LIGHT} />
      )}
      {/* Receive-pulse: soft in-place valence glow behind the glyph when this
          planet takes testimony (heal) or affliction (harm) this beat. Behind
          the glyph so the symbol stays readable; an opacity bloom, not an
          outward ring, so it reads apart from the crit/combust bursts. */}
      {impactPolarity && !combusting && (
        <circle
          key={`bloom-${epoch}-${impactPolarity}`}
          r={r + 9}
          fill={`url(#v2-valence-${impactPolarity})`}
          className="anim-impact-bloom"
          style={{ pointerEvents: "none" }}
        />
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
        <>
          <circle
            key={`ripple-${epoch}`}
            r={r + 2}
            fill="none"
            stroke={c}
            strokeOpacity={0.95}
            strokeWidth={2.5}
            className="anim-combust-ripple"
            style={{ pointerEvents: "none" }}
          />
          {/* Second bone shockwave, slightly delayed — sells the death as a
              flare-and-collapse rather than a single faint ring. */}
          <circle
            key={`ripple2-${epoch}`}
            r={r + 2}
            fill="none"
            stroke={NEUTRAL.bone}
            strokeOpacity={0.7}
            strokeWidth={1.5}
            className="anim-combust-ripple-2"
            style={{ pointerEvents: "none" }}
          />
        </>
      )}
    </g>
  );
}

// Affliction + projection badges — pill-shaped, gold border, drop shadow.
// Rendered in a pass above every planet's glyph/halo so a selected or active
// planet's halo can't occlude a neighbouring planet's badge. Pills sit on the
// chart-facing side of the planet; projection sits beside the affliction along
// the perpendicular.
function PlanetBadges({
  point, combusted, affliction,
  hideAfflictionBadge,
  projection, impact, merging, projectionScale, animationEpoch,
}: {
  point: PlanetPoint;
  combusted: boolean;
  affliction: number;
  hideAfflictionBadge: boolean;
  projection?: ProjectionChip;
  merging: boolean;
  projectionScale: number;
  impact: boolean;
  animationEpoch?: number;
}) {
  const r = point.glyphR;
  const dx = CHART_CENTER - point.cx;
  const dy = CHART_CENTER - point.cy;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const badgeOffset = r;
  const badgeR = Math.max(12, r * 0.5);
  const badgeFontSize = Math.max(13, Math.round(r * 0.5));
  // Projection badge shares the affliction badge's size; the affliction pill
  // still widens for two-digit values via widthFor.
  const projBadgeR = badgeR;
  const projFontSize = badgeFontSize;
  // Pill width grows with text length. Floor at 2*r (square-ish).
  // Per-char factor 0.7 (vs the natural ~0.55 for Inter digits) bakes in
  // visual padding so multi-char content like "2.5" doesn't get crowded
  // against the rounded ends.
  const widthFor = (text: string, fontSize: number, pillR: number) =>
    Math.max(2 * pillR, text.length * fontSize * 0.7 + pillR * 0.7);

  const epoch = animationEpoch ?? 0;
  const badgeClass = impact ? "anim-impact" : undefined;

  const showAffliction = !hideAfflictionBadge && !combusted && affliction > 0;
  // Show the projection badge whenever there's any projected effect —
  // including testimony at zero delta (planet already at 0 affliction).
  // The polarity tells the player "this would heal", even if the
  // numeric outcome is the same as standing still.
  const showProjection = !combusted && projection !== undefined;
  if (!showAffliction && !showProjection) return null;

  const afflictionText = String(Math.round(affliction));
  const wA = widthFor(afflictionText, badgeFontSize, badgeR);
  const aX = ux * badgeOffset;
  const aY = uy * badgeOffset;

  let projBadge: { wP: number; pX: number; pY: number; text: string; col: string } | null = null;
  if (showProjection && projection) {
    const isHarm = projection.polarity !== "Testimony";
    // Sign carried by color alone (amber = damage, violet = heal); drop
    // the "+" / "−" prefix so the digits read cleanly.
    const text = Math.abs(projection.delta * projectionScale).toFixed(1).replace(/\.0$/, "");
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
    projBadge = {
      wP,
      pX: projDirX * badgeOffset,
      pY: projDirY * badgeOffset,
      text,
      // Valence, not aspect mood: amber = incoming harm, violet = incoming
      // heal — matching the action-verb colors.
      col: isHarm ? VALENCE_COLOR.Affliction : VALENCE_COLOR.Testimony,
    };
  }

  const shadow: CSSProperties = {
    filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5))",
    pointerEvents: "none",
    userSelect: "none",
  };

  return (
    <g transform={`translate(${point.cx}, ${point.cy})`}>
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
      {projBadge && (
        <g
          transform={`translate(${projBadge.pX}, ${projBadge.pY})`}
          style={shadow}
        >
          {/* Inner g carries the merge animation — the projection pill slides
              into the affliction badge and fades, so the delta visibly merges
              into the running total. Outer g keeps the SVG positioning. */}
          <g
            key={`proj-${epoch}-${merging ? 1 : 0}`}
            className={merging ? "anim-badge-merge" : undefined}
            style={
              merging
                ? ({ "--mdx": `${aX - projBadge.pX}px`, "--mdy": `${aY - projBadge.pY}px` } as CSSProperties)
                : undefined
            }
          >
          <rect
            x={-projBadge.wP / 2} y={-projBadgeR}
            width={projBadge.wP} height={2 * projBadgeR}
            rx={projBadgeR} ry={projBadgeR}
            fill={NEUTRAL.void} fillOpacity="0.84"
            stroke={NEUTRAL.gold} strokeOpacity="0.4" strokeWidth={1} />
          <foreignObject
            x={-projBadge.wP / 2} y={-projBadgeR}
            width={projBadge.wP} height={2 * projBadgeR}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: projBadge.col,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: `${projFontSize}px`,
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              {projBadge.text}
            </div>
          </foreignObject>
          </g>
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
    out.push(
      <g key={`sl_${i}`} transform={`translate(${p.x}, ${p.y})`}>
        <text textAnchor="middle" dominantBaseline="central" y={-12}
          fontSize={20} fill={NEUTRAL.bone} fillOpacity={0.7}
          letterSpacing="2"
          fontFamily="'Cormorant Garamond', serif" fontWeight={500}
          style={{ pointerEvents: "none", userSelect: "none" }}>
          {SIGN_LABELS[sign]}
        </text>
        <text textAnchor="middle" dominantBaseline="central" y={14}
          fontSize={22} fill={NEUTRAL.bone} fillOpacity={0.7}
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
        glyphRActive: PLANET_R_ACTIVE,
      });
    });
  }
  return out;
}

/** Find the panel position with maximum clearance to the nearest planet glyph,
 *  by sweeping a grid of candidate centers across the chart interior. The wheel
 *  interior isn't reliably empty — same-sign planets cluster toward the center
 *  (CLUSTER_PATTERNS) — so the panel needs to dodge to the emptiest wedge.
 *  Memoized on points + height, so it runs once per chart. */
function computePanelPlacement(
  points: PlanetPoint[],
  panelH: number,
): { cx: number; cy: number } {
  if (points.length === 0) return { cx: CHART_CENTER, cy: CHART_CENTER };
  const halfW = PLANET_STATS_PANEL_W / 2;
  const halfH = panelH / 2;
  // The panel rect must stay inside the inner ring with a visual margin.
  const RING_LIMIT = INNER_RING_R - 50;
  const GRID_HALF = 180;
  const STEP = 10;

  let bestCx = CHART_CENTER;
  let bestCy = CHART_CENTER;
  let bestOverlap = Infinity; // smaller is better; negative = clearance
  for (let dx = -GRID_HALF; dx <= GRID_HALF; dx += STEP) {
    for (let dy = -GRID_HALF; dy <= GRID_HALF; dy += STEP) {
      // Worst-case corner shares signs with (dx, dy) — only that one matters.
      if (Math.hypot(Math.abs(dx) + halfW, Math.abs(dy) + halfH) > RING_LIMIT) continue;
      const cx = CHART_CENTER + dx;
      const cy = CHART_CENTER + dy;
      const overlap = maxPlanetOverlap(cx, cy, points, panelH);
      if (overlap < bestOverlap) {
        bestOverlap = overlap;
        bestCx = cx;
        bestCy = cy;
      }
    }
  }
  return { cx: bestCx, cy: bestCy };
}

/** Worst overlap between any planet glyph (circle of radius glyphR + buffer)
 *  and the panel rect centered at (panelCx, panelCy). >0 = overlap depth. */
function maxPlanetOverlap(
  panelCx: number,
  panelCy: number,
  points: PlanetPoint[],
  panelH: number,
): number {
  const PANEL_PLANET_BUFFER = 14;
  const left = panelCx - PLANET_STATS_PANEL_W / 2;
  const right = panelCx + PLANET_STATS_PANEL_W / 2;
  const top = panelCy - panelH / 2;
  const bottom = panelCy + panelH / 2;
  let worst = -Infinity;
  for (const p of points) {
    const dx = Math.max(left - p.cx, 0, p.cx - right);
    const dy = Math.max(top - p.cy, 0, p.cy - bottom);
    const dist = Math.hypot(dx, dy);
    const overlap = p.glyphR + PANEL_PLANET_BUFFER - dist;
    if (overlap > worst) worst = overlap;
  }
  return worst;
}
