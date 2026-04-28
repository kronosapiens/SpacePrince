import { PLANET_PRIMARY, PLANET_SECONDARY } from "@/svg/palette";
import { PLANET_GLYPH } from "@/svg/glyphs";
import type { PlanetName } from "@/game/types";

interface KandinskyCompositionProps {
  planet: PlanetName;
  size?: number;
}

/** Geometric tension piece (af Klint / Kandinsky). Concentric circles,
 *  triangle (trine), hex, glyph, orbiting dots — all in the planet's family. */
export function KandinskyComposition({ planet, size = 540 }: KandinskyCompositionProps) {
  const c = PLANET_PRIMARY[planet];
  const sec = PLANET_SECONDARY[planet];
  const glyph = PLANET_GLYPH[planet];
  const VB = 540;
  const cx = VB / 2;
  const cy = VB / 2;
  const gid = `kandinsky-bg-${planet}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      style={{ display: "block" }}
      aria-hidden
    >
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c} stopOpacity="0.32" />
          <stop offset="70%" stopColor={sec} stopOpacity="0.08" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Background bloom */}
      <circle cx={cx} cy={cy} r={240} fill={`url(#${gid})`} />
      {/* Concentric circles */}
      <circle cx={cx} cy={cy} r={200} fill="none" stroke={c} strokeOpacity="0.4" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={150} fill="none" stroke={sec} strokeOpacity="0.6" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={92} fill={c} fillOpacity="0.18" stroke={c} strokeOpacity="0.9" strokeWidth={1.5} />
      {/* Triangle (trine) */}
      <polygon points={`${cx},130 ${cx + 122},332 ${cx - 122},332`}
        fill="none" stroke={c} strokeOpacity="0.55" strokeWidth={1} />
      {/* Outer hex */}
      <polygon points={Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        return `${cx + 220 * Math.cos(a)},${cy + 220 * Math.sin(a)}`;
      }).join(" ")} fill="none" stroke={c} strokeOpacity="0.18" strokeWidth={0.5} />
      {/* Centerpiece glyph */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontSize={120} fill={c}
        fontFamily="'Cormorant Garamond', 'Noto Sans Symbols 2', 'Apple Symbols', serif" fontWeight={500}>
        {glyph}
      </text>
      {/* Orbiting dots */}
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const r = 200;
        const a = (deg * Math.PI) / 180;
        return (
          <circle key={i}
            cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)}
            r={i === 0 ? 6 : 3} fill={c} fillOpacity={i === 0 ? 1 : 0.55} />
        );
      })}
    </svg>
  );
}
