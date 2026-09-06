import { TermText } from "@/components/TermText";
import { SCREEN_HELP, type HelpScreen } from "@/data/screen-help";

/** A screen's help copy as card content — the chart study's "?". The
 *  gameplay screens teach themselves with a guide overlay (`GuideOverlay`). */
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
