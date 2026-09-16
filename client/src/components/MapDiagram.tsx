import { useMemo, useState, type CSSProperties } from "react";
import { playFocusSound, playHoverSound } from "@/audio/interaction";
import { layoutNodes, eligibleNext, ROOT_NODE_ID } from "@/game/map-gen";
import { chartRuler, seededChart } from "@/game/chart";
import { HOUSES } from "@/data/houses";
import { NEUTRAL, PLANET_PRIMARY } from "@/svg/palette";
import { FORTUNE_STYLE, HOUSE_BORDER, MAP_PADDING } from "@/svg/map-style";
import { hexagramPoints } from "@/svg/geometry";
import type { MapState, PlanetName } from "@/game/types";

interface MapDiagramProps {
  map: MapState;
  onSelectNode?: (nodeId: string) => void;
  style?: CSSProperties;
  /** When true (default), layer 1 sits at the bottom and the player walks upward. */
  bottomUp?: boolean;
}

export const NODE_R = 22;
const ENCOUNTER_TRIANGLES = hexagramPoints(0, 0, NODE_R);
// Tiered visual scale used by both the edge web and the nodes themselves.
// Semantic: solid past, translucent next-steps, faint distance.
// Each tier bundles the values that move together (opacity + stroke
// width) so retuning one stays internally consistent.
// Opacity floors are tuned so even the faintest tier clears the noise floor of
// social-media video re-encoding (H.264/VP9 quantization flattens sub-~0.3
// strokes on the near-black ground to solid black). Ratios between tiers are
// preserved so the walked > reachable > skeleton hierarchy still reads.
const TIER = {
  traversed:  { opacity: 1,    stroke: 1.8 }, // the path you walked — fully realized
  eligible:   { opacity: 0.75, stroke: 1.5 }, // immediate next steps — possibility, not yet real
  background: { opacity: 0.42, stroke: 1.3 }, // distant — content visible but faint
} as const;

