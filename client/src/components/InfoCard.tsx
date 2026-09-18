import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { playUISound } from "@/audio/engine";
import { playFocusSound, playHoverSound } from "@/audio/interaction";

interface InfoCardProps {
  /** Dialog label for assistive tech. */
  ariaLabel: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
}

/** The general-purpose info card: full-viewport backdrop + framed square
 *  stage + close button. Content-agnostic — the chart study view, planet
 *  introductions, and future tooltip/tutorial cards all render inside this
 *  one frame. Dismissed via backdrop click, the close button, or ESC. */
export function InfoCard({ ariaLabel, className = "", onClose, children }: InfoCardProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    playUISound("dismiss");
    onClose();
  }, [onClose]);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    return () => { trigger?.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => { stageRef.current?.focus(); }, [ariaLabel]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) close();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [close]);

  // Portaled to <body>: host screens carry transforms/animations that trap
  // z-index in their own stacking contexts — the card must sit above all
  // surface chrome regardless of where it was summoned from.
  return createPortal(
    <div
      className={`info-card-overlay anim-info-card-fade ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key !== "Tab") return;
        const controls = Array.from(stageRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
        ) ?? []);
        const index = controls.indexOf(document.activeElement as HTMLElement);
        if (event.shiftKey && index <= 0) {
          event.preventDefault();
          controls.at(-1)?.focus();
        } else if (!event.shiftKey && (index === -1 || index === controls.length - 1)) {
          event.preventDefault();
          controls[0]?.focus();
        }
      }}
      // Dismiss on backdrop tap — and swallow it: the card may be mounted
      // inside a screen whose root has its own click handler (e.g. the
      // narrative continue), and a modal's events end at the modal.
      onClick={(e) => { e.stopPropagation(); close(); }}
    >
      {/* The stage stops propagation so its own clicks don't dismiss. */}
      <div ref={stageRef} tabIndex={-1} className="info-card-stage" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="info-card-close"
          onClick={close}
          onPointerEnter={playHoverSound}
          onFocus={playFocusSound}
          aria-label={`Close ${ariaLabel.toLowerCase()}`}
        >
          ✕
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
