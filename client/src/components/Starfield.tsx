import { useId } from "react";
import { mulberry32 } from "@/game/rng";

const TILE_SIZE = 960;
const random = mulberry32(0x53544152);
// A fixed seed keeps the sky steady across screen changes and reloads.
const STARS = Array.from({ length: 170 }, () => ({
  cx: random() * TILE_SIZE,
  cy: random() * TILE_SIZE,
  r: 0.45 + random() ** 3 * 0.75,
  fillOpacity: 0.3 + random() * 0.5,
})).map((star, i) => ({
  ...star,
  // Most stars stay still; negative delays start the others mid-fade.
  style: i % 6 === 0 ? {
    animationDuration: `${14 + random() * 8}s`,
    animationDelay: `${-random() * 22}s`,
  } : undefined,
}));

export function Starfield() {
  const patternId = useId();
  return (
    <svg className="starfield" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={patternId} width={TILE_SIZE} height={TILE_SIZE} patternUnits="userSpaceOnUse">
          {STARS.map((star, i) => (
            <circle key={i} {...star} className={star.style ? "anim-star-twinkle" : undefined} />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
