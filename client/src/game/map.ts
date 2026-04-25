import { mulberry32 } from "./rng";

export type Pillar = "L" | "C" | "R";
export type LayerCount = 1 | 2;
export type LayerPattern = LayerCount[];
export type EdgeType =
  | "pillar"
  | "horizontal"
  | "bookend-upper"
  | "bookend-lower"
  | "cross";

export interface MapNode {
  id: string;
  layer: number;
  pillar: Pillar;
}

export interface PositionedMapNode extends MapNode {
  x: number;
  y: number;
}

export interface MapEdge {
  from: string;
  to: string;
  type: EdgeType;
}

export interface MapGraph {
  pattern: LayerPattern;
  nodes: MapNode[];
  edges: MapEdge[];
}

export const NUM_LAYERS = 7;
export const ROOT_NODE_ID = "1C";

export interface PatternOptions {
  probabilities?: number[];
  forced?: (LayerCount | null)[];
}

export function generateLayerPattern(
  rng: () => number,
  opts: PatternOptions = {}
): LayerPattern {
  const probabilities = opts.probabilities ?? [0.5, 0.5, 0.5, 0.5, 0.5];
  const forced = opts.forced ?? [null, null, null, null, null];
  const pattern: LayerCount[] = [1];
  for (let i = 0; i < 5; i++) {
    const force = forced[i];
    if (force !== null && force !== undefined) {
      pattern.push(force);
    } else {
      pattern.push(rng() < probabilities[i] ? 2 : 1);
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

function nodesAtLayer(nodes: MapNode[], layer: number): MapNode[] {
  return nodes.filter((n) => n.layer === layer);
}

function nodesInPillar(nodes: MapNode[], pillar: Pillar): MapNode[] {
  return nodes.filter((n) => n.pillar === pillar);
}

export function generateEdges(
  nodes: MapNode[],
  pattern: LayerPattern
): MapEdge[] {
  const edges: MapEdge[] = [];

  // Pillar spines
  for (const pillar of ["C", "L", "R"] as Pillar[]) {
    const pillarNodes = nodesInPillar(nodes, pillar).sort(
      (a, b) => a.layer - b.layer
    );
    for (let i = 0; i < pillarNodes.length - 1; i++) {
      edges.push({
        from: pillarNodes[i].id,
        to: pillarNodes[i + 1].id,
        type: "pillar",
      });
    }
  }

  // Horizontal pair in every double layer
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    if (pattern[layer] === 2) {
      const layerNodes = nodesAtLayer(nodes, layer);
      const L = layerNodes.find((n) => n.pillar === "L")!;
      const R = layerNodes.find((n) => n.pillar === "R")!;
      edges.push({ from: L.id, to: R.id, type: "horizontal" });
    }
  }

  // Asymmetric bookend between consecutive centrals
  const centralLayers: number[] = [];
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    if (pattern[layer] === 1) centralLayers.push(layer);
  }

  for (let ci = 0; ci < centralLayers.length - 1; ci++) {
    const upperLayer = centralLayers[ci];
    const lowerLayer = centralLayers[ci + 1];
    const doubleLayers: number[] = [];
    for (let l = upperLayer + 1; l < lowerLayer; l++) doubleLayers.push(l);
    if (doubleLayers.length === 0) continue;

    const upperCentral = nodesAtLayer(nodes, upperLayer)[0];
    const lowerCentral = nodesAtLayer(nodes, lowerLayer)[0];

    // Upper → only the immediately adjacent double layer below
    const immediate = nodesAtLayer(nodes, doubleLayers[0]);
    for (const n of immediate) {
      edges.push({ from: upperCentral.id, to: n.id, type: "bookend-upper" });
    }

    // Lower → every double layer above in the stretch
    for (const dl of doubleLayers) {
      for (const n of nodesAtLayer(nodes, dl)) {
        edges.push({ from: lowerCentral.id, to: n.id, type: "bookend-lower" });
      }
    }
  }

  // Adjacent-double cross
  for (let layer = 0; layer < NUM_LAYERS - 1; layer++) {
    if (pattern[layer] === 2 && pattern[layer + 1] === 2) {
      const upper = nodesAtLayer(nodes, layer);
      const lower = nodesAtLayer(nodes, layer + 1);
      const UL = upper.find((n) => n.pillar === "L")!;
      const UR = upper.find((n) => n.pillar === "R")!;
      const LL = lower.find((n) => n.pillar === "L")!;
      const LR = lower.find((n) => n.pillar === "R")!;
      edges.push({ from: UL.id, to: LR.id, type: "cross" });
      edges.push({ from: UR.id, to: LL.id, type: "cross" });
    }
  }

  return edges;
}

export interface LayoutOptions {
  layerSpacing?: number;
  pillarSpacing?: number;
  topMargin?: number;
}

export function layoutNodes(
  nodes: MapNode[],
  opts: LayoutOptions = {}
): PositionedMapNode[] {
  const layerSpacing = opts.layerSpacing ?? 105;
  const pillarSpacing = opts.pillarSpacing ?? 105;
  const topMargin = opts.topMargin ?? 20;
  return nodes.map((n) => ({
    ...n,
    x: n.pillar === "C" ? 0 : n.pillar === "L" ? -pillarSpacing : pillarSpacing,
    y: topMargin + n.layer * layerSpacing,
  }));
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
