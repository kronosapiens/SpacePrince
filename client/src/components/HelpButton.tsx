import { useState } from "react";
import { InfoCard } from "@/components/InfoCard";
import { TermText } from "@/components/TermText";
import { SCREEN_HELP, type HelpScreen } from "@/data/screen-help";

/** A screen's help copy as card content — shared by the corner "?" below and
 *  by in-card help toggles (the chart study's "?"). */
export function ScreenHelp({ screen }: { screen: HelpScreen }) {
  const help = SCREEN_HELP[screen];
  return (
    <div className="screen-help">
      <div className="screen-help-title">{help.title}</div>
      {help.paragraphs.map((p, i) => (
        <p key={i} className="screen-help-p"><TermText text={p} /></p>
      ))}
    </div>
  );
}

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
          <ScreenHelp screen={screen} />
        </InfoCard>
      )}
    </>
  );
}
