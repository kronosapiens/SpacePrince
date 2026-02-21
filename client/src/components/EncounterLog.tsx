import type { RunState } from "../game/types";

interface EncounterLogProps {
  run: RunState | null;
}

export function EncounterLog({ run }: EncounterLogProps) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="panel-header">
          <h2>Encounter Log</h2>
        </div>
        <div className="panel-body">
          {run?.log.length ? (
            <div className="log">
              {run.log.map((entry) => (
                <div key={entry.id} className="log-entry">
                  <div className="log-head">
                    <span>Turn {entry.turnIndex}</span>
                    <span className="log-sep">|</span>
                    <span>
                      {entry.playerPlanet} vs {entry.opponentPlanet}
                    </span>
                    <span className="log-sep">|</span>
                    <span>Fortune +{entry.turnScore}</span>
                  </div>
                  <div className="log-body">
                    <p>
                      {entry.polarity} | Self {entry.playerCrit ? "CRIT " : ""}
                      {entry.playerDelta} · Other {entry.opponentCrit ? "CRIT " : ""}
                      {entry.opponentDelta}
                    </p>
                    {entry.playerCombust && <p className="warn">{entry.playerPlanet} combusts</p>}
                    {entry.opponentCombust && <p className="warn">{entry.opponentPlanet} combusts</p>}
                    {entry.propagation.length > 0 && (
                      <div className="propagation">
                        {entry.propagation.map((prop, index) => (
                          <span key={`${entry.id}_${index}`}>
                            {prop.target}: {prop.delta >= 0 ? "+" : ""}
                            {prop.delta} ({prop.note})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No turns resolved yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
