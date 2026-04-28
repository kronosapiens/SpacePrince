import type { MapEdge, PositionedMapNode } from "../game/map";

interface Props {
  nodes: PositionedMapNode[];
  edges: MapEdge[];
  currentId: string | null;
  visited: Set<string>;
  eligible: Set<string>;
  onNodeClick: (id: string) => void;
}

export function MapView({
  nodes,
  edges,
  currentId,
  visited,
  eligible,
  onNodeClick,
}: Props) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <svg
      className="map-svg"
      viewBox="-280 -40 560 740"
      preserveAspectRatio="xMidYMid meet"
    >
      {edges.map((edge, i) => {
        const from = byId[edge.from];
        const to = byId[edge.to];
        if (!from || !to) return null;
        const touchesCurrent =
          currentId !== null &&
          (edge.from === currentId || edge.to === currentId);
        return (
          <line
            key={`e${i}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className={`map-edge map-edge-${edge.type}${
              touchesCurrent ? " map-edge-active" : ""
            }`}
          />
        );
      })}

      {nodes.map((node) => {
        const isCurrent = node.id === currentId;
        const isVisited = visited.has(node.id) && !isCurrent;
        const isEligible = eligible.has(node.id) && !isCurrent;
        const stateClass = isCurrent
          ? "map-node-current"
          : isVisited
          ? "map-node-visited"
          : isEligible
          ? "map-node-eligible"
          : "map-node-idle";
        return (
          <g
            key={node.id}
            className={`map-node ${
              node.pillar === "C" ? "map-node-central" : "map-node-side"
            } ${stateClass}`}
            onClick={() => onNodeClick(node.id)}
          >
            <circle cx={node.x} cy={node.y} r={18} className="map-node-circle" />
            <text
              x={node.x}
              y={node.y + 3}
              className="map-node-label"
              textAnchor="middle"
            >
              {node.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
