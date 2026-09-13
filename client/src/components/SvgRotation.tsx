/** Slow chart rotation, omitted under reduced motion. */
export function SvgRotation({ cx = 0, cy = 0, degrees = -360 }: {
  cx?: number;
  cy?: number;
  degrees?: number;
}) {
  if (typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  return (
    <animateTransform attributeName="transform" attributeType="XML" type="rotate"
      from={`0 ${cx} ${cy}`} to={`${degrees} ${cx} ${cy}`}
      dur="120s" repeatCount="indefinite" />
  );
}
