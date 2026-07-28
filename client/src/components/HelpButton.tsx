import { useState } from "react";
import { InfoCard } from "@/components/InfoCard";
import { SCREEN_HELP, type HelpScreen } from "@/data/screen-help";

/** The "?" affordance in the top-right corner: summons this screen's help
 *  inside the info card. Each gameplay surface mounts its own. */
export function HelpButton({ screen }: { screen: HelpScreen }) {
  const [open, setOpen] = useState(false);
  const help = SCREEN_HELP[screen];
  return (
    <>
      <button
        type="button"
        className="screen-help-button"
        aria-label={`About this screen: ${help.title}`}
        // Host screens hang click handlers on their roots (clear-selection,
        // continue); the help gesture must not leak into them.
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        ?
      </button>
      {open && (
        <InfoCard ariaLabel={help.title} onClose={() => setOpen(false)}>
          <div className="screen-help">
            <div className="screen-help-title">{help.title}</div>
            {help.paragraphs.map((p, i) => (
              <p key={i} className="screen-help-p">{p}</p>
            ))}
          </div>
        </InfoCard>
      )}
    </>
  );
}
