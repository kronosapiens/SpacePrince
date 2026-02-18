import type { PlanetName } from "../game/types";

export const PLANET_COLORS: Record<PlanetName, { fill: string; glow: string }> = {
  Sun: { fill: "#FFD700", glow: "rgba(255, 215, 0, 0.6)" },
  Moon: { fill: "#B0C4DE", glow: "rgba(176, 196, 222, 0.6)" },
  Mercury: { fill: "#7F8F86", glow: "rgba(127, 143, 134, 0.6)" },
  Venus: { fill: "#8FBC8F", glow: "rgba(143, 188, 143, 0.6)" },
  Mars: { fill: "#CD2626", glow: "rgba(205, 38, 38, 0.6)" },
  Jupiter: { fill: "#1B3F8B", glow: "rgba(27, 63, 139, 0.6)" },
  Saturn: { fill: "#3B2F2F", glow: "rgba(59, 47, 47, 0.6)" },
};
