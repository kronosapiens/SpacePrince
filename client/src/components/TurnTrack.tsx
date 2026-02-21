import type { PlanetName } from "../game/types";

interface TurnTrackProps {
  total: number;
  current: number;
  opponentPlanet?: PlanetName;
  disabled?: boolean;
}

export function TurnTrack({ total, current, opponentPlanet, disabled }: TurnTrackProps) {
  const actionText = disabled
    ? "Passage sealed"
    : opponentPlanet
      ? `Answer ${opponentPlanet}`
      : "Choose your answer";

  return (
    <div className="turn-track-wrap">
      <div className="turn-track">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={`turn-${index}`}
            className={`turn-dot ${index < current ? "filled" : ""} ${index === current ? "active" : ""}`}
          />
        ))}
      </div>
      <div className="turn-action">{actionText}</div>
    </div>
  );
}
