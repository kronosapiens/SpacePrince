import { useMemo, type CSSProperties, type MouseEvent } from "react";
import { PLANETS, SIGNS } from "@/game/data";
import { getAspects } from "@/game/aspects";
import { combustionCeiling, isCombusted, wouldCombust } from "@/game/combust";
import {
  PlanetStatsPanel,
  PLANET_STATS_PANEL_W,
  panelHeightFor,
  type PlanetStatsActions,
} from "@/components/PlanetStatsPanel";
import { PropagationLine } from "@/components/PropagationLine";
import {
  AFFLICTION_ARC_ANCHOR_DEG, AFFLICTION_ARC_R,
  CHART_CENTER, CHART_SIZE,
  CORONA_INNER_R,
  INNER_RING_R, INTERACTION_RING_R, OUTER_RING_R,
  PLANET_R_ACTIVE, PLANET_R_REST,
  SIGN_LABEL_R, TICK_INNER_R, TICK_OUTER_R,
} from "@/svg/viewbox";
import { PLANET_GLYPH, SIGN_GLYPH } from "@/svg/glyphs";
import { ASPECT_COLOR, COMBUST_WARNING, NEUTRAL, PLANET_PRIMARY, PLANET_SECONDARY, VALENCE_COLOR } from "@/svg/palette";
import { CHART_STYLE } from "@/svg/chart-style";
import { useTuning, type ChartTuning } from "@/svg/tuning";
import type {
  AspectConnection,
  Chart as ChartType,
  PlanetName,
  PlanetPlacement,
  Polarity,
  SignName,
} from "@/game/types";

const SIGN_LABELS: Record<SignName, string> = {
  Aries: "ARI", Taurus: "TAU", Gemini: "GEM", Cancer: "CAN",
  Leo: "LEO", Virgo: "VIR", Libra: "LIB", Scorpio: "SCO",
  Sagittarius: "SAG", Capricorn: "CAP", Aquarius: "AQU", Pisces: "PIS",
};

// Measure a badge label's advance width in the badge font. A canvas advance at
// `fontPx` equals SVG user units at the same nominal font-size, so the result
// drops straight into pill geometry. Measuring (vs. estimating from character
// count) keeps the pill's padding constant across 1-, 2-, and 3-digit values —
// a char-count estimate over-budgets every extra glyph and lets longer numbers
// drift looser. One shared context; font is re-set per call (cheap).
const badgeMeasureCtx =
  typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
function measureBadgeText(text: string, fontPx: number): number {
  if (!badgeMeasureCtx) return text.length * fontPx * 0.6; // SSR / no-canvas fallback
  badgeMeasureCtx.font = `700 ${fontPx}px 'Inter', sans-serif`;
  return badgeMeasureCtx.measureText(text).width;
}

/** Planet placement inside a sign, per stack size. Each entry is
 *  [radius, angle-offset-deg] from the sign's mid-point.
 *
 *  Three rules generate every pattern.
 *
 *  One pitch. No two planets in the chart sit closer than 80 units apart. That
 *  is the interaction ring's real footprint plus a little: radius 36 with a
 *  3-unit stroke, both scaled by the breath's 1.05 peak, reaches 39.375, so two
 *  rings need 78.75 between centres. (viewbox.ts budgets 38.75 a planet, which
 *  counts the ring's radius at peak but not its stroke — that shortfall is why
 *  the tightest placements have always just touched.)
 *
 *  One rim. Every pattern's outermost planet sits at 335, so the band of planets
 *  reads as one ring whatever each sign happens to hold. 335 is the ceiling
 *  rather than a preference: 335 + 39.375 lands 5.6 short of the inner ring.
 *
 *  Two planets to an angular tier, at ±asin(pitch / 2r). A third on the same arc
 *  wants 27.8° of a 30° wedge and leaves nothing for the gap to the next sign —
 *  that is what used to drive five-in-a-sign into two next door hard enough to
 *  overlap their discs, so the cap is structural, not a tuned number.
 *
 *  Tiers fall at 335 / 255 / 175 / 95, one pitch apart, so radial neighbours are
 *  spaced like angular ones. Capacity is 2+2+2+1, which is exactly seven.
 *
 *  Shapes are regular wherever a regular shape exists: n=3 is equilateral, n=4 a
 *  rhombus of two equilateral triangles whose long diagonal is exactly 80√3.
 *  Both are solved for, not eyeballed, so their inner radii sit off the tier
 *  grid — and the offset and those radii are one relationship, so moving either
 *  means re-solving the other or the shape goes lopsided.
 *
 *  The offset also settles how neighbouring signs read. A wedge is 30° and a
 *  same-sign pair straddles its mid-point symmetrically, so an offset of `a`
 *  leaves `15 - a` to the next sign: the two distances swap at 7.5°, and past it
 *  a chart groups planets across a boundary more tightly than within one, which
 *  is backwards from what the chart exists to show. Every offset here is under
 *  that line, and no reachable pair of neighbouring signs inverts or collides. */
