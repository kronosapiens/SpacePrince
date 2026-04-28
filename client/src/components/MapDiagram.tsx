import { useMemo, type CSSProperties } from "react";
import { layoutNodes, eligibleNext } from "@/game/map-gen";
import { HOUSES } from "@/data/houses";
import { NEUTRAL, PLANET_PRIMARY } from "@/svg/palette";
import type { MapState, PlanetName } from "@/game/types";

interface MapDiagramProps {
  map: MapState;
  onSelectNode?: (nodeId: string) => void;
  style?: CSSProperties;
  /** When true (default), layer 1 sits at the bottom and the player walks upward. */
  bottomUp?: boolean;
}

const NODE_R = 22;
const NODE_R_CURRENT = 28;
const TRAVERSED_OPACITY = 0.35;

export function MapDiagram({ map, onSelectNode, style, bottomUp = true }: MapDiagramProps) {
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
    () => new Set(eligibleNext(map.graph, map.currentNodeId)),
    [map.graph, map.currentNodeId],
  );
  const visited = useMemo(() => new Set(map.visitedNodeIds), [map.visitedNodeIds]);

  const xs = positioned.map((n) => n.x);
  const ys = positioned.map((n) => n.y);
  const minX = Math.min(...xs) - 90;
  const maxX = Math.max(...xs) + 90;
  const minY = Math.min(...ys) - 90;
  const maxY = Math.max(...ys) + 90;
  const w = maxX - minX;
  const h = maxY - minY;

  // Resolve ruler color for a node.
  const ruler = (id: string): PlanetName | null => {
    const c = map.rolledNodes[id];
    if (!c) return null;
    if (c.kind === "narrative") return HOUSES[c.house - 1]!.ruler;
    return null;
  };

  // Edge gradients between rulers.
  const edgeDefs: JSX.Element[] = [];
  const edgeEls = map.graph.edges.map((e, i) => {
    const from = positioned.find((n) => n.id === e.from);
    const to = positioned.find((n) => n.id === e.to);
    if (!from || !to) return null;
    const traversedFrom = visited.has(e.from);
    const traversedTo = visited.has(e.to);
    const both = traversedFrom && traversedTo;
    const eligibleEdge =
      (e.from === map.currentNodeId && eligible.has(e.to)) ||
      (e.to === map.currentNodeId && eligible.has(e.from));
    void eligibleEdge;
    const inReach = both || eligibleEdge;
    const rA = ruler(e.from);
    const rB = ruler(e.to);
    const cA = rA ? PLANET_PRIMARY[rA] : NEUTRAL.bone;
    const cB = rB ? PLANET_PRIMARY[rB] : NEUTRAL.bone;
    const gid = `m2-edge-${i}`;
    edgeDefs.push(
      <linearGradient key={gid} id={gid} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
        gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor={cA} />
        <stop offset="100%" stopColor={cB} />
      </linearGradient>,
    );
    const opacity = both ? 0.7 : eligibleEdge ? 0.55 : 0.12;
    const sw = both ? 1.6 : eligibleEdge ? 1.2 : 0.5;
    return (
      <line key={`edge-${i}`}
        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
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
    const color = r ? PLANET_PRIMARY[r] : NEUTRAL.bone;
    const isNarrative = content?.kind === "narrative";
    const isCombat = content?.kind === "combat";

    if (isCurrent) {
      haloDefs.push(
        <radialGradient key={`mh-${n.id}`} id={`m2-halo-${n.id}`}>
          <stop offset="0%" stopColor={color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>,
      );
    }

    const handleClick = onSelectNode && isEligible
      ? () => onSelectNode(n.id)
      : undefined;
    const isClickable = !!handleClick;

    // Distant nodes (>1 layer ahead, or off-path) render as light outline
    // circles only — no fill, no glyph, regardless of whether content has
    // been pre-rolled. The player can't see what's on the road yet.
    if (isDistant) {
      return (
        <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
          <circle r={NODE_R} fill="none"
            stroke={NEUTRAL.bone} strokeOpacity="0.18" strokeWidth={1} />
        </g>
      );
    }

    const nodeRadius = isCurrent ? NODE_R_CURRENT : NODE_R;

    return (
      <g
        key={n.id}
        transform={`translate(${n.x}, ${n.y})`}
        onClick={handleClick}
        style={{ cursor: isClickable ? "pointer" : "default" }}
      >
        {isCurrent && (
          <>
            <circle r={80} fill={`url(#m2-halo-${n.id})`} />
            <circle r={NODE_R_CURRENT + 6} fill="none"
              stroke={color} strokeOpacity="0.95" strokeWidth={1.2} />
          </>
        )}
        {isEligible && (
          <circle r={32} fill="none"
            stroke={color} strokeOpacity="0.55" strokeWidth={1} />
        )}
        <circle r={nodeRadius}
          fill={isNarrative ? color : "transparent"}
          fillOpacity={isNarrative ? (isTraversed ? TRAVERSED_OPACITY : 0.9) : 0}
          stroke={color}
          strokeOpacity={isTraversed ? TRAVERSED_OPACITY : 1}
          strokeWidth={isCurrent ? 2.4 : 1.8} />
        {isNarrative && r && (
          <text textAnchor="middle" dominantBaseline="central"
            fontSize={isCurrent ? 22 : 18}
            fill={isTraversed ? color : NEUTRAL.void}
            fillOpacity={isTraversed ? 0.55 : 1}
            fontFamily="'Cormorant Garamond', 'Noto Sans Symbols 2', 'Apple Symbols', serif"
            fontWeight={600}
            style={{ pointerEvents: "none", userSelect: "none" }}>
            {planetGlyph(r)}
          </text>
        )}
        {isCombat && (
          <circle r={isCurrent ? 11 : 8} fill="none" stroke={color}
            strokeOpacity={isTraversed ? TRAVERSED_OPACITY : 0.9} strokeWidth={1} />
        )}
      </g>
    );
  });

  return (
    <svg
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

function planetGlyph(p: PlanetName): string {
  const VS = "︎";
  const map: Record<PlanetName, string> = {
    Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀",
    Mars: "♂", Jupiter: "♃", Saturn: "♄",
  };
  return map[p] + VS;
}
