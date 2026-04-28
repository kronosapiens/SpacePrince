import { useMemo, type CSSProperties } from "react";
import { layoutNodes, eligibleNext, neighborsOf } from "@/game/map-gen";
import { HOUSES } from "@/data/houses";
import { NEUTRAL, PLANET_PRIMARY } from "@/svg/palette";
import { STROKE_HAIRLINE, STROKE_LIGHT, STROKE_MEDIUM, STROKE_REGULAR } from "@/svg/viewbox";
import type { MapState, NodeContent, PlanetName } from "@/game/types";

const NODE_R_REST = 18;
const NODE_R_CURRENT = 22;

interface MapDiagramProps {
  map: MapState;
  onSelectNode?: (nodeId: string) => void;
  style?: CSSProperties;
}

export function MapDiagram({ map, onSelectNode, style }: MapDiagramProps) {
  const positioned = useMemo(() => layoutNodes(map.graph.nodes), [map.graph.nodes]);
  const eligible = useMemo(() => new Set(eligibleNext(map.graph, map.currentNodeId)), [map.graph, map.currentNodeId]);
  const visited = useMemo(() => new Set(map.visitedNodeIds), [map.visitedNodeIds]);
  const eligibleNeighbors = useMemo(
    () => new Set(neighborsOf(map.graph.edges, map.currentNodeId)),
    [map.graph.edges, map.currentNodeId],
  );

  // Compute viewBox from positioned coords with margin (≥15% per SCREENS.md §4.1)
  const xs = positioned.map((n) => n.x);
  const ys = positioned.map((n) => n.y);
  const minX = Math.min(...xs) - 80;
  const maxX = Math.max(...xs) + 80;
  const minY = Math.min(...ys) - 80;
  const maxY = Math.max(...ys) + 80;
  const w = maxX - minX;
  const h = maxY - minY;

  return (
    <svg
      viewBox={`${minX} ${minY} ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", ...style }}
      role="img"
      aria-label="Map"
    >
      {/* Edges */}
      <g>
        {map.graph.edges.map((e) => {
          const from = positioned.find((n) => n.id === e.from);
          const to = positioned.find((n) => n.id === e.to);
          if (!from || !to) return null;
          const traversedFrom = visited.has(e.from);
          const traversedTo = visited.has(e.to);
          const both = traversedFrom && traversedTo;
          const eligibleEdge = (e.from === map.currentNodeId && eligible.has(e.to)) ||
                               (e.to === map.currentNodeId && eligible.has(e.from));
          let stroke: string = NEUTRAL.mist;
          let opacity = 0.18;
          let weight: number = STROKE_HAIRLINE;
          if (both) { opacity = 0.55; weight = STROKE_LIGHT; }
          if (eligibleEdge) { stroke = NEUTRAL.bone; opacity = 0.85; weight = STROKE_MEDIUM; }
          return (
            <line
              key={`${e.from}_${e.to}`}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={stroke}
              strokeWidth={weight}
              strokeLinecap="round"
              opacity={opacity}
            />
          );
        })}
      </g>

      {/* Nodes */}
      <g>
        {positioned.map((n) => {
          const content = map.rolledNodes[n.id];
          const isCurrent = n.id === map.currentNodeId;
          const isEligible = eligibleNeighbors.has(n.id);
          const isTraversed = visited.has(n.id) && !isCurrent;
          const isFrontier = isEligible && !isTraversed && !isCurrent;
          const distant = !isCurrent && !isEligible && !isTraversed;
          const r = isCurrent ? NODE_R_CURRENT : NODE_R_REST;
          const handleClick = () => {
            if (!onSelectNode) return;
            if (!isEligible) return;
            onSelectNode(n.id);
          };
          const fill = nodeFill(content, isCurrent, isFrontier, isTraversed);
          const stroke = nodeStroke(content, isCurrent, isFrontier, isTraversed, distant);
          const opacity = isTraversed ? 0.35 : distant ? 0.4 : 1;
          const className =
            isFrontier ? "anim-map-arrival" :
            isCurrent ? "anim-pulse-active" :
            "";
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              onClick={isEligible ? handleClick : undefined}
              style={{ cursor: isEligible ? "pointer" : "default", transformOrigin: "center" }}
              className={className}
            >
              {isCurrent && (
                <circle r={r + 16} fill="none" stroke={NEUTRAL.bone} strokeWidth={STROKE_HAIRLINE} opacity={0.6} />
              )}
              <circle
                r={r}
                fill={fill}
                stroke={stroke}
                strokeWidth={STROKE_REGULAR}
                opacity={opacity}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function nodeFill(content: NodeContent | undefined, isCurrent: boolean, isFrontier: boolean, isTraversed: boolean): string {
  if (!content) return "transparent";
  if (content.kind === "narrative") {
    const ruler = HOUSES[content.house - 1]!.ruler;
    const color = PLANET_PRIMARY[ruler];
    if (isCurrent || isFrontier) return color;
    if (isTraversed) return color;
    return color;
  }
  // combat = ringed circle, no fill
  return "transparent";
}

function nodeStroke(content: NodeContent | undefined, isCurrent: boolean, isFrontier: boolean, _isTraversed: boolean, distant: boolean): string {
  void _isTraversed; void isFrontier; void isCurrent;
  if (distant) return NEUTRAL.mist;
  if (!content) return NEUTRAL.mist;
  if (content.kind === "narrative") {
    const ruler = HOUSES[content.house - 1]!.ruler;
    return PLANET_PRIMARY[ruler];
  }
  return NEUTRAL.bone;
}

export function findNearestPlanetForNode(content: NodeContent | undefined): PlanetName | null {
  if (!content) return null;
  if (content.kind === "narrative") return HOUSES[content.house - 1]!.ruler;
  return null;
}
