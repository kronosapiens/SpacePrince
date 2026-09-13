/** Two interlaced hexagrams: four equilateral triangles form a twelve-point star. */
export function hexagramPoints(cx: number, cy: number, r: number): string[] {
  return [0, 30, 60, 90].map((base) =>
    [0, 120, 240].map((step) => {
      const rad = ((base + step) * Math.PI) / 180;
      return `${cx + r * Math.cos(rad)},${cy - r * Math.sin(rad)}`;
    }).join(" "),
  );
}
