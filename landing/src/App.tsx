import { lazy, Suspense } from "react";
import { ActivePlanetTint } from "@/components/ActivePlanetTint";
import { LandingScreen } from "@/LandingScreen";

// /#og renders the social-card preview for screenshot capture. Dev only.
// `import.meta.env.DEV` is a Vite compile-time constant; in prod builds the
// conditional collapses to false, the dynamic import is never reachable, and
// Rollup excludes OGCard.tsx + og.css from the production bundle entirely.
const OGCard = import.meta.env.DEV
  ? lazy(() => import("@/OGCard").then((m) => ({ default: m.OGCard })))
  : null;

export function App() {
  const isOG =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    window.location.hash === "#og";
  return (
    <>
      <ActivePlanetTint />
      {isOG && OGCard ? (
        <Suspense fallback={null}>
          <OGCard />
        </Suspense>
      ) : (
        <LandingScreen />
      )}
    </>
  );
}
