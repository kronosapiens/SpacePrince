export function TurnDots({ total, current }: { total: number; current: number }) {
  if (total <= 0) return null;
  return (
    <div className="turn-dots" aria-label={`Turn ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const cls = i < current ? "is-passed" : i === current ? "is-current" : "";
        return <div key={i} className={`turn-dot ${cls}`} />;
      })}
    </div>
  );
}
