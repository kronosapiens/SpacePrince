import { PLANETS, SIGNS } from "../game/data";
import type { Chart, PlanetName, SignName } from "../game/types";

export interface ChartPoint {
  planet: PlanetName;
  sign: SignName;
  x: number;
  y: number;
}

export const buildChartPoints = (
  chart: Chart,
  radius = 150,
  spreadStep = 22,
  angleStepDegrees = 12
): ChartPoint[] => {
  const bySign = new Map<SignName, PlanetName[]>();
  PLANETS.forEach((planet) => {
    const sign = chart.planets[planet].sign;
    const list = bySign.get(sign) ?? [];
    list.push(planet);
    bySign.set(sign, list);
  });

  return PLANETS.map((planet) => {
    const sign = chart.planets[planet].sign;
    const index = SIGNS.indexOf(sign);
    const baseAngle = (index * 30 - 90 + 15) * (Math.PI / 180);
    const cluster = bySign.get(sign) ?? [];
    const position = cluster.indexOf(planet);
    const angleOffset =
      cluster.length > 1 ? (position - (cluster.length - 1) / 2) * (angleStepDegrees * (Math.PI / 180)) : 0;
    const spread = cluster.length > 1 ? (position - (cluster.length - 1) / 2) * spreadStep : 0;
    const angle = baseAngle + angleOffset;
    const offset = radius + spread;
    const x = Math.cos(angle) * offset;
    const y = Math.sin(angle) * offset;
    return { planet, sign, x, y };
  });
};

export const buildPointMap = (points: ChartPoint[]) =>
  points.reduce<Record<string, { x: number; y: number }>>((acc, point) => {
    acc[point.planet] = { x: point.x, y: point.y };
    return acc;
  }, {});
