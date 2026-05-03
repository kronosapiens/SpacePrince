import { ASPECT_BASE, PLANETS, SIGNS } from "./data";
import type { AspectConnection, AspectType, Chart, SignName } from "./types";

export function getAspectType(a: SignName, b: SignName): AspectType {
  const ia = SIGNS.indexOf(a);
  const ib = SIGNS.indexOf(b);
  const delta = (ib - ia + 12) % 12;
  const distance = Math.min(delta, 12 - delta);
  switch (distance) {
    case 0: return "Conjunction";
    case 2: return "Sextile";
    case 3: return "Square";
    case 4: return "Trine";
    case 6: return "Opposition";
    default: return "None";
  }
}

export function getAspects(chart: Chart): AspectConnection[] {
  const out: AspectConnection[] = [];
  for (let i = 0; i < PLANETS.length; i++) {
    for (let j = i + 1; j < PLANETS.length; j++) {
      const a = PLANETS[i]!;
      const b = PLANETS[j]!;
      const aspect = getAspectType(chart.planets[a].sign, chart.planets[b].sign);
      if (aspect === "None") continue;
      const multiplier = ASPECT_BASE[aspect];
      out.push({ from: a, to: b, aspect, multiplier });
      out.push({ from: b, to: a, aspect, multiplier });
    }
  }
  return out;
}
