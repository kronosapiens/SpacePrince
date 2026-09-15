import { Fragment, type ReactNode } from "react";
import type { PlanetName } from "@/game/types";
import { PLANET_PRIMARY } from "@/svg/palette";

/** Named quantities and actions keep their prose capitals; aspect and
 *  combust take the gold accent regardless of capitalization. */
const NAMED_TERMS = new Set(["Resolve", "Fortune", "Light", "Afflict", "Testify"]);
const MECHANIC_TERM_RE = /^(?:aspects?|combust(?:ed)?)$/i;

/** `{name}` slots a template leaves for a caller's value. */
const VAR_RE = /\{(\w+)\}/;
/** `**…**` marks a run of free emphasis (the mint framing's register). */
const BOLD_RE = /\*\*(.+?)\*\*/;

/** Renders prose with the named terms wrapped in the gold `.term` accent,
 *  `**…**` runs in `<strong>`, and any `{name}` placeholder replaced by
 *  `vars[name]`. Mechanical, so copy stays plain strings and can't drift out
 *  of compliance. */
export function TermText({ text, vars }: { text: string; vars?: Record<string, ReactNode> }): ReactNode {
  // Placeholders first: a filled value is already a node, so only the prose
  // runs around it go through the markup passes.
  return text.split(VAR_RE).map((part, i) => (
    <Fragment key={i}>{i % 2 === 1 ? vars?.[part] : emphasis(part)}</Fragment>
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

function emphasis(text: string): ReactNode {
  return text.split(BOLD_RE).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{goldTerms(part)}</strong> : <Fragment key={i}>{goldTerms(part)}</Fragment>,
  );
}

function goldTerms(text: string): ReactNode {
  return text.split(/\b/).map((part, i) =>
    NAMED_TERMS.has(part) || MECHANIC_TERM_RE.test(part) ? (
      <span key={i} className="term">{part}</span>
    ) : (
      part
    ),
  );
}
