import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { layoutNodes, eligibleNext } from "@/game/map-gen";
import { seededChart } from "@/game/chart";
import { RULERSHIP } from "@/game/data";
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
const COMBAT_TRI_R = 25; // hexagram outer radius — extends slightly past NODE_R
// Semantic opacity: solid past, translucent future. Traversed (the path
// you actually walked) renders close to fully solid; eligible (the
// hypothetical next steps) renders translucent so the eye reads them as
// "possibility, not yet real." The current node and distant background
// keep their existing treatments.
const TRAVERSED_OPACITY = 0.95;
const ELIGIBLE_OPACITY = 0.55;

export function MapDiagram({ map, onSelectNode, style, bottomUp = true }: MapDiagramProps) {
  // Tap-to-preview / tap-again-to-commit, mirroring the encounter screen's
  // grammar. First click on an eligible node highlights it; a second click
  // on the same node fires onSelectNode. Clicking a different eligible node
  // switches the highlight without committing.
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Reset preview when the player actually moves (current node changes).
  useEffect(() => {
    setSelectedNodeId(null);
  }, [map.currentNodeId]);

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
  const minX = Math.min(...xs) - 90;
  const maxX = Math.max(...xs) + 90;
  const minY = Math.min(...ys) - 90;
  const maxY = Math.max(...ys) + 90;
  const w = maxX - minX;
  const h = maxY - minY;

  // Combat nodes derive their color from the opponent's chart ruler — the
  // planet that rules the opponent's Ascendant sign. Cached per node so we
  // only build each opponent chart once per render pass.
  const combatRulerByNode = useMemo(() => {
    const out: Record<string, PlanetName> = {};
    for (const [id, content] of Object.entries(map.rolledNodes)) {
      if (content.kind !== "combat") continue;
      const chart = seededChart(content.opponentSeed, "");
      out[id] = RULERSHIP[chart.ascendantSign];
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
    const inReach = traversedEdge || eligibleEdge;
    const rA = ruler(e.from);
    const rB = ruler(e.to);
    const cA = rA ? PLANET_PRIMARY[rA] : NEUTRAL.bone;
    const cB = rB ? PLANET_PRIMARY[rB] : NEUTRAL.bone;
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
    // Visual hierarchy:
    //   - Eligible (forward path, the immediate decision) — brightest gradient
    //   - Traversed (your colored trail, faded) — gradient at 0.45 (slightly
    //     more present than the 0.35 node dim so the path stays readable)
    //   - Background (the Sephirot structure) — faint bone
    const opacity = traversedEdge ? 0.85 : eligibleEdge ? 0.4 : 0.2;
    const sw = traversedEdge ? 1.6 : eligibleEdge ? 1.2 : 0.9;
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

    const isSelected = isEligible && n.id === selectedNodeId;
    const handleClick = onSelectNode && isEligible
      ? () => {
          if (selectedNodeId === n.id) {
            onSelectNode(n.id);
            setSelectedNodeId(null);
          } else {
            setSelectedNodeId(n.id);
          }
        }
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

    return (
      <g
        key={n.id}
        transform={`translate(${n.x}, ${n.y})`}
        onClick={handleClick}
        style={{ cursor: isClickable ? "pointer" : "default" }}
      >
        {isCurrent && (
          <>
            <circle r={55} fill={`url(#m2-halo-${n.id})`} className="anim-map-current-halo" />
            <circle r={NODE_R + 6} fill="none"
              stroke={color} strokeOpacity="0.95" strokeWidth={1.2} />
          </>
        )}
        {isSelected && (
          <circle r={NODE_R + 10} fill="none"
            stroke={color} strokeOpacity="0.95" strokeWidth={1.8} />
        )}
        {isEligible && !isSelected && (
          <circle r={NODE_R + 10} fill="none"
            stroke={color} strokeOpacity="0.7" strokeWidth={1} />
        )}
        <circle r={NODE_R}
          fill={isNarrative ? color : "transparent"}
          fillOpacity={isNarrative ? (isEligible ? ELIGIBLE_OPACITY : isTraversed ? TRAVERSED_OPACITY : 0.98) : 0}
          stroke={color}
          strokeOpacity={isEligible ? ELIGIBLE_OPACITY : isTraversed ? TRAVERSED_OPACITY : 1}
          strokeWidth={isCurrent ? 2.4 : 1.8} />
        {isNarrative && r && (
          <text textAnchor="middle" dominantBaseline="central"
            fontSize={14}
            fill={NEUTRAL.void}
            fillOpacity={isEligible ? ELIGIBLE_OPACITY : 1}
            fontFamily="'Cormorant Garamond', Garamond, serif"
            fontWeight={700}
            style={{ pointerEvents: "none", userSelect: "none" }}>
            {romanHouse(content.house)}
          </text>
        )}
        {isCombat && (() => {
          const fillOp = isEligible ? ELIGIBLE_OPACITY * 0.78 : isTraversed ? TRAVERSED_OPACITY * 0.78 : 0.85;
          const strokeOp = isEligible ? ELIGIBLE_OPACITY : isTraversed ? TRAVERSED_OPACITY : 1;
          return (
            <>
              <polygon
                points={trianglePoints(0, 0, COMBAT_TRI_R, 90)}
                fill={color} fillOpacity={fillOp}
                stroke={color} strokeOpacity={strokeOp}
                strokeWidth={1} strokeLinejoin="round" />
              <polygon
                points={trianglePoints(0, 0, COMBAT_TRI_R, 270)}
                fill={color} fillOpacity={fillOp}
                stroke={color} strokeOpacity={strokeOp}
                strokeWidth={1} strokeLinejoin="round" />
            </>
          );
        })()}
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

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function romanHouse(house: number): string {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return numerals[house - 1] ?? String(house);
}

/** Three vertices of an equilateral triangle, circumradius `r`, with the
 *  first vertex at angle `baseDeg` (math convention: 90° = top, 270° = bottom).
 *  Two of these at 90° + 270° form a hexagram. */
function trianglePoints(cx: number, cy: number, r: number, baseDeg: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 3; i++) {
    const rad = ((baseDeg + i * 120) * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy - r * Math.sin(rad); // SVG y-axis flipped vs. math convention
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}
