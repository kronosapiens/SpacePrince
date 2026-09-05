import { type ReactNode } from "react";

/** The named terms of SCREENS.md §1.2 — capitalized in prose, rendered in
 *  gold on player surfaces (the accent replaces bold). Mention-cased only:
 *  lowercase uses ("afflict their actor") stay body text, so the casing rule
 *  is exactly what the highlighter reads. */
const TERM_RE = /\b(Resolve|Fortune|Light|Afflict|Testify)\b/g;

/** Renders prose with the named terms wrapped in the gold `.term` accent.
 *  Mechanical, so copy stays plain strings and can't drift out of compliance. */
export function TermText({ text }: { text: string }): ReactNode {
  // split with a capturing group alternates [plain, term, plain, term, …].
  return text.split(TERM_RE).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="term">{part}</span>
    ) : (
      part
    ),
  );
}
