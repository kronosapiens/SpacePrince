import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { loadDevSettings, saveDevSettings } from "@/state/settings";
import { randomSeed } from "@/game/rng";

/**
 * Floating dev-mode panel — visible on every screen when devModeActive is on.
 * Quick navigation to all screens, a Reroll button that bumps the URL seed
 * so the current screen regenerates its random state, and a Skip button that
 * exits encounters back to the map.
 *
 * Reroll mechanics: each screen's state generation should be keyed on the
 * `r` URL search param. DevBar bumps that param to force a re-render with
 * fresh randomness.
 */
export function DevBar() {
  const settings = loadDevSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [, setTick] = useState(0);

  // Refresh on storage events so toggle elsewhere updates this bar.
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!settings.devModeActive) return null;

  const reroll = () => {
    const params = new URLSearchParams(location.search);
    params.set("r", String(randomSeed()));
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const skip = () => navigate(ROUTES.map);

  const turnOff = () => {
    saveDevSettings({ ...settings, devModeActive: false });
    setTick((t) => t + 1);
    navigate(ROUTES.title);
  };

  const onEncounter =
    location.pathname === ROUTES.encounter || location.pathname === ROUTES.narrative;

  return (
    <div className="dev-bar" role="region" aria-label="Dev mode">
      <span className="dev-bar-label">DEV</span>
      <nav className="dev-bar-nav">
        <Link to={ROUTES.title} className={cls(location.pathname, ROUTES.title)}>Title</Link>
        <Link to={ROUTES.mint} className={cls(location.pathname, ROUTES.mint)}>Mint</Link>
        <Link to={ROUTES.map} className={cls(location.pathname, ROUTES.map)}>Map</Link>
        <Link to={ROUTES.encounter} className={cls(location.pathname, ROUTES.encounter)}>Combat</Link>
        <Link to={ROUTES.narrative} className={cls(location.pathname, ROUTES.narrative)}>Narrative</Link>
        <Link to={ROUTES.end} className={cls(location.pathname, ROUTES.end)}>End</Link>
        <Link to={ROUTES.study} className={cls(location.pathname, ROUTES.study)}>Study</Link>
        <Link to={ROUTES.index} className={cls(location.pathname, ROUTES.index)}>Index</Link>
      </nav>
      <div className="dev-bar-actions">
        <button className="dev-bar-btn" onClick={reroll} type="button">Reroll</button>
        {onEncounter && (
          <button className="dev-bar-btn" onClick={skip} type="button">Skip</button>
        )}
        <button className="dev-bar-btn dev-bar-btn-quiet" onClick={turnOff} type="button">Off</button>
      </div>
    </div>
  );
}

function cls(current: string, target: string): string {
  return current === target ? "dev-bar-link is-active" : "dev-bar-link";
}
