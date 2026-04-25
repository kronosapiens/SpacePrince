import type { LayerCount, LayerPattern } from "../game/map";

interface Props {
  probabilities: number[];
  forced: (LayerCount | null)[];
  pattern: LayerPattern;
  nodeCount: number;
  edgeCount: number;
  seed: number;
  onProbabilityChange: (idx: number, value: number) => void;
  onForceChange: (idx: number, value: LayerCount | null) => void;
  onReseed: () => void;
  onResetTraversal: () => void;
}

export function MapControls({
  probabilities,
  forced,
  pattern,
  nodeCount,
  edgeCount,
  seed,
  onProbabilityChange,
  onForceChange,
  onReseed,
  onResetTraversal,
}: Props) {
  const doubleCount = pattern.filter((n) => n === 2).length;
  let warning: string | null = null;
  if (doubleCount === 0) warning = "all singles — tree degenerates to a column";
  else if (doubleCount === 1) warning = "single double — below ≥2 constraint";

  return (
    <aside className="map-sidebar">
      <div className="map-title">Sephirot</div>
      <div className="map-subtitle">topology playground</div>

      <div className="map-section">
        <button className="map-primary" onClick={onReseed}>
          Generate New Tree
        </button>
        <button className="map-secondary" onClick={onResetTraversal}>
          Reset Traversal
        </button>
      </div>

      <hr className="map-hr" />

      <div className="map-section">
        <h3 className="map-h3">Double Probability · L2–L6</h3>
        {probabilities.map((p, i) => {
          const step = Math.round(p * 10);
          return (
            <div className="map-slider-row" key={`p${i}`}>
              <label>L{i + 2}</label>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={step}
                onChange={(e) =>
                  onProbabilityChange(i, parseInt(e.target.value, 10) / 10)
                }
              />
              <span className="map-slider-value">{step}/10</span>
            </div>
          );
        })}
      </div>

      <div className="map-section">
        <h3 className="map-h3">Force Layer · override</h3>
        {forced.map((cur, i) => (
          <div className="map-force-row" key={`f${i}`}>
            <label>L{i + 2}</label>
            <button
              className={`map-toggle${cur === null ? " active" : ""}`}
              onClick={() => onForceChange(i, null)}
            >
              auto
            </button>
            <button
              className={`map-toggle${cur === 1 ? " active" : ""}`}
              onClick={() => onForceChange(i, 1)}
            >
              1
            </button>
            <button
              className={`map-toggle${cur === 2 ? " active" : ""}`}
              onClick={() => onForceChange(i, 2)}
            >
              2
            </button>
          </div>
        ))}
      </div>

      <hr className="map-hr" />

      <div className="map-section">
        <h3 className="map-h3">Readout</h3>
        <div className="map-readout">
          <div>
            <span className="map-k">pattern</span>
            <span className="map-v">[{pattern.join(",")}]</span>
          </div>
          <div>
            <span className="map-k">nodes</span>
            <span className="map-v">{nodeCount}</span>
          </div>
          <div>
            <span className="map-k">edges</span>
            <span className="map-v">{edgeCount}</span>
          </div>
          <div>
            <span className="map-k">seed</span>
            <span className="map-v">{seed}</span>
          </div>
          {warning && <div className="map-warning">⚠ {warning}</div>}
        </div>
      </div>

      <div className="map-section">
        <h3 className="map-h3">Edge Types</h3>
        <div className="map-legend">
          <div className="map-legend-item">
            <span className="map-legend-swatch swatch-pillar" />
            pillar spine
          </div>
          <div className="map-legend-item">
            <span className="map-legend-swatch swatch-horizontal" />
            horizontal pair
          </div>
          <div className="map-legend-item">
            <span className="map-legend-swatch swatch-bookend-upper" />
            bookend · upper (descent)
          </div>
          <div className="map-legend-item">
            <span className="map-legend-swatch swatch-bookend-lower" />
            bookend · lower (ascent)
          </div>
          <div className="map-legend-item">
            <span className="map-legend-swatch swatch-cross" />
            adjacent-double cross
          </div>
        </div>
      </div>
    </aside>
  );
}
