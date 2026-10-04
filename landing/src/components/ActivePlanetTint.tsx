import { useActivePlanet } from "@/state/ActivePlanetContext";
import { PLANET_PRIMARY } from "@/svg/palette";

/** Full-viewport glow in the active planet's color, or warm bone when neutral. */
export function ActivePlanetTint() {
  const { active } = useActivePlanet();
  const tintColor = active ? PLANET_PRIMARY[active] : "var(--bone)";
  return <div className="tint-overlay" style={{ ["--tint-color" as any]: tintColor }} aria-hidden="true" />;
}
