import type { ReactNode } from "react";
import type { PlanetName } from "../game/types";

interface TurnTrackProps {
  total: number;
  current: number;
  opponentPlanet?: PlanetName;
  disabled?: boolean;
  actionSlot?: ReactNode;
}

export function TurnTrack({ total, current, opponentPlanet, disabled, actionSlot }: TurnTrackProps) {
  const actionText = disabled
    ? "Encounter complete"
    : opponentPlanet
      ? `Answer ${opponentPlanet}`
      : "Choose your answer";

  return (
    <div className="turn-track-wrap">
      <div className="turn-action-row">
        <div className="turn-action-slot" />
        <div className="turn-action">{actionText}</div>
        <div className="turn-action-slot">{actionSlot}</div>
      </div>
      <div className="turn-track">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={`turn-${index}`}
            className={`turn-dot ${index < current ? "filled" : ""} ${index === current ? "active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