export function MapDiagram({ map, onSelectNode, style, bottomUp = true }: MapDiagramProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const indicatedNodeId = onSelectNode ? hoveredNodeId ?? focusedNodeId : null;

  const positioned = useMemo(() => {
    const raw = layoutNodes(map.graph.nodes);
    if (!bottomUp) return raw;
    // Flip y so layer 0 (L1) is at the bottom of the viewBox.
    const maxY = Math.max(...raw.map((n) => n.y));
    return raw.map((n) => ({ ...n, y: maxY - n.y }));
  }, [map.graph.nodes, bottomUp]);

  // "Eligible" = nodes exactly 1 layer ahead of the current position
  // (forward-only). Sibling nodes at the same layer aren't eligible — the
  // player can't backtrack or step sideways.
  const eligible = useMemo(
    () => new Set(eligibleNext(map.graph, map.currentNodeId, map.visitedNodeIds)),
    [map.graph, map.currentNodeId, map.visitedNodeIds],
  );
  const visited = useMemo(() => new Set(map.visitedNodeIds), [map.visitedNodeIds]);
  const traversedEdges = useMemo(() => {
    const edges = new Set<string>();
    for (let i = 0; i < map.visitedNodeIds.length - 1; i++) {
      edges.add(edgeKey(map.visitedNodeIds[i]!, map.visitedNodeIds[i + 1]!));
    }
    return edges;
  }, [map.visitedNodeIds]);

  const xs = positioned.map((n) => n.x);
  const ys = positioned.map((n) => n.y);
  const minX = Math.min(...xs) - MAP_PADDING;
  const maxX = Math.max(...xs) + MAP_PADDING;
  const minY = Math.min(...ys) - MAP_PADDING;
  const maxY = Math.max(...ys) + MAP_PADDING;
  const w = maxX - minX;
  const h = maxY - minY;

  // Combat nodes derive their color from the opponent's chart ruler — the
  // planet that rules the opponent's Ascendant sign. Cached per node so we
  // only build each opponent chart once per render pass.
  const combatRulerByNode = useMemo(() => {
    const out: Record<string, PlanetName> = {};
    for (const [id, content] of Object.entries(map.rolledNodes)) {
      if (content.kind !== "combat") continue;
      out[id] = chartRuler(seededChart(content.opponentSeed, ""));
    }
    return out;
  }, [map.rolledNodes]);

  // Resolve ruler color for a node.
  const ruler = (id: string): PlanetName | null => {
    const c = map.rolledNodes[id];
    if (!c) return null;
    if (c.kind === "narrative") return HOUSES[c.house - 1]!.ruler;
    if (c.kind === "combat") return combatRulerByNode[id] ?? null;
    return null;
  };

  const nodeColor = (id: string) => {
    if (id === ROOT_NODE_ID) return NEUTRAL.gold;
    const r = ruler(id);
    return r ? PLANET_PRIMARY[r] : NEUTRAL.bone;
  };

  // Edge gradients between rulers. Lines are shortened to start/end at the
  // disc rim rather than the node center, so traversed-node visuals (which
  // are dimmed via opacity) don't show the edge bleeding through the disc.
  const edgeDefs: JSX.Element[] = [];
  const edgeEls = map.graph.edges.map((e, i) => {
    const from = positioned.find((n) => n.id === e.from);
    const to = positioned.find((n) => n.id === e.to);
    if (!from || !to) return null;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    // Discs touch or overlap → nothing visible to draw.
    if (len <= NODE_R * 2) return null;
    const ux = dx / len;
    const uy = dy / len;
    const x1 = from.x + ux * NODE_R;
    const y1 = from.y + uy * NODE_R;
    const x2 = to.x - ux * NODE_R;
    const y2 = to.y - uy * NODE_R;

    const traversedEdge = traversedEdges.has(edgeKey(e.from, e.to));
    const eligibleEdge =
      (e.from === map.currentNodeId && eligible.has(e.to)) ||
      (e.to === map.currentNodeId && eligible.has(e.from));
    // Hover or focus highlights the route to an eligible node.
    // At rest the nodes carry the invitation and edges stay quiet.
    const isIndicatedEdge = eligibleEdge && indicatedNodeId !== null &&
      (e.from === indicatedNodeId || e.to === indicatedNodeId);
    const inReach = traversedEdge || isIndicatedEdge;
    const cA = nodeColor(e.from);
    const cB = nodeColor(e.to);
    const gid = `m2-edge-${i}`;
    // Gradient endpoints match the shortened line so the color travel reads
    // cleanly across the visible segment.
    edgeDefs.push(
      <linearGradient key={gid} id={gid} x1={x1} y1={y1} x2={x2} y2={y2}
        gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor={cA} />
        <stop offset="100%" stopColor={cB} />
      </linearGradient>,
    );
    // Tier:
    //   - Traversed: your committed past — gradient + TIER.traversed
    //   - Hovered/focused: the previewed route — gradient + TIER.eligible
    //   - Everything else: faint bone + TIER.background
    const tier = traversedEdge ? TIER.traversed : isIndicatedEdge ? TIER.eligible : TIER.background;
    const opacity = tier.opacity;
    const sw = tier.stroke;
    return (
      <line key={`edge-${i}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={inReach ? `url(#${gid})` : NEUTRAL.bone}
        strokeOpacity={opacity} strokeWidth={sw} strokeLinecap="round" />
    );
  });

  const haloDefs: JSX.Element[] = [];
  const nodeEls = positioned.map((n) => {
    const content = map.rolledNodes[n.id];
    const isCurrent = n.id === map.currentNodeId;
    const isEligible = eligible.has(n.id);
    const isTraversed = visited.has(n.id) && !isCurrent;
    const isDistant = !isCurrent && !isEligible && !isTraversed;
    const r = ruler(n.id);
    const color = nodeColor(n.id);
    const isNarrative = content?.kind === "narrative";
    const isCombat = content?.kind === "combat";

    // Content opacity by temporal tier. The whole map's content renders from
    // the start — a map's fate is fixed at creation (VRF seed onchain), so
    // hiding it would misstate what the player can actually know. The tiers
    // grade attention, not information: distance reads faint, not blank.
    const op = isEligible ? TIER.eligible.opacity
      : isTraversed ? TIER.traversed.opacity
      : isDistant ? TIER.background.opacity
      : 1; // current

    // The root carries the Lot of Fortune's X — the threshold where the
    // fortune roll acts at each crossing (MECHANICS §11.3). Its glow follows
    // the same state language as every node: current pulses, history is quiet.
    const isFortune = n.id === ROOT_NODE_ID;

    // Halo gradient for the current node and for eligible nodes (the latter use
    // it for the breathing "you can go here" glow, mirroring combat planets).
    if (isCurrent || isEligible) {
      haloDefs.push(
        <radialGradient key={`mh-${n.id}`} id={`m2-halo-${n.id}`}>
          <stop offset="0%" stopColor={color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>,
      );
    }

    const selectNode = onSelectNode && isEligible
      ? () => onSelectNode(n.id)
      : undefined;
    const isClickable = !!selectNode;
    const isIndicated = isClickable && (indicatedNodeId === n.id || focusedNodeId === n.id);

    return (
      <g
        key={n.id}
        transform={`translate(${n.x}, ${n.y})`}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={isClickable ? isNarrative ? `House ${romanHouse(content.house)}` : `${r ?? "Planet"} encounter` : undefined}
        onClick={selectNode ? (e) => { e.stopPropagation(); selectNode(); } : undefined}
        onKeyDown={selectNode ? (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            if (!e.repeat) selectNode();
          }
        } : undefined}
        onMouseEnter={isClickable ? () => setHoveredNodeId(n.id) : undefined}
        onMouseLeave={isClickable ? () => setHoveredNodeId(null) : undefined}
        onPointerEnter={isClickable ? playHoverSound : undefined}
        onFocus={isClickable ? (e) => {
          setHoveredNodeId(null);
          setFocusedNodeId(n.id);
          playFocusSound(e);
        } : undefined}
        onBlur={isClickable ? () => setFocusedNodeId(null) : undefined}
        style={{ cursor: isClickable ? "pointer" : "default", color }}
      >
        {isCurrent && (
          <>
            <circle r={55} fill={`url(#m2-halo-${n.id})`} className="anim-map-current-halo" />
            <circle r={NODE_R + 6} fill="none"
              stroke={color} strokeOpacity="0.95" strokeWidth={1.2} />
          </>
        )}
        {/* Eligible nodes breathe until hover or focus makes the invitation steady. */}
        {isEligible && (
          <>
            {/* Resting opacity comes from the class (the shared --breath clock);
                inline opacity only during preview, so it doesn't shadow the calc. */}
            <circle r={NODE_R * 1.8} fill={`url(#m2-halo-${n.id})`}
              className={isIndicated ? undefined : "anim-invite-glow"}
              style={{ opacity: isIndicated ? 1 : undefined, pointerEvents: "none" }} />
            {/* Stroke 3 ≈ the chart invite's heavy ring scaled to node radius. */}
            <circle r={NODE_R + 6} fill="none" stroke={color} strokeWidth={3}
              className={isIndicated ? "invite-ring" : "invite-ring anim-invite-ring"}
              style={{ opacity: isIndicated ? 1 : undefined, pointerEvents: "none" }} />
          </>
        )}
        <circle r={NODE_R}
          data-guide={`node-${n.id}`}
          fill={isNarrative || isFortune ? color : "transparent"}
          fillOpacity={isFortune ? op : isNarrative ? (isCurrent ? 0.98 : op) : 0}
          stroke={color}
          strokeOpacity={op}
          strokeWidth={isCurrent ? 2.4 : isDistant ? TIER.background.stroke : 1.8} />
        {/* Dark cross and inner rim divide the solid gold Fortune disc. */}
        {isFortune && (() => {
          // Match the outside edge of the house's dark rim, leaving the same colored band.
          const innerR = HOUSE_BORDER.rimR + (HOUSE_BORDER.stroke - FORTUNE_STYLE.stroke) / 2;
          const d = innerR * Math.SQRT1_2;
          return (
            <g stroke={NEUTRAL.void} strokeOpacity={op} strokeWidth={FORTUNE_STYLE.stroke}
              strokeLinecap="round" style={{ pointerEvents: "none" }}>
              <circle r={innerR} fill="none" />
              <line x1={-d} y1={-d} x2={d} y2={d} />
              <line x1={-d} y1={d} x2={d} y2={-d} />
            </g>
          );
        })()}
        {isNarrative && r && (
          <>
            <circle r={HOUSE_BORDER.rimR} fill="none"
              stroke={NEUTRAL.void} strokeOpacity={op}
              strokeWidth={HOUSE_BORDER.stroke} style={{ pointerEvents: "none" }} />
            <text textAnchor="middle" dominantBaseline="central"
              fontSize={14}
              fill={NEUTRAL.void}
              fillOpacity={op}
              fontFamily="'Cormorant Garamond', Garamond, serif"
              fontWeight={700}
              style={{ pointerEvents: "none", userSelect: "none" }}>
              {romanHouse(content.house)}
            </text>
          </>
        )}
        {isCombat && (() => {
          const fillOp = isCurrent ? 0.85 : op * 0.78;
          return (
            <g style={{ pointerEvents: "none" }}>
              {ENCOUNTER_TRIANGLES.map((points, i) => (
                <polygon key={i} points={points}
                  fill={color} fillOpacity={fillOp}
                  stroke={color} strokeOpacity={op}
                  strokeWidth={1} strokeLinejoin="round" />
              ))}
            </g>
          );
        })()}
      </g>
    );
  });

  return (
    <svg
      className="map-svg"
      data-guide="map"
      viewBox={`${minX} ${minY} ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", ...style }}
      role="img"
      aria-label="Map"
    >
      <defs>{edgeDefs}{haloDefs}</defs>
      {edgeEls}
      {nodeEls}
    </svg>
  );
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function romanHouse(house: number): string {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return numerals[house - 1] ?? String(house);
}
