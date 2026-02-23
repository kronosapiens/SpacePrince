import type { RunState } from "../game/types";
import { formatDisplay, roundDisplay } from "../lib/format";

interface EncounterLogProps {
  run: RunState | null;
}

export function EncounterLog({ run }: EncounterLogProps) {
  const fmt = (value: number | undefined) => formatDisplay(value ?? 0);
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
                    <span>Distance +{roundDisplay(entry.turnScore)}</span>
                  </div>
                  <div className="log-body">
                    <p>
                      {entry.polarity} | Self {entry.opponentCrit ? "CRIT " : ""}
                      {entry.playerDelta} · Other {entry.playerCrit ? "CRIT " : ""}
                      {entry.opponentDelta}
                    </p>
                    <p className="log-formula">
                      {(() => {
                        const playerSectBonus = entry.directBreakdown.playerSectBonus ?? 0;
                        const opponentSectBonus = entry.directBreakdown.opponentSectBonus ?? 0;
                        const playerSectPart = `${fmt(entry.directBreakdown.playerBase)}+${fmt(playerSectBonus)}`;
                        const opponentSectPart = `${fmt(entry.directBreakdown.opponentBase)}+${fmt(opponentSectBonus)}`;
                        return (
                          <>
                            You: {playerSectPart} x {fmt(entry.directBreakdown.friction)} x{" "}
                            {fmt(entry.directBreakdown.playerCritMultiplier)} ={" "}
                            {fmt(entry.directBreakdown.playerResult)} | Foe: {opponentSectPart} x{" "}
                            {fmt(entry.directBreakdown.friction)} x {fmt(entry.directBreakdown.opponentCritMultiplier)}{" "}
                            = {fmt(entry.directBreakdown.opponentResult)}
                          </>
                        );
                      })()}
                    </p>
                    {entry.playerCombust && <p className="warn">{entry.playerPlanet} combusts</p>}
                    {entry.opponentCombust && <p className="warn">{entry.opponentPlanet} combusts</p>}
                    {entry.propagation.length > 0 && (
                      <div className="propagation">
                        {entry.propagation.map((prop, index) => (
                          <span key={`${entry.id}_${index}`}>
                            {prop.side === "self" ? "Self " : "Other "}
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
