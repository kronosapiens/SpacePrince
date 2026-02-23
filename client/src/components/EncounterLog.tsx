import type { RunState } from "../game/types";
import { formatDisplay, roundDisplay } from "../lib/format";

interface EncounterLogProps {
  run: RunState | null;
}

export function EncounterLog({ run }: EncounterLogProps) {
  const fmt = (value: number | undefined) => formatDisplay(value ?? 0);
  const fmtSigned = (value: number) => `${value > 0 ? "+" : ""}${fmt(value)}`;
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
                    <span>{entry.polarity}</span>
                    <span className="log-sep">|</span>
                    <span>Distance +{roundDisplay(entry.turnScore)}</span>
                  </div>
                  <div className="log-body">
                    {(() => {
                      const directSign = entry.polarity === "Testimony" ? -1 : 1;
                      const selfEffects = [
                        `${entry.playerPlanet} ${fmtSigned(entry.playerDelta * directSign)}`,
                        ...entry.propagation
                          .filter((prop) => prop.side === "self")
                          .map((prop) => `${prop.target} ${fmtSigned(prop.delta)}`),
                      ];
                      const otherEffects = [
                        `${entry.opponentPlanet} ${fmtSigned(entry.opponentDelta * directSign)}`,
                        ...entry.propagation
                          .filter((prop) => prop.side === "other")
                          .map((prop) => `${prop.target} ${fmtSigned(prop.delta)}`),
                      ];
                      return (
                        <>
                          <p>Self: {selfEffects.join(", ")}</p>
                          <p>Other: {otherEffects.join(", ")}</p>
                        </>
                      );
                    })()}
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
