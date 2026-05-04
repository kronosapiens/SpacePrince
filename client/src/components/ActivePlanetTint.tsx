import { useActivePlanet } from "@/state/ActivePlanetContext";
import { PLANET_PRIMARY } from "@/svg/palette";

/** Single full-viewport radial gradient overlay. Color shifts to the
 *  active planet when one is set; falls back to a warm bone neutral so
 *  every screen carries the same breathing atmospheric layer (map, end-
 *  of-run, etc. don't go flat-black). */
export function ActivePlanetTint() {
  const { active } = useActivePlanet();
  const tintColor = active ? PLANET_PRIMARY[active] : "var(--bone)";
  return <div className="tint-overlay" style={{ ["--tint-color" as any]: tintColor }} aria-hidden="true" />;
}
