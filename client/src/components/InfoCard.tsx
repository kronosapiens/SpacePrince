import { useEffect, type ReactNode } from "react";

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

  return (
    <div className="info-card-overlay anim-info-card-fade" onClick={onClose} role="dialog" aria-label={ariaLabel}>
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
    </div>
  );
}
