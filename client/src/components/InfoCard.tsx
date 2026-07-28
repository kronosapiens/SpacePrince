import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface InfoCardProps {
  /** Dialog label for assistive tech. */
  ariaLabel: string;
  onClose: () => void;
  children: ReactNode;
}

/** The general-purpose info card: full-viewport backdrop + framed square
 *  stage + close button. Content-agnostic — the chart study view, planet
 *  introductions, and future tooltip/tutorial cards all render inside this
 *  one frame. Dismissed via backdrop click, the close button, or ESC. */
export function InfoCard({ ariaLabel, onClose, children }: InfoCardProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Portaled to <body>: host screens carry transforms/animations that trap
  // z-index in their own stacking contexts — the card must sit above all
  // surface chrome regardless of where it was summoned from.
  return createPortal(
    <div
      className="info-card-overlay anim-info-card-fade"
      role="dialog"
      aria-label={ariaLabel}
      // Dismiss on backdrop tap — and swallow it: the card may be mounted
      // inside a screen whose root has its own click handler (e.g. the
      // narrative continue), and a modal's events end at the modal.
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      {/* The stage stops propagation so its own clicks don't dismiss. */}
      <div className="info-card-stage" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="info-card-close"
          onClick={onClose}
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