const CLUSTER_PATTERNS: Record<number, Array<[number, number]>> = {
  1: [[335, 0]],
  2: [[335, 6.86], [335, -6.86]],
  3: [[335, 6.86], [335, -6.86], [263.3, 0]],
  4: [[335, 0], [268.7, 8.56], [268.7, -8.56], [196.4, 0]],
  5: [[335, 6.86], [335, -6.86], [255, 9.02], [255, -9.02], [175, 0]],
  6: [[335, 6.86], [335, -6.86], [255, 9.02], [255, -9.02], [175, 13.21], [175, -13.21]],
  7: [[335, 6.86], [335, -6.86], [255, 9.02], [255, -9.02], [175, 13.21], [175, -13.21], [95, 0]],
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
  /** Show the sacred-geometry ground (hexagram + vesica). On by default; pass
   *  false to suppress it on a given chart. */
  showSubstrate?: boolean;
  /** Subtle aspect-graph: hairline at rest. */
  showAspects?: boolean;
  /** Hide the affliction display — arc and badge both. For charts shown for
   *  their form rather than their state (Title, the map's chart anchor);
   *  gameplay screens don't set it. */
  hideAffliction?: boolean;
  scale?: number;
  entrance?: "left" | "right" | "none";
  side?: "self" | "other";
  onPlanetClick?: (p: PlanetName) => void;
  onPlanetHover?: (p: PlanetName | null) => void;
  /** When true, the player's tappable planets carry a quiet breathing ring
   *  inviting a choice — the combat decision phase. Off everywhere else. */
  inviteInteraction?: boolean;
  /** The verb determined for whichever planet is wearing the ring — the
   *  opponent's precommit, or the player's armed/indicated choice. Colours the
   *  ring; without one it stays neutral. Only ever one planet at a time wears a
   *  steady ring, and an inviting planet has no verb yet, so a single value
   *  covers the chart. */
  ringVerb?: Polarity | null;
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
  /** Planets combusting this beat — desaturate the glyph + ripple a ring outward. */
  combustingPlanets?: ReadonlySet<PlanetName>;
  /** Planets whose projection badge is sliding into the affliction badge this beat. */
  mergingPlanets?: ReadonlySet<PlanetName>;
  /** Ambient combust warning: planets for whom combustion is on the table this
   *  turn — own candidates that would combust catching the incoming blow, or
   *  the opponent's actor when a candidate could combust it first. The
   *  affliction badge turns amber and breathes. */
  warningPlanets?: ReadonlySet<PlanetName>;
  /** The verb and magnitude arriving at this chart, drawn at the centre. It sits
   *  there rather than on a planet because until the player commits, the blow
   *  has no target: `resolveTurn` lands it on whichever planet is sent, so
   *  "60 of testimony is coming" is a fact about the whole chart. */
  incoming?: { verb: Polarity; amount: number } | null;
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
    showSubstrate = true,
    showAspects = true,
    hideAffliction = false,
    entrance = "none",
    side,
    onPlanetClick,
    onPlanetHover,
    inviteInteraction = false,
    ringVerb,
    style,
    className,
    passive = false,
    aspects: aspectsProp,
    projection,
    activePropagationKeys,
    actionPulsePlanet,
    impactPlanets,
    combustingPlanets,
    mergingPlanets,
    warningPlanets,
    incoming,
    animationEpoch,
    statsPanelPlanet,
    statsPanelActions,
    statsPanelReserveActions,
    statsPanelStudy,
    onToggleStudy,
  } = props;

  const tuning = useTuning();
  const points = useMemo(() => buildPlanetPoints(chart, PLANET_R_REST), [chart]);
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
  // Combustion is derived from affliction against the placement's ceiling
  // (combust.ts) — no flag arrives in `state`.
  const planetCombusted = (p: PlanetName) => {
    const affliction = state?.[p]?.affliction;
    return affliction != null && isCombusted(chart.planets[p], { affliction });
  };

  const entranceClass =
    entrance === "left" ? "anim-encounter-open-left" :
    entrance === "right" ? "anim-encounter-open-right" :
    "";

  // Color-field blooms — one radial gradient per visible non-combust planet.
  const fieldBlooms = showColorField && tuning.showGlow
    ? PLANETS.map((planet) => {
        if (!isUnlocked(planet)) return null;
        if (planetCombusted(planet)) return null;
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
        if (planetCombusted(a.from) || planetCombusted(a.to)) return null;
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
        const opacity = CHART_STYLE.aspect.opacity;
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

  // Sacred-geometry ground (static hexagram + vesica), shown by default.
  const substrate = showSubstrate ? renderSubstrate() : null;

  return (
    <svg
      viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
      className={["chart-svg", tuning.showGlow ? "" : "no-glow", entranceClass, className ?? ""].filter(Boolean).join(" ")}
      style={style}
      role="img"
      aria-label={`${chart.name} natal chart${side === "other" ? " (other)" : ""}`}
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
        {/* Valence bloom — soft heal/harm glow behind a planet receiving a hit. */}
        {(["Testimony", "Affliction"] as const).map((pol) => (
          <radialGradient key={`vb-${pol}`} id={`v2-valence-${pol}`}>
            <stop offset="0%" stopColor={VALENCE_COLOR[pol]} stopOpacity={CHART_STYLE.glow.valence.core} />
            <stop offset="55%" stopColor={VALENCE_COLOR[pol]} stopOpacity={CHART_STYLE.glow.valence.mid} />
            <stop offset="100%" stopColor={VALENCE_COLOR[pol]} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* Field layer */}
      {fieldBlooms}
      {substrate}

      {/* Diagram layer: rings + ticks + sign labels + aspect web */}
      <circle cx={CHART_CENTER} cy={CHART_CENTER} r={OUTER_RING_R}
        fill="none" stroke={NEUTRAL.gold} strokeOpacity={CHART_STYLE.ring.outer.opacity} strokeWidth={CHART_STYLE.ring.outer.stroke} />
      <circle cx={CHART_CENTER} cy={CHART_CENTER} r={INNER_RING_R}
        fill="none" stroke={NEUTRAL.gold} strokeOpacity={CHART_STYLE.ring.inner.opacity} strokeWidth={CHART_STYLE.ring.inner.stroke} />
      <SignTicks />
      <SignLabels ascSignIdx={ascSignIdx} />
      {aspectLines}
      {propagationLines}

      {/* Planet layer: halos + glyphs. Badges draw in a separate pass below,
          so a selected/active planet's halo can't occlude a neighbouring
          planet's affliction badge (SVG paints in document order). */}
      {points.map((p) => {
        const combusted = planetCombusted(p.planet);
        const unlocked = isUnlocked(p.planet);
        const isSelected = selectedPlanet === p.planet;
        const isActive = (allActive && !combusted) || activePlanet === p.planet;
        const isHovered = hoveredPlanet === p.planet;
        const isActionPulse = actionPulsePlanet === p.planet;
        const isCombusting = combustingPlanets?.has(p.planet) ?? false;
        const impactPolarity = impactPlanets?.get(p.planet);
        return (
          <PlanetGlyph
            key={p.planet}
            tuning={tuning}
            point={p}
            combusted={combusted}
            ghost={!unlocked}
            selected={isSelected}
            active={isActive}
            hovered={isHovered}
            onClick={handleClick}
            onHover={handleHover}
            passive={passive}
            invite={inviteInteraction}
            ringVerb={ringVerb}
            actionPulse={isActionPulse}
            combusting={isCombusting}
            impactPolarity={impactPolarity}
            animationEpoch={animationEpoch}
          />
        );
      })}

      {/* Arc layer: above every planet's halo, same as the badges — the arc is
          the primary read of how much a planet can still absorb, so a
          neighbour's bloom must not sit on top of it. A combusted planet has
          nothing left to absorb, so it drops the arc entirely rather than
          showing a spent track. */}
      {!hideAffliction && points.map((p) => {
        if (!isUnlocked(p.planet) || planetCombusted(p.planet)) return null;
        return (
          <PlanetArc
            key={p.planet}
            tuning={tuning}
            point={p}
            placement={chart.planets[p.planet]}
            affliction={state?.[p.planet]?.affliction ?? 0}
            projection={projection?.deltas[p.planet]}
          />
        );
      })}

      {/* Badge layer: above every planet's halo. Off by default — the arc
          carries this now — and kept only so the dev console can put the
          numbers back while the arc is still being trusted. */}
      {tuning.showBadges && points.map((p) => {
        if (!isUnlocked(p.planet)) return null;
        return (
          <PlanetBadges
            key={p.planet}
            point={p}
            combusted={planetCombusted(p.planet)}
            affliction={state?.[p.planet]?.affliction ?? 0}
            hideAfflictionBadge={hideAffliction}
            projection={projection?.deltas[p.planet]}
            impact={impactPlanets?.has(p.planet) ?? false}
            merging={mergingPlanets?.has(p.planet) ?? false}
            warning={warningPlanets?.has(p.planet) ?? false}
            animationEpoch={animationEpoch}
          />
        );
      })}

      {/* What is arriving here, at the centre. Above the aspect web — a line
          between opposite planets runs straight through the middle — and below
          the panel, which is allowed to cover it. */}
      {incoming && <IncomingMark verb={incoming.verb} amount={incoming.amount} />}

      {/* Stats panel last = highest z. When it clashes with a planet in a busy
          chart, the panel sits on top — it's the focused read. */}
      {statsPanelPlanet && (
        <PlanetStatsPanel
          chart={chart}
          planet={statsPanelPlanet}
          affliction={state?.[statsPanelPlanet]?.affliction ?? 0}
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
  tuning,
  point, combusted, ghost,
  selected, active, hovered,
  onClick, onHover, passive, invite, ringVerb,
  actionPulse, combusting,
  impactPolarity,
  animationEpoch,
}: {
  tuning: ChartTuning;
  point: PlanetPoint;
  combusted: boolean;
  ghost: boolean;
  selected: boolean;
  active: boolean;
  hovered: boolean;
  onClick?: (p: PlanetName) => void;
  onHover?: (p: PlanetName | null) => void;
  passive: boolean;
  invite: boolean;
  ringVerb?: Polarity | null;
  actionPulse: boolean;
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
          stroke={c} strokeOpacity={CHART_STYLE.ghost.outlineOpacity}
          strokeWidth={Math.max(CHART_STYLE.planet.rimStrokeMin, point.glyphR * CHART_STYLE.planet.rimStrokeRatio)}
          strokeDasharray={CHART_STYLE.ghost.dash} />
        <text textAnchor="middle" dominantBaseline="central"
          fontSize={Math.round(point.glyphR * CHART_STYLE.planet.symbolRatio)} fill={c} fillOpacity={CHART_STYLE.ghost.glyphOpacity}
          fontFamily="'Cormorant Garamond', 'Noto Sans Symbols 2', 'Apple Symbols', serif"
          fontWeight={600}
          style={{ pointerEvents: "none", userSelect: "none" }}>
          {PLANET_GLYPH[point.planet]}
        </text>
      </g>
    );
  }

  const fill = combusted ? NEUTRAL.char : c;
  const fillOpacity = combusted ? CHART_STYLE.planet.discCombustedOpacity : CHART_STYLE.planet.discOpacity;
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

  const ringShown = active || selected || (invite && interactive);
  const ringSteady = active || selected || hovered;
  // Neutral at rest, the verb once one is determined — the same grammar as the
  // affliction arc inside it. The ring used to restate the planet's own colour,
  // which the disc, the glyph and the halo already carry three times over, so
  // the hue was decoration; spending it on the verb is what lets a precommit
  // read at its source rather than only through its consequences on the other
  // chart.
  //
  // Mist, not bone: the arc is bone, and a bone ring six units outside it was
  // perceptually the same colour (ΔE 0). Mist separates them (ΔE 31) and matches
  // what the neutral scale is for — bone is state, mist is affordance. Testify
  // is the pair this costs (ΔE 61 → 41, still far past the threshold where two
  // colours read apart); afflict slightly gains. The ring stays legible as an
  // invite because the breath marks the tappable, not the brightness.
  const ringColor = ringVerb ? VALENCE_COLOR[ringVerb] : NEUTRAL.mist;

  return (
    <g
      transform={`translate(${point.cx}, ${point.cy})`}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ cursor: interactive ? "pointer" : "default", color: c }}
      className={outerClass}
    >
      {active && tuning.showGlow && (
        <circle
          className="anim-active-halo"
          r={tuning.activeHaloR}
          fill={`url(#v2-halo-${point.planet})`}
          style={{ pointerEvents: "none" }}
        />
      )}
      {ringVerb && ringShown && <PlanetCorona verb={ringVerb} />}
      {/* One ring, three readings. It breathes in the planet's own color while
          the planet is merely tappable, so the eye lands on the choices; it goes
          steady under hover, under selection, and on the opponent's acting
          planet. Hover and selection can share it because they never coexist —
          selecting clears the invite on every planet and suppresses hover — and
          because only selection opens the action fan-out. The halo goes steady
          with it, so a committed choice can't read dimmer than a hovered one. */}
      {ringShown && !active && tuning.showGlow && (
        <circle r={tuning.inviteHaloR}
          fill={`url(#v2-halo-${point.planet})`}
          className={ringSteady ? undefined : "anim-invite-glow"}
          style={{ opacity: ringSteady ? CHART_STYLE.invite.halo.steady : undefined, pointerEvents: "none" }} />
      )}
      {ringShown && (
        <circle r={INTERACTION_RING_R} fill="none"
          stroke={ringColor} strokeWidth={CHART_STYLE.interactionRing.stroke}
          className={ringSteady ? "invite-ring" : "invite-ring anim-invite-ring"}
          style={{
            // The class's drop-shadow is currentColor, so the glow follows the
            // stroke rather than staying on the planet's hue.
            color: ringColor,
            opacity: ringSteady ? CHART_STYLE.interactionRing.steady : undefined,
            pointerEvents: "none",
          }} />
      )}
      {/* Receive-pulse: soft in-place valence glow behind the glyph when this
          planet takes testimony (heal) or affliction (harm) this beat. Behind
          the glyph so the symbol stays readable; an opacity bloom, not an
          outward ring, so it reads apart from the combust burst. */}
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
      {combusting && (
        <>
          <circle
            key={`ripple-${epoch}`}
            r={r + 2}
            fill="none"
            stroke={c}
            strokeOpacity={CHART_STYLE.combust.ripple.opacity}
            strokeWidth={CHART_STYLE.combust.ripple.stroke}
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
            strokeOpacity={CHART_STYLE.combust.shockwave.opacity}
            strokeWidth={CHART_STYLE.combust.shockwave.stroke}
            className="anim-combust-ripple-2"
            style={{ pointerEvents: "none" }}
          />
        </>
      )}
    </g>
  );
}

/**
 * Affliction arc — the planet's Resolve drawn at 1 point of affliction = 1°.
 * Ceilings are multiples of 60 with a maximum of 360 (combust.ts), so the
 * mapping is exact and needs no scale factor. Absolute rather than normalized:
 * arc length *is* durability, so a resting chart shows which planets are sturdy
 * without a number, and one incoming magnitude draws the same sweep on every
 * planet — the player learns what 48 looks like once and can then scan seven
 * gaps against it.
 *
 * The ceiling end is pinned at 6 o'clock and affliction accumulates toward it,
 * so the bright span — what the planet can still absorb — shortens by its free
 * end descending into the anchor, and combustion is that span closing. Every
 * planet dies at the same point on the dial.
 *
 * Rejected: normalized (every ceiling sweeping a full 360°). It reads as a
 * fraction, which needs a complete-circle track to read against — and complete
 * circles are the interaction ring's signal. It also flattens the resting
 * chart, since every undamaged planet would look identical.
 */
function PlanetArc({
  tuning, point, placement, affliction, projection,
}: {
  tuning: ChartTuning;
  point: PlanetPoint;
  placement: PlanetPlacement;
  affliction: number;
  projection?: ProjectionChip;
}) {
  const ceiling = combustionCeiling(placement);
  if (ceiling <= 0) return null;
  const r = AFFLICTION_ARC_R;
  const stroke = CHART_STYLE.afflictionArc.stroke;
  // Position `a` on the track sits `ceiling - a` degrees back from the anchor.
  const at = (a: number) => AFFLICTION_ARC_ANCHOR_DEG - ceiling + clamp(a, 0, ceiling);
  const spent = clamp(affliction, 0, ceiling);

  // The projected span runs between the current boundary and where the blow
  // would put it — one segment either way, since testimony just moves it back.
  //
  // A blow that closes the span turns ember instead of amber. Length cannot
  // carry this: the span clamps at the ceiling, so a planet that dies shows a
  // *shorter* mark than one that survives, and "more amber is worse" reads
  // exactly backwards. Colour makes it categorical — which of these dies —
  // rather than a comparison of two lengths. The predicate is `wouldCombust`
  // itself, not a second reading of the same arithmetic.
  let diff: { from: number; to: number; color: string } | null = null;
  if (projection) {
    const harm = projection.polarity !== "Testimony";
    const signed = harm ? Math.abs(projection.delta) : -Math.abs(projection.delta);
    const projected = clamp(spent + signed, 0, ceiling);
    if (projected !== spent) {
      const fatal = harm && wouldCombust(placement, { affliction }, Math.abs(projection.delta));
      diff = {
        from: Math.min(spent, projected),
        to: Math.max(spent, projected),
        color: fatal ? COMBUST_WARNING
          : harm ? VALENCE_COLOR.Affliction
          : VALENCE_COLOR.Testimony,
      };
    }
  }

  return (
    <g transform={`translate(${point.cx}, ${point.cy})`} style={{ pointerEvents: "none" }}>
      {/* The whole ceiling, faint. What shows through is the affliction already
          spent, and the full extent is the planet's Resolve. */}
      <ArcStroke r={r} from={at(0)} to={at(ceiling)} full={ceiling >= 360}
        stroke={NEUTRAL.bone} opacity={CHART_STYLE.afflictionArc.trackOpacity} width={stroke} />
      {spent < ceiling && (
        <ArcStroke r={r} from={at(spent)} to={at(ceiling)} full={spent <= 0 && ceiling >= 360}
          stroke={NEUTRAL.bone} opacity={CHART_STYLE.afflictionArc.remainingOpacity} width={stroke} />
      )}
      {diff && (
        // `color` feeds the class's currentColor drop-shadow, so the glow
        // follows the verb — and the ember, when the blow is fatal.
        <g
          className="arc-diff"
          style={{
            color: diff.color,
            "--arc-diff-glow": `${tuning.arcDiffGlow}px`,
          } as CSSProperties}
        >
          <ArcStroke r={r} from={at(diff.from)} to={at(diff.to)} full={false}
            stroke={diff.color} opacity={CHART_STYLE.afflictionArc.diffOpacity}
            width={tuning.arcDiffStroke} />
        </g>
      )}
    </g>
  );
}

/** One arc of a circle centered on the local origin, `from`→`to` in the same
 *  degree convention as `polar` (0 = 3 o'clock, increasing counterclockwise on
 *  screen). A 360° sweep has no arc path — both endpoints coincide — so the one
 *  placement that reaches it (a fixed-earth Saturn) draws a circle instead. */
function ArcStroke({
  r, from, to, full, stroke, opacity, width,
}: {
  r: number; from: number; to: number; full: boolean;
  stroke: string; opacity: number; width: number;
}) {
  const shared = {
    fill: "none" as const,
    stroke,
    strokeOpacity: opacity,
    strokeWidth: width,
  };
  if (full) return <circle r={r} {...shared} />;
  const a = polar(0, 0, r, from);
  const b = polar(0, 0, r, to);
  const large = to - from > 180 ? 1 : 0;
  // sweep-flag 0 draws counterclockwise on screen (SVG's y axis points down).
  return (
    <path d={`M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 0 ${b.x} ${b.y}`}
      strokeLinecap="round" {...shared} />
  );
}

/**
 * The corona — an acting planet's verb, drawn as streamers radiating past the
 * interaction ring. Colour already carries the verb on the ring; this carries it
 * in silhouette too, so "which planet is acting, and how" reads as one shape
 * rather than as a hue the player has to recall.
 *
 * Radial line segments are the one primitive still free around a planet: the
 * filled circle is the disc, a complete circle is the interaction ring, a partial
 * arc is affliction, a gradient bloom is identity, and an expanding circle is
 * combustion. Rays terminate in empty space, so they can't be read as aspect
 * lines, which always span planet to planet.
 */
function PlanetCorona({ verb }: { verb: Polarity }) {
  const spec = CHART_STYLE.corona[verb];
  const span = spec.reach - CORONA_INNER_R;
  const rays = Array.from({ length: spec.rays }, (_, i) => {
    // Every other ray falls short on an afflict corona, which is what breaks the
    // outline into a flare. `flare: 1` leaves testify's fringe even.
    const reach = CORONA_INNER_R + span * (i % 2 === 0 ? 1 : spec.flare);
    const deg = (360 / spec.rays) * i;
    const a = polar(0, 0, CORONA_INNER_R, deg);
    const b = polar(0, 0, reach, deg);
    return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
  });
  return (
    <g
      className="planet-corona"
      style={{ animationDuration: spec.turn, animationDirection: spec.spin }}
      stroke={VALENCE_COLOR[verb]}
      strokeWidth={spec.stroke}
      strokeOpacity={spec.opacity}
      strokeLinecap={spec.cap}
    >
      {rays}
    </g>
  );
}

/**
 * The incoming mark — the corona again, at the wheel's centre, with the
 * magnitude inside it: the corona is the verb wherever it is, the source around
 * a disc and the destination around nothing. Exempt from the cluster budget for
 * the same reason the corona is — only one blow is in flight, and the nearest
 * planets are at radius 95.
 *
 * The number is Word layer (STYLE.md §9), the same layer the sign labels around
 * the rim sit on. It carries the magnitude through resolution, when the panel
 * has closed at commit and its Testify/Afflict button — the only other place
 * your own outgoing figure is written — has gone with it.
 */
function IncomingMark({ verb, amount }: { verb: Polarity; amount: number }) {
  const { fontSize, opacity } = CHART_STYLE.incoming;
  const c = VALENCE_COLOR[verb];
  return (
    <g transform={`translate(${CHART_CENTER}, ${CHART_CENTER})`} style={{ pointerEvents: "none" }}>
      <PlanetCorona verb={verb} />
      {/* Steady, never breathing: the mark is not tappable and never will be,
          and steady is already the ring's reading for a settled thing. */}
      <circle r={INTERACTION_RING_R} fill="none"
        stroke={c} strokeWidth={CHART_STYLE.interactionRing.stroke}
        className="invite-ring"
        style={{ color: c, opacity: CHART_STYLE.interactionRing.steady }} />
      {/* `middle`, not `central`: the chart's serif (from tokens.css) has
          old-style figures, whose digits sit on the x-height rather than
          filling the em box — `central` centres the box and drops them 6–12
          units low. `middle` is defined as half the x-height above the
          baseline, which is where they actually are. */}
      <text textAnchor="middle" dominantBaseline="middle"
        fontSize={fontSize} fill={c} fillOpacity={opacity} fontWeight={600}
        style={{ userSelect: "none" }}>
        {amount}
      </text>
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
  projection, impact, merging, warning, animationEpoch,
}: {
  point: PlanetPoint;
  combusted: boolean;
  affliction: number;
  hideAfflictionBadge: boolean;
  projection?: ProjectionChip;
  merging: boolean;
  impact: boolean;
  warning: boolean;
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
  // Pill width = measured content + a fixed pad, floored at 2*r (circle). The
  // pad is proportional to font size, not character count, so "+6" and "+12"
  // carry the same breathing room rather than longer numbers drifting looser.
  const widthFor = (text: string, fontSize: number, pillR: number) =>
    Math.max(2 * pillR, measureBadgeText(text, fontSize) + fontSize * 0.8);

  const epoch = animationEpoch ?? 0;
  const badgeClass = impact ? "anim-impact" : undefined;

  // A combust warning surfaces the pill even at zero affliction — with ceilings
  // at durability × 6, a top blow can cover the most fragile ceiling, so the
  // warning can no longer assume an existing badge to ride (SCREENS.md).
  const showAffliction = !hideAfflictionBadge && !combusted && (affliction > 0 || warning);
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

  let projBadge: { wP: number; pX: number; pY: number; sign: string; mag: string; col: string } | null = null;
  if (showProjection && projection) {
    const isHarm = projection.polarity !== "Testimony";
    // Sign prefix + valence color both carry direction — amber "+N" adds
    // affliction, violet "−N" heals it — so the impact reads at a glance.
    // The sign renders as a smaller, lighter prefix (see below) so the digit —
    // the thing the player reads — sits centered in the pill rather than shoved
    // right by a full-size operator.
    const sign = isHarm ? "+" : "−";
    const mag = Math.abs(projection.delta).toFixed(1).replace(/\.0$/, "");
    const wP = widthFor(sign + mag, projFontSize, projBadgeR);
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
      sign,
      mag,
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
            {/* Combust warning: blurred ember underlay breathing on the shared
                clock, ember digits; the pill itself keeps its resting gold
                border. Ember stays clear of the projection chip's amber, so
                colored digits here can't read as a projected delta. */}
            {warning && (
              <rect
                x={-wA / 2} y={-badgeR}
                width={wA} height={2 * badgeR}
                rx={badgeR} ry={badgeR}
                className="anim-combust-warning"
                fill="none"
                stroke={COMBUST_WARNING}
                strokeWidth={CHART_STYLE.badge.warningGlowStroke} />
            )}
            <rect
              x={-wA / 2} y={-badgeR}
              width={wA} height={2 * badgeR}
              rx={badgeR} ry={badgeR}
              fill={NEUTRAL.void} fillOpacity={CHART_STYLE.badge.afflictionFill}
              stroke={NEUTRAL.gold} strokeOpacity={CHART_STYLE.badge.afflictionBorder} strokeWidth={CHART_STYLE.badge.borderStroke} />
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
                  color: warning ? COMBUST_WARNING : NEUTRAL.bone,
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
            fill={NEUTRAL.void} fillOpacity={CHART_STYLE.badge.projectionFill}
            stroke={NEUTRAL.gold} strokeOpacity={CHART_STYLE.badge.projectionBorder} strokeWidth={CHART_STYLE.badge.borderStroke} />
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
              <span
                style={{
                  fontSize: "0.72em",
                  fontWeight: 600,
                  opacity: CHART_STYLE.badge.signPrefixOpacity,
                  marginRight: "0.5px",
                }}
              >
                {projBadge.sign}
              </span>
              {projBadge.mag}
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
  // Gentle full turn (~120s) as SMIL, so the motion lives in the SVG markup
  // itself — exactly what the on-chain NFT SVG will emit. Omitted under
  // prefers-reduced-motion (the still figure reads fine at any angle).
  //
  // The two halves take the same period and opposite signs, so the ground reads
  // as layers rather than one rigid object. They can afford to: the star's reach
  // is inside the vesica's closest approach to centre, so the figures never
  // intersect and opposing them creates no crossings to shimmer. One period,
  // deliberately — two would beat against each other, and a beat is a second
  // rhythm however it is labelled (`spec/design/STYLE.md §11`).
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


function buildPlanetPoints(chart: ChartType, discR: number): PlanetPoint[] {
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
        glyphR: discR,
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
