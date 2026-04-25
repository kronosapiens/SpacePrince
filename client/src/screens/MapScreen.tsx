import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapView } from "../components/MapView";
import { MapControls } from "../components/MapControls";
import {
  ROOT_NODE_ID,
  buildMapGraph,
  layoutNodes,
  neighborsOf,
  type LayerCount,
} from "../game/map";
import { randomSeed } from "../game/rng";

export default function MapScreen() {
  const [seed, setSeed] = useState<number>(() => randomSeed());
  const [probabilities, setProbabilities] = useState<number[]>([
    0.5, 0.5, 0.5, 0.5, 0.5,
  ]);
  const [forced, setForced] = useState<(LayerCount | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);

  const [currentId, setCurrentId] = useState<string>(ROOT_NODE_ID);
  const [visited, setVisited] = useState<Set<string>>(
    () => new Set([ROOT_NODE_ID])
  );

  const graph = useMemo(
    () => buildMapGraph(seed, { probabilities, forced }),
    [seed, probabilities, forced]
  );
  const positioned = useMemo(() => layoutNodes(graph.nodes), [graph.nodes]);
  const eligible = useMemo(
    () => neighborsOf(graph.edges, currentId),
    [graph.edges, currentId]
  );

  const handleProbabilityChange = (idx: number, value: number) => {
    setProbabilities((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleForceChange = (idx: number, value: LayerCount | null) => {
    setForced((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleReseed = () => {
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

  // If the current node disappears under a regenerated tree, snap back to root.
  const positionedIds = useMemo(
    () => new Set(positioned.map((n) => n.id)),
    [positioned]
  );
  if (!positionedIds.has(currentId)) {
    queueMicrotask(() => {
      setCurrentId(ROOT_NODE_ID);
      setVisited(new Set([ROOT_NODE_ID]));
    });
  }

  return (
    <div className="map-page">
      <header className="map-page-header">
        <Link to="/" className="map-back">
          ← Index
        </Link>
      </header>
      <div className="map-layout">
        <MapControls
          probabilities={probabilities}
          forced={forced}
          pattern={graph.pattern}
          nodeCount={graph.nodes.length}
          edgeCount={graph.edges.length}
          seed={seed}
          onProbabilityChange={handleProbabilityChange}
          onForceChange={handleForceChange}
          onReseed={handleReseed}
          onResetTraversal={handleResetTraversal}
        />
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
    </div>
  );
}
