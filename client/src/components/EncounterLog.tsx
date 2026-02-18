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
          <div className="tag">Latest 12</div>
        </div>
        <div className="panel-body">
          {run?.log.length ? (
            <div className="log">
              {run.log.map((entry) => (
                <div key={entry.id} className="log-entry">
                  <div className="log-head">
                    <span>Turn {entry.turnIndex}</span>
                    <span>
                      {entry.playerPlanet} vs {entry.opponentPlanet}
                    </span>
                  </div>
                  <div className="log-body">
                    <p>
                      {entry.polarity} | Player {entry.playerCrit ? "CRIT" : ""} {entry.playerDelta}
                      {entry.polarity === "Testimony" ? " healed" : " affliction"} | Opponent{" "}
                      {entry.opponentCrit ? "CRIT" : ""} {entry.opponentDelta}
                      {entry.polarity === "Testimony" ? " healed" : " affliction"}
                    </p>
                    {entry.playerCombust && <p className="warn">Player combusts</p>}
                    {entry.opponentCombust && <p className="warn">Opponent combusts</p>}
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
