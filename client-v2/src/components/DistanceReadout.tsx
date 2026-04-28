export function DistanceReadout({ value }: { value: number }) {
  return (
    <div className="distance-readout">
      Distance · {Math.round(value)}
    </div>
  );
}
