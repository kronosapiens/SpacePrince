import type { RunState } from "../game/types";

interface EncounterLogProps {
  run: RunState | null;
}

export function EncounterLog({ run }: EncounterLogProps) {
  const fmt = (value: number | undefined) => {
    if (value === undefined || Number.isNaN(value)) return "0";
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  };
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
                    <span>Distance +{entry.turnScore}</span>
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
                        const playerLegacySectMultiplier = entry.directBreakdown.playerSectMultiplier ?? 1;
                        const opponentLegacySectMultiplier = entry.directBreakdown.opponentSectMultiplier ?? 1;
                        const playerSectPart =
                          entry.directBreakdown.playerSectBonus !== undefined
                            ? `${fmt(entry.directBreakdown.playerBase)}+${fmt(playerSectBonus)}`
                            : `${fmt(entry.directBreakdown.playerBase)}x${fmt(playerLegacySectMultiplier)}`;
                        const opponentSectPart =
                          entry.directBreakdown.opponentSectBonus !== undefined
                            ? `${fmt(entry.directBreakdown.opponentBase)}+${fmt(opponentSectBonus)}`
                            : `${fmt(entry.directBreakdown.opponentBase)}x${fmt(opponentLegacySectMultiplier)}`;
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
