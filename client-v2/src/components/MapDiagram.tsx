import { useMemo, type CSSProperties } from "react";
import { layoutNodes, eligibleNext, neighborsOf, NUM_LAYERS } from "@/game/map-gen";
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

export function MapDiagram({ map, onSelectNode, style, bottomUp = true }: MapDiagramProps) {
  const positioned = useMemo(() => {
    const raw = layoutNodes(map.graph.nodes);
    if (!bottomUp) return raw;
    // Flip y so layer 0 (L1) is at the bottom of the viewBox.
    const maxY = Math.max(...raw.map((n) => n.y));
    return raw.map((n) => ({ ...n, y: maxY - n.y }));
  }, [map.graph.nodes, bottomUp]);

  const eligible = useMemo(
    () => new Set(eligibleNext(map.graph, map.currentNodeId)),
    [map.graph, map.currentNodeId],
  );
  const visited = useMemo(() => new Set(map.visitedNodeIds), [map.visitedNodeIds]);
  const eligibleNeighbors = useMemo(
    () => new Set(neighborsOf(map.graph.edges, map.currentNodeId)),
    [map.graph.edges, map.currentNodeId],
  );

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
    const isEligible = eligibleNeighbors.has(n.id) && !visited.has(n.id);
    const isTraversed = visited.has(n.id) && !isCurrent;
    const distant = !isCurrent && !isEligible && !isTraversed;
    const r = ruler(n.id);
    const color = r ? PLANET_PRIMARY[r] : NEUTRAL.bone;
    const isNarrative = content?.kind === "narrative";
    const isCombat = content?.kind === "combat";

    if (isCurrent) {
      haloDefs.push(
        <radialGradient key={`mh-${n.id}`} id={`m2-halo-${n.id}`}>
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>,
      );
    }

    const handleClick = onSelectNode && eligibleNeighbors.has(n.id) && !isCurrent
      ? () => onSelectNode(n.id)
      : undefined;
    const isClickable = !!handleClick;

    if (distant && !content) {
      // Placeholder — small unstyled dot.
      return (
        <circle key={n.id} cx={n.x} cy={n.y} r={4}
          fill={NEUTRAL.bone} fillOpacity="0.25" />
      );
    }

    return (
      <g
        key={n.id}
        transform={`translate(${n.x}, ${n.y})`}
        onClick={handleClick}
        style={{ cursor: isClickable ? "pointer" : "default" }}
      >
        {isCurrent && (
          <circle r={64} fill={`url(#m2-halo-${n.id})`} className="anim-pulse-active" />
        )}
        {isEligible && (
          <circle r={32} fill="none"
            stroke={color} strokeOpacity="0.45" strokeWidth={1}>
            <animate attributeName="r" values="26;34;26" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.2;0.55;0.2" dur="2.4s" repeatCount="indefinite" />
          </circle>
        )}
        <circle r={NODE_R}
          fill={isNarrative ? color : "transparent"}
          fillOpacity={isNarrative ? (isTraversed ? 0.2 : 0.85) : 0}
          stroke={color}
          strokeOpacity={isTraversed ? 0.4 : 1}
          strokeWidth={1.8} />
        {isNarrative && r && (
          <text textAnchor="middle" dominantBaseline="central"
            fontSize={18} fill={isTraversed ? color : NEUTRAL.void}
            fillOpacity={isTraversed ? 0.6 : 1}
            fontFamily="'Cormorant Garamond', 'Noto Sans Symbols 2', 'Apple Symbols', serif"
            fontWeight={600}
            style={{ pointerEvents: "none", userSelect: "none" }}>
            {planetGlyph(r)}
          </text>
        )}
        {isCombat && (
          <circle r={8} fill="none" stroke={color}
            strokeOpacity={isTraversed ? 0.4 : 0.85} strokeWidth={1} />
        )}
      </g>
    );
  });

  void NUM_LAYERS;

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
