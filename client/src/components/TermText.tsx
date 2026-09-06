import { Fragment, type ReactNode } from "react";
import type { PlanetName } from "@/game/types";
import { PLANET_PRIMARY } from "@/svg/palette";

/** The named terms of SCREENS.md §1.2 — capitalized in prose, rendered in
 *  gold on player surfaces (the accent replaces bold). Mention-cased only:
 *  lowercase uses ("afflict their actor") stay body text, so the casing rule
 *  is exactly what the highlighter reads. */
const TERM_RE = /\b(Resolve|Fortune|Light|Afflict|Testify)\b/g;

/** `{name}` slots a template leaves for a caller's value. */
const VAR_RE = /\{(\w+)\}/;

/** Renders prose with the named terms wrapped in the gold `.term` accent, and
 *  any `{name}` placeholder replaced by `vars[name]`. Mechanical, so copy stays
 *  plain strings and can't drift out of compliance. */
export function TermText({ text, vars }: { text: string; vars?: Record<string, ReactNode> }): ReactNode {
  // Placeholders first: a filled value is already a node, so only the prose
  // runs around it go through the term highlighter.
  return text.split(VAR_RE).map((part, i) => (
    <Fragment key={i}>{i % 2 === 1 ? vars?.[part] : goldTerms(part)}</Fragment>
  ));
}

/** The same fill for a label, which is plain text rather than a node. */
export function fillLabel(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => String(vars[name] ?? whole));
}

/** A planet's name in its own colour — the other accented run in guide copy. */
export function planetName(planet: PlanetName): ReactNode {
  return <span style={{ color: PLANET_PRIMARY[planet] }}>{planet}</span>;
}

function goldTerms(text: string): ReactNode {
  // split with a capturing group alternates [plain, term, plain, term, …].
  return text.split(TERM_RE).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="term">{part}</span>
    ) : (
      part
    ),
  );
}
