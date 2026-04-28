import { NEUTRAL } from "@/svg/palette";

interface SpiralProps {
  size?: number;
  color?: string;
  turns?: number;
  opacity?: number;
}

/** Ceremonial spiral overlay used behind the Title chart. Rare visual primitive
 *  per STYLE.md §2 — reserved, max one per screen. */
export function Spiral({
  size = 820,
  color = NEUTRAL.goldHi,
  turns = 2.6,
  opacity = 0.16,
}: SpiralProps) {
  const cx = size / 2;
  const cy = size / 2;
  const N = 360;
  const maxR = size * 0.42;
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const r = t * maxR;
    const a = t * Math.PI * 2 * turns + Math.PI;
    points.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
    .join(" ");
  return (
    <svg
      width={size}
      height={size}
      style={{ position: "absolute", inset: 0, margin: "auto", pointerEvents: "none" }}
      aria-hidden
    >
      <path d={d} stroke={color} strokeOpacity={opacity} strokeWidth={0.8} fill="none" strokeLinecap="round" />
    </svg>
  );
}
