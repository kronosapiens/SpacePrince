import { useId } from "react";
import { PLANET_PRIMARY, PLANET_SECONDARY } from "@/svg/palette";
import { PLANET_GLYPH } from "@/svg/glyphs";
import { KANDINSKY_STYLE } from "@/svg/kandinsky-style";
import type { PlanetName } from "@/game/types";

interface KandinskyCompositionProps {
  planet: PlanetName;
  size?: number;
}

function polarPoint(radius: number, degrees: number): [number, number] {
  const angle = (degrees * Math.PI) / 180;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

function shortArc(radius: number, start: number, end: number) {
  return `M ${polarPoint(radius, start)} A ${radius},${radius} 0 0 1 ${polarPoint(radius, end)}`;
}

/** Geometric tension piece (af Klint / Kandinsky), in each planet's family. */
export function KandinskyComposition({ planet, size = 540 }: KandinskyCompositionProps) {
  const c = PLANET_PRIMARY[planet];
  const sec = PLANET_SECONDARY[planet];
  const glyph = PLANET_GLYPH[planet];
  const VB = 540;
  const cx = VB / 2;
  const cy = VB / 2;
  // Place the details halfway between the rings, independently of their size.
  const accentRadius = (KANDINSKY_STYLE.planetRadius + KANDINSKY_STYLE.innerOrbitRadius)
    / (2 * KANDINSKY_STYLE.accentScale);
  const gid = useId();
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
      <circle cx={cx} cy={cy} r={KANDINSKY_STYLE.outerOrbitRadius} fill="none" stroke={c} strokeOpacity="0.4" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={KANDINSKY_STYLE.innerOrbitRadius} fill="none" stroke={sec} strokeOpacity="0.6" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={KANDINSKY_STYLE.planetRadius} fill={c} fillOpacity="0.18" stroke={c} strokeOpacity="0.9" strokeWidth={1.5} />
      {/* Small planet details stay between the glyph disc and the inner ring. */}
      <g transform={`translate(${cx} ${cy}) scale(${KANDINSKY_STYLE.accentScale})`}
        fill="none" stroke={c} opacity={KANDINSKY_STYLE.accentOpacity} strokeWidth={1}>
        {planet === "Moon" && <>
          <path d={shortArc(accentRadius - 7, 115, 245)} />
          <path d={shortArc(accentRadius + 7, 115, 245)} />
        </>}
        {planet === "Mercury" && [-45, 135].map((angle, i) => {
          const [x, y] = polarPoint(accentRadius + 6.5, angle);
          const [x1, y1] = polarPoint(accentRadius - 12.5, angle);
          const [x2, y2] = polarPoint(accentRadius - 3.5, angle);
          return <g key={angle}>
            <circle cx={x} cy={y} r={i === 0 ? 6 : 3} fill={i === 0 ? "none" : c} />
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
          </g>;
        })}
        {planet === "Venus" && <>
          <path d={shortArc(accentRadius, -35, 35)} />
          <path d={shortArc(accentRadius, 145, 215)} />
        </>}
        {planet === "Sun" && Array.from({ length: 8 }, (_, i) => {
          const [x1, y1] = polarPoint(accentRadius - 7, i * 45);
          const [x2, y2] = polarPoint(accentRadius + 7, i * 45);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        {planet === "Mars" && Array.from({ length: 3 }, (_, i) => {
          const angle = i * 120 - 45;
          const halfWidth = 24 / Math.sqrt(3); // The triangle's 60-degree corners.
          return <polyline key={i} transform={`rotate(${angle})`}
            points={`${accentRadius - 12},${-halfWidth} ${accentRadius + 12},0 ${accentRadius - 12},${halfWidth}`} />;
        })}
        {planet === "Jupiter" && <>
          <path d={shortArc(accentRadius, 200, 340)} />
          <path d={shortArc(accentRadius, 55, 125)} />
        </>}
        {planet === "Saturn" && Array.from({ length: 8 }, (_, i) => {
          const arm = 25;
          const depth = arm * Math.sin(Math.PI / 8);
          const halfWidth = arm * Math.cos(Math.PI / 8);
          // Center the radial extent of each 135-degree octagon corner.
          const tip = (4 * accentRadius ** 2 - arm ** 2) / (4 * accentRadius - 2 * depth);
          return <polyline key={i} transform={`rotate(${i * 45 + 22.5})`}
            points={`${tip - depth},${-halfWidth} ${tip},0 ${tip - depth},${halfWidth}`} />;
        })}
      </g>
      {/* Centerpiece glyph */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontSize={96} fill={c}
        fontFamily="'Cormorant Garamond', 'Noto Sans Symbols 2', 'Apple Symbols', serif" fontWeight={500}>
        {glyph}
      </text>
      {/* Orbiting dots */}
      <g className="kandinsky-orbit kandinsky-orbit-inner" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {[30, 150, 270].map((deg) => {
          const angle = (deg * Math.PI) / 180;
          return <circle key={deg}
            cx={cx + KANDINSKY_STYLE.innerOrbitRadius * Math.cos(angle)} cy={cy + KANDINSKY_STYLE.innerOrbitRadius * Math.sin(angle)}
            r={2.5} fill={sec} fillOpacity={0.45} />;
        })}
      </g>
      <g className="kandinsky-orbit" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {[0, 72, 144, 216, 288].map((deg, i) => {
          const r = KANDINSKY_STYLE.outerOrbitRadius;
          const a = (deg * Math.PI) / 180;
          return (
            <circle key={i}
              cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)}
              r={i === 0 ? 6 : 3} fill={c} fillOpacity={i === 0 ? 1 : 0.55} />
          );
        })}
      </g>
    </svg>
  );
}
