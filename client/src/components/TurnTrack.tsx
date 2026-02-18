interface TurnTrackProps {
  total: number;
  current: number;
}

export function TurnTrack({ total, current }: TurnTrackProps) {
  return (
    <div className="turn-track">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={`turn-${index}`}
          className={`turn-dot ${index < current ? "filled" : ""} ${index === current ? "active" : ""}`}
        />
      ))}
    </div>
  );
}
