import { describe, expect, it } from "vitest";
import { buildMapGraph, generateEdges, generateNodes } from "@/game/map-gen";
import type { LayerCount } from "@/game/types";

describe("Sephirot topology", () => {
  it("canonical [1,2,2,1,2,1,1] yields 22 edges", () => {
    const pattern: LayerCount[] = [1, 2, 2, 1, 2, 1, 1];
    const nodes = generateNodes(pattern);
    const edges = generateEdges(nodes, pattern);
    expect(edges).toHaveLength(22);
    expect(nodes).toHaveLength(10); // 1+2+2+1+2+1+1
  });

  it("all-singles [1,1,1,1,1,1,1] yields 6 spine edges, 7 nodes", () => {
    const pattern: LayerCount[] = [1, 1, 1, 1, 1, 1, 1];
    const nodes = generateNodes(pattern);
    const edges = generateEdges(nodes, pattern);
    expect(nodes).toHaveLength(7);
    // Center pillar spine only: 6 edges between consecutive centrals.
    expect(edges).toHaveLength(6);
  });

  it("L1 and L7 are always single per the grammar", () => {
    for (let seed = 0; seed < 64; seed++) {
      const g = buildMapGraph(seed);
      expect(g.pattern[0]).toBe(1);
      expect(g.pattern[6]).toBe(1);
    }
  });

  it("connected graph: every node reachable from L1", () => {
    for (let seed = 0; seed < 32; seed++) {
      const g = buildMapGraph(seed);
      const adj = new Map<string, Set<string>>();
      for (const n of g.nodes) adj.set(n.id, new Set());
      for (const e of g.edges) {
        adj.get(e.from)!.add(e.to);
        adj.get(e.to)!.add(e.from);
      }
      const visited = new Set<string>();
      const queue: string[] = [g.nodes[0]!.id];
      while (queue.length) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        for (const nb of adj.get(id) ?? []) queue.push(nb);
      }
      expect(visited.size).toBe(g.nodes.length);
    }
  });

  it("node count stays in [7, 12]", () => {
    for (let seed = 0; seed < 64; seed++) {
      const g = buildMapGraph(seed);
      expect(g.nodes.length).toBeGreaterThanOrEqual(7);
      expect(g.nodes.length).toBeLessThanOrEqual(12);
    }
  });
});
