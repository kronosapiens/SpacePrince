import { mulberry32 } from "./rng";
import type {
  LayerCount,
  LayerPattern,
  MapEdge,
  MapGraph,
  MapNode,
  Pillar,
} from "./types";

export const NUM_LAYERS = 7;
export const ROOT_NODE_ID = "1C"; // entry; player starts at L1
export const TERMINAL_NODE_ID = "7C"; // L7 single

export interface PatternOptions {
  probabilities?: number[];
  forced?: (LayerCount | null)[];
}

export function generateLayerPattern(rng: () => number, opts: PatternOptions = {}): LayerPattern {
  const probabilities = opts.probabilities ?? [0.5, 0.5, 0.5, 0.5, 0.5];
  const forced = opts.forced ?? [null, null, null, null, null];
  const pattern: LayerCount[] = [1];
  for (let i = 0; i < 5; i++) {
    const f = forced[i];
    if (f !== null && f !== undefined) {
      pattern.push(f);
    } else {
      pattern.push(rng() < (probabilities[i] ?? 0.5) ? 2 : 1);
    }
  }
  pattern.push(1);
  return pattern;
}

export function generateNodes(pattern: LayerPattern): MapNode[] {
  const nodes: MapNode[] = [];
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    if (pattern[layer] === 1) {
      nodes.push({ layer, pillar: "C", id: `${layer + 1}C` });
    } else {
      nodes.push({ layer, pillar: "L", id: `${layer + 1}L` });
      nodes.push({ layer, pillar: "R", id: `${layer + 1}R` });
    }
  }
  return nodes;
}

const atLayer = (nodes: MapNode[], layer: number) => nodes.filter((n) => n.layer === layer);
const inPillar = (nodes: MapNode[], pillar: Pillar) => nodes.filter((n) => n.pillar === pillar);

export function generateEdges(nodes: MapNode[], pattern: LayerPattern): MapEdge[] {
  const edges: MapEdge[] = [];

  // 3.1 Pillar spines
  for (const pillar of ["C", "L", "R"] as Pillar[]) {
    const ps = inPillar(nodes, pillar).sort((a, b) => a.layer - b.layer);
    for (let i = 0; i < ps.length - 1; i++) {
      edges.push({ from: ps[i]!.id, to: ps[i + 1]!.id, type: "pillar" });
    }
  }

  // 3.2 Horizontal pair
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    if (pattern[layer] === 2) {
      const ln = atLayer(nodes, layer);
      const L = ln.find((n) => n.pillar === "L")!;
      const R = ln.find((n) => n.pillar === "R")!;
      edges.push({ from: L.id, to: R.id, type: "horizontal" });
    }
  }

  // 3.3 Asymmetric bookend
  //
  // The Bahir Tree of Life gives Tiferet (the middle central sephirah) long
  // diagonals reaching across the doubles toward Binah/Hochmah at the top,
  // while Keter (the topmost central sephirah) connects only to its
  // immediate-below doubles. We render bottom-up, so the lower-index
  // central node here is the Tiferet-equivalent (gets the long reach) and
  // the higher-index central node is the Keter-equivalent (short reach).
  const centralLayers: number[] = [];
  for (let layer = 0; layer < NUM_LAYERS; layer++) if (pattern[layer] === 1) centralLayers.push(layer);
  for (let ci = 0; ci < centralLayers.length - 1; ci++) {
    const upper = centralLayers[ci]!;       // lower index → Tiferet-equiv (long reach)
    const lower = centralLayers[ci + 1]!;   // higher index → Keter-equiv (short reach)
    const doubles: number[] = [];
    for (let l = upper + 1; l < lower; l++) doubles.push(l);
    if (doubles.length === 0) continue;
    const upperC = atLayer(nodes, upper)[0]!;
    const lowerC = atLayer(nodes, lower)[0]!;
    // Tiferet-equiv reaches every double layer in the gap (the long crossing diagonals).
    for (const dl of doubles) for (const n of atLayer(nodes, dl)) edges.push({ from: upperC.id, to: n.id, type: "bookend-upper" });
    // Keter-equiv only touches the double layer immediately adjacent to it.
    const nearest = atLayer(nodes, doubles[doubles.length - 1]!);
    for (const n of nearest) edges.push({ from: lowerC.id, to: n.id, type: "bookend-lower" });
  }

  // 3.4 Adjacent-double cross
  for (let layer = 0; layer < NUM_LAYERS - 1; layer++) {
    if (pattern[layer] === 2 && pattern[layer + 1] === 2) {
      const u = atLayer(nodes, layer);
      const l = atLayer(nodes, layer + 1);
      const UL = u.find((n) => n.pillar === "L")!;
      const UR = u.find((n) => n.pillar === "R")!;
      const LL = l.find((n) => n.pillar === "L")!;
      const LR = l.find((n) => n.pillar === "R")!;
      edges.push({ from: UL.id, to: LR.id, type: "cross" });
      edges.push({ from: UR.id, to: LL.id, type: "cross" });
    }
  }

  return edges;
}

export function buildMapGraph(seed: number, opts: PatternOptions = {}): MapGraph {
  const rng = mulberry32(seed);
  const pattern = generateLayerPattern(rng, opts);
  const nodes = generateNodes(pattern);
  const edges = generateEdges(nodes, pattern);
  return { pattern, nodes, edges };
}

export function neighborsOf(edges: MapEdge[], nodeId: string): Set<string> {
  const set = new Set<string>();
  for (const e of edges) {
    if (e.from === nodeId) set.add(e.to);
    else if (e.to === nodeId) set.add(e.from);
  }
  return set;
}

/** Eligible-next nodes: every node 1 edge away from `currentNodeId` that the
 *  player hasn't already visited and that isn't behind them in the topology.
 *  Includes same-layer (horizontal) neighbors and forward-layer neighbors;
 *  excludes backward-layer neighbors. Pass `visitedNodeIds` to prevent
 *  sideways oscillation back through previously-visited nodes. */
export function eligibleNext(
  graph: MapGraph,
  currentNodeId: string,
  visitedNodeIds: ReadonlyArray<string> = [],
): string[] {
  const cur = graph.nodes.find((n) => n.id === currentNodeId);
  if (!cur) return [];
  const visited = new Set(visitedNodeIds);
  const neighbors = neighborsOf(graph.edges, currentNodeId);
  const out: string[] = [];
  for (const n of graph.nodes) {
    if (!neighbors.has(n.id)) continue;
    if (visited.has(n.id)) continue;
    if (n.layer < cur.layer) continue; // never look back
    out.push(n.id);
  }
  return out;
}

export interface PositionedNode extends MapNode {
  x: number; // viewBox units
  y: number;
}

export interface LayoutOptions {
  width?: number; // viewBox width
  height?: number;
  layerSpacing?: number;
  pillarSpacing?: number;
}

/** Layout coords for a 1000-unit wide viewBox by default (chart-anchor or full map share scale rules). */
export function layoutNodes(nodes: MapNode[], opts: LayoutOptions = {}): PositionedNode[] {
  const layerSpacing = opts.layerSpacing ?? 130;
  const pillarSpacing = opts.pillarSpacing ?? 130;
  return nodes.map((n) => ({
    ...n,
    x: n.pillar === "C" ? 0 : n.pillar === "L" ? -pillarSpacing : pillarSpacing,
    y: n.layer * layerSpacing,
  }));
}
