import { useState } from "react";
import { CODEX } from "@/copy/codex";
import { TermText } from "./TermText";
import { playUISound } from "@/audio/engine";
import { playFocusSound, playHoverSound } from "@/audio/interaction";

const ENTRIES = new Map(CODEX.flatMap((group) => group.entries).map((entry) => [entry.id, entry]));
const FIRST = CODEX[0]!.entries[0]!.id;

/** The Astral Codex — an index of terms beside the selected entry. */
export function Codex({ initialTerm }: { initialTerm?: string }) {
  const [id, setId] = useState(initialTerm && ENTRIES.has(initialTerm) ? initialTerm : FIRST);
  const entry = ENTRIES.get(id)!;
  const open = (next: string) => {
    playUISound("select");
    setId(next);
  };
  const link = (target: string, className: string) => (
    <button
      key={target}
      type="button"
      className={className}
      aria-current={target === id || undefined}
      onPointerEnter={playHoverSound}
      onFocus={playFocusSound}
      onClick={() => open(target)}
    >
      {ENTRIES.get(target)!.term}
    </button>
  );

  return (
    <div className="codex">
      <nav className="codex-index" aria-label="Terms">
        {CODEX.map((group) => (
          <section key={group.heading}>
            <h3>{group.heading}</h3>
            {group.entries.map((e) => link(e.id, "codex-index-term"))}
          </section>
        ))}
      </nav>
      <article className="codex-entry" key={id} aria-live="polite">
        <h2>{entry.term}</h2>
        {entry.paragraphs.map((text, i) => <p key={i}><TermText text={text} /></p>)}
        {entry.inPlay && (
          <>
            <h3>In play</h3>
            <p><TermText text={entry.inPlay} /></p>
          </>
        )}
        {entry.see && (
          <>
            <h3>See also</h3>
            <div className="codex-see">{entry.see.map((target) => link(target, "codex-see-term"))}</div>
          </>
        )}
      </article>
    </div>
  );
}
