import type { PlanetName } from "@/game/types";

export const NEUTRAL = {
  void: "#0B0A0F",
  smoke: "#2A2730",
  bone: "#E8E2D4",
  mist: "#9A95A0",
} as const;

export const PLANET_PRIMARY: Record<PlanetName, string> = {
  Sun: "#E8C46A",       // gold (warm, not saturated)
  Moon: "#B8C5D4",      // pale silver-blue
  Mercury: "#9BB2A4",   // shifting grey-green
  Venus: "#C99480",     // copper-rose
  Mars: "#B83A2E",      // iron red
  Jupiter: "#3A4A8C",   // royal blue
  Saturn: "#7B7378",    // lead grey
};

export const PLANET_SECONDARY: Record<PlanetName, string> = {
  Sun: "#FFE5A8",
  Moon: "#D8DEE6",
  Mercury: "#C2D1C8",
  Venus: "#D9A89B",
  Mars: "#5C2618",
  Jupiter: "#231846",
  Saturn: "#3F3940",
};
