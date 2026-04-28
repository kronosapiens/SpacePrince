import { useActivePlanet } from "@/state/ActivePlanetContext";
import { PLANET_PRIMARY } from "@/svg/palette";

/** Single full-viewport radial gradient overlay. Color set per active planet, fades to transparent when neutral. */
export function ActivePlanetTint() {
  const { active } = useActivePlanet();
  const tintColor = active ? PLANET_PRIMARY[active] : "transparent";
  return <div className="tint-overlay" style={{ ["--tint-color" as any]: tintColor }} aria-hidden="true" />;
}
