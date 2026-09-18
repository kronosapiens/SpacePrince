import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AudioControls } from "./AudioControls";
import { InfoCard } from "./InfoCard";
import { Chart } from "./Chart";
import { unlockedPlanets } from "@/game/unlocks";
import { NEUTRAL } from "@/svg/palette";
import { PRINCE_CHART_INSET } from "@/svg/viewbox";
import { usePrince } from "@/state/PrinceStore";
import { playUISound } from "@/audio/engine";
import { playFocusSound, playHoverSound } from "@/audio/interaction";

export function SettingsMenu() {
  const prince = usePrince();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"settings" | "prince" | null>(null);
  const close = useCallback(() => setView(null), []);
  const inspecting = view === "prince" && !!prince;

  useEffect(() => {
    if (view !== "settings") return;
    panelRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setView(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      playUISound("dismiss");
      setView(null);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [view]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="screen-settings-button"
        aria-label={view === "settings" ? "Close settings" : "Open settings"}
        aria-haspopup="dialog"
        aria-expanded={view === "settings"}
        aria-controls={view === "settings" ? panelId : undefined}
        onPointerEnter={playHoverSound}
        onFocus={playFocusSound}
        onClick={(event) => {
          event.stopPropagation();
          playUISound(view === "settings" ? "dismiss" : "select");
          setView(view === "settings" ? null : "settings");
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <circle cx="12" cy="12" r="6.5" />
          <circle cx="12" cy="12" r="2.5" />
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1="12" y1="2.5" x2="12" y2="5.5" transform={`rotate(${i * 45} 12 12)`} />
          ))}
        </svg>
      </button>
      {inspecting && (
        <InfoCard ariaLabel="Prince" className="prince-modal" onClose={close}>
          <svg className="prince-artwork" viewBox="0 0 800 1000">
            <svg
              x={PRINCE_CHART_INSET}
              y={100 + PRINCE_CHART_INSET}
              width={800 - 2 * PRINCE_CHART_INSET}
              height={800 - 2 * PRINCE_CHART_INSET}
              viewBox="0 0 1000 1000"
            >
              <Chart
                chart={prince.chart}
                unlockedPlanets={unlockedPlanets(prince.numEncounters)}
                passive
                hideAffliction
              />
            </svg>
            <rect x="1" y="1" width="798" height="998" fill="none"
              stroke={NEUTRAL.gold} strokeOpacity="0.28" vectorEffect="non-scaling-stroke" />
          </svg>
        </InfoCard>
      )}
      {view === "settings" && (
        <div
          ref={panelRef}
          id={panelId}
          className="settings-dropdown settings-content anim-info-card-fade"
          role="dialog"
          aria-label="Settings"
          tabIndex={-1}
          onKeyDown={(event) => event.stopPropagation()}
          onBlur={(event) => {
            const target = event.relatedTarget as Node | null;
            if (target && !event.currentTarget.contains(target) && !triggerRef.current?.contains(target)) setView(null);
          }}
        >
          <h2>Settings</h2>
          <AudioControls />
          <div className="settings-prince">
            <button
              type="button"
              className="prince-inspect-button"
              disabled={!prince}
              onPointerEnter={playHoverSound}
              onFocus={playFocusSound}
              onClick={() => {
                playUISound("select");
                triggerRef.current?.focus();
                setView("prince");
              }}
            >
              <span>Inspect Prince</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <circle cx="12" cy="12" r="8" />
                <path d="M8 12h8m-4-4 4 4-4 4" />
              </svg>
            </button>
            {!prince && <p>Create a Prince to inspect it here.</p>}
          </div>
        </div>
      )}
    </>
  );
}
