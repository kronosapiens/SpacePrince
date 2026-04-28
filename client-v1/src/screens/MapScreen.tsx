import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapView } from "../components/MapView";
import {
  ROOT_NODE_ID,
  buildMapGraph,
  layoutNodes,
  neighborsOf,
} from "../game/map";
import { randomSeed } from "../game/rng";

export default function MapScreen() {
  const [seed, setSeed] = useState<number>(() => randomSeed());
  const [currentId, setCurrentId] = useState<string>(ROOT_NODE_ID);
  const [visited, setVisited] = useState<Set<string>>(
    () => new Set([ROOT_NODE_ID])
  );

  const graph = useMemo(() => buildMapGraph(seed), [seed]);
  const positioned = useMemo(() => layoutNodes(graph.nodes), [graph.nodes]);
  const eligible = useMemo(
    () => neighborsOf(graph.edges, currentId),
    [graph.edges, currentId]
  );

  const handleNewTree = () => {
    setSeed(randomSeed());
    setCurrentId(ROOT_NODE_ID);
    setVisited(new Set([ROOT_NODE_ID]));
  };

  const handleResetTraversal = () => {
    setCurrentId(ROOT_NODE_ID);
    setVisited(new Set([ROOT_NODE_ID]));
  };

  const handleNodeClick = (id: string) => {
    if (id === currentId) return;
    if (!eligible.has(id)) return;
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(currentId);
      next.add(id);
      return next;
    });
    setCurrentId(id);
  };

  return (
    <div className="map-page">
      <header className="map-page-header">
        <Link to="/" className="map-back">
          ← Index
        </Link>
        <div className="map-header-actions">
          <button className="map-header-btn" onClick={handleResetTraversal}>
            Reset
          </button>
          <button className="map-header-btn" onClick={handleNewTree}>
            New Tree
          </button>
        </div>
      </header>
      <main className="map-canvas">
        <MapView
          nodes={positioned}
          edges={graph.edges}
          currentId={currentId}
          visited={visited}
          eligible={eligible}
          onNodeClick={handleNodeClick}
        />
      </main>
    </div>
  );
}
