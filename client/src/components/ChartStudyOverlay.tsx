import { useEffect, useState } from "react";
import { Chart } from "@/components/Chart";
import { StarField } from "@/components/StarField";
import { useCurrentSky } from "@/astronomy/transits";
import { unlockedAchievements } from "@/game/achievements";
import { getFragmentById, fragmentTitle } from "@/data/chorus";
import type { Chart as ChartType, PlanetName, Run, SideState } from "@/game/types";

interface ChartStudyOverlayProps {
  chart: ChartType;
  state: SideState;
  unlockedPlanets: PlanetName[];
  /** Finished runs — rendered as the star-field behind the chart (NFT.md). */
  starRuns?: ReadonlyArray<Pick<Run, "id" | "seed" | "distance">>;
  /** Lifetime achievement bitmap — read as quiet marks (MECHANICS §11.2). */
  achievements?: number;
  /** Every fragment heard across the Prince's life — the browsable archive
   *  (SCREENS §7.4). Derived from runs' seenFragmentIds; nothing new stored. */
  heardFragmentIds?: string[];
  onClose: () => void;
}

/** Full-viewport chart inspection overlay — opened from the Map screen's
 *  ChartAnchor. Shows the player's chart at full Chart Study fidelity:
 *  color-field blooms, aspect web, and the planet stats panel on hover or
 *  selection. Dismissed via backdrop click, the close button, or ESC. */
export function ChartStudyOverlay({
  chart,
  state,
  unlockedPlanets,
  starRuns,
  achievements = 0,
  heardFragmentIds,
  onClose,
}: ChartStudyOverlayProps) {
  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  // Study mode — sticky across inspections, same as combat's inspect "i".
  const [study, setStudy] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const inspected = selected ?? hovered;
  // The current sky rides the rim (transits) — the contemplative surface is
  // where reading today's sky against the natal chart belongs.
  const sky = useCurrentSky();
  const marks = unlockedAchievements(achievements);
  const heard = (heardFragmentIds ?? [])
    .map((id) => getFragmentById(id))
    .filter((f): f is NonNullable<typeof f> => f !== null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Clicks on the chart bubble up to the backdrop unless we stop them.
  const onChartClick = () => {
    if (selected !== null) setSelected(null);
  };

  return (
    <div className="chart-study-overlay anim-chart-study-fade" onClick={onClose} role="dialog" aria-label="Chart inspection">
      <div className="chart-study-stage" onClick={(e) => e.stopPropagation()}>
        {starRuns && <StarField runs={starRuns} />}
        <button
          type="button"
          className="chart-study-close"
          onClick={onClose}
          aria-label="Close chart inspection"
        >
          ✕
        </button>
        <div className="chart-study-chart" onClick={onChartClick}>
          <Chart
            chart={chart}
            state={state}
            unlockedPlanets={unlockedPlanets}
            selectedPlanet={selected}
            hoveredPlanet={hovered}
            onPlanetClick={(p) => setSelected((cur) => (cur === p ? null : p))}
            onPlanetHover={setHovered}
            inviteInteraction={!selected}
            statsPanelPlanet={inspected}
            statsPanelStudy={study}
            onToggleStudy={() => setStudy((s) => !s)}
            transits={sky}
          />
        </div>
        {(marks.length > 0 || heard.length > 0) && (
          <div className="chart-study-foot">
            {marks.map((a) => (
              <span key={a.id} className="chart-study-mark">
                {a.label}
              </span>
            ))}
            {heard.length > 0 && (
              <button
                type="button"
                className="chart-study-archive-toggle"
                onClick={() => setArchiveOpen((o) => !o)}
              >
                {heard.length} {heard.length === 1 ? "FRAGMENT" : "FRAGMENTS"} HEARD
              </button>
            )}
          </div>
        )}
        {archiveOpen && heard.length > 0 && (
          <div className="chart-study-archive">
            {heard.map((f) => (
              <div key={f.id} className="chart-study-archive-item">
                <div className="chart-study-archive-text">{f.text.trim()}</div>
                <div className="chart-study-archive-attrib">
                  {f.author?.toUpperCase()}
                  {fragmentTitle(f) ? ` · ${fragmentTitle(f).toUpperCase()}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
