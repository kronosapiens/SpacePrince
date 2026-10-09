import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  currentTheme, ensureAudio, getSoundVolume, playPropagationPreview, setTheme,
  subscribeTheme, subscribeVolume,
} from "@/audio/engine";
import {
  ACTION_PHRASES, phraseNoteName, propagationPhrase, type PhraseVariant, type PropagationNote,
} from "@/audio/propagation-phrases";
import { THEMES } from "@/audio/themes";
import { PLANETS } from "@/game/data";
import type { PlanetName } from "@/game/types";
import { PLANET_GLYPH } from "@/svg/glyphs";
import { NEUTRAL, PLANET_PRIMARY } from "@/svg/palette";

const DESCRIPTIONS: Record<PhraseVariant, string> = {
  "Current order": "The encounter’s existing order and register.",
  Thirds: "A cycle of thirds, folded into the octave above the first note.",
  Arch: "Rise to a high point, then come back down.",
  "Falling thirds": "Reverse the cycle, within the octave below the first note.",
};
const INITIAL_RECIPIENTS: PlanetName[] = ["Mercury", "Saturn", "Venus"];
const ARRANGEMENTS = [
  { label: "Current order", variant: "Current order" },
  { label: "Testify", variant: ACTION_PHRASES.Testimony },
  { label: "Afflict", variant: ACTION_PHRASES.Affliction },
  { label: "Necessity", variant: ACTION_PHRASES.Necessity },
] as const;

export function PropagationPhrases() {
  const [ruler, setRuler] = useState<PlanetName>("Sun");
  const [source, setSource] = useState<PlanetName>("Sun");
  const [recipients, setRecipients] = useState<PlanetName[]>(INITIAL_RECIPIENTS);
  const [sustain, setSustain] = useState(true);
  const [playing, setPlaying] = useState<PhraseVariant | null>(null);
  const [sounding, setSounding] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const soundVolume = useSyncExternalStore(subscribeVolume, getSoundVolume);
  const theme = useSyncExternalStore(subscribeTheme, currentTheme);
  const generation = useRef(0);
  const cancel = useRef<() => void>(() => {});
  const cancelPlayback = useCallback(() => {
    generation.current++;
    cancel.current();
    cancel.current = () => {};
  }, []);
  const stop = useCallback(() => {
    cancelPlayback();
    setPlaying(null);
    setSounding(null);
  }, [cancelPlayback]);

  useEffect(() => cancelPlayback, [cancelPlayback]);
  useEffect(() => {
    if (soundVolume === 0 || theme) stop();
  }, [soundVolume, theme, stop]);

  async function play(variant: PhraseVariant) {
    stop();
    setError(false);
    if (soundVolume === 0) return;
    const selected = generation.current;
    const hadTheme = currentTheme() !== null;
    setTheme(null);
    setPlaying(variant);
    try {
      await ensureAudio();
      if (selected !== generation.current) return;
      const start = () => {
        cancel.current = playPropagationPreview(
          propagationPhrase(ruler, source, recipients, variant),
          (index) => { if (selected === generation.current) setSounding(index); },
          (failure) => {
            if (selected !== generation.current) return;
            setPlaying(null);
            setSounding(null);
            setError(Boolean(failure));
          },
          sustain,
        );
      };
      // Let the selected theme finish its existing fade before the opening pluck.
      if (hadTheme) {
        const timer = window.setTimeout(start, 1200);
        cancel.current = () => window.clearTimeout(timer);
      } else start();
    } catch {
      if (selected !== generation.current) return;
      setPlaying(null);
      setError(true);
    }
  }

  const phrases = ARRANGEMENTS.map((arrangement) => ({ ...arrangement, notes: propagationPhrase(ruler, source, recipients, arrangement.variant) }));
  const pitches = phrases.flatMap(({ notes }) => notes.map((note) => note.midi));
  const activePhrase = phrases.find((phrase) => phrase.variant === playing);
  const low = Math.min(...pitches) - 2;
  const high = Math.max(...pitches) + 2;

  return (
    <section id="propagation" className="gallery-section" aria-labelledby="gallery-propagation-title">
      <div className="gallery-section-heading">
        <div>
          <p className="eyebrow">06 · Propagation study</p>
          <h2 id="gallery-propagation-title">Propagation phrases</h2>
          <p className="gallery-note">One initial hit, then its neighbours. Compare the action phrases with the current order.</p>
        </div>
        <button type="button" className="gallery-music-stop" disabled={playing === null} onClick={stop}>Stop phrase</button>
      </div>

      <div className="propagation-controls">
        <label className="gallery-sign">Encounter ruler
          <select aria-label="Encounter ruler" value={ruler} onChange={(event) => { stop(); setRuler(event.target.value as PlanetName); }}>
            {PLANETS.map((planet) => <option key={planet} value={planet}>{planet} · {THEMES[planet].mode}</option>)}
          </select>
        </label>
        <label className="gallery-sign">Initially struck
          <select aria-label="Initially struck" value={source} onChange={(event) => {
            stop();
            const next = event.target.value as PlanetName;
            setSource(next);
            setRecipients(recipients.filter((planet) => planet !== next));
          }}>
            {PLANETS.map((planet) => <option key={planet}>{planet}</option>)}
          </select>
        </label>
        <div className="propagation-presets" aria-label="Phrase examples">
          <button type="button" onClick={() => { stop(); setRuler("Sun"); setSource("Sun"); setRecipients(INITIAL_RECIPIENTS); }}>Opening example</button>
          <button type="button" onClick={() => { stop(); setRecipients(PLANETS.filter((planet) => planet !== source)); }}>All seven</button>
          <button type="button" onClick={() => { stop(); setRecipients([]); }}>Initial only</button>
        </div>
      </div>

      <fieldset className="propagation-recipients">
        <legend>Propagation recipients</legend>
        {PLANETS.filter((planet) => planet !== source).map((planet) => (
          <button key={planet} type="button" aria-label={planet} aria-pressed={recipients.includes(planet)}
            onClick={() => { stop(); setRecipients(recipients.includes(planet) ? recipients.filter((value) => value !== planet) : [...recipients, planet]); }}>
            <svg viewBox="0 0 32 32" aria-hidden="true"><text x="16" y="17" textAnchor="middle" dominantBaseline="central" fill={PLANET_PRIMARY[planet]}>{PLANET_GLYPH[planet]}</text></svg>
            {planet}
          </button>
        ))}
      </fieldset>

      <div className="propagation-sustain-control">
        <label className="propagation-sustain">
          <input type="checkbox" checked={sustain} aria-describedby="propagation-sustain-hint"
            onChange={(event) => { stop(); setSustain(event.target.checked); }} />
          Sustain notes
        </label>
        <p id="propagation-sustain-hint" className="gallery-note">Notes build a chord and release together.</p>
      </div>

      <div className="propagation-phrases">
        {phrases.map(({ label, variant, notes }) => (
          <article className="propagation-phrase" key={variant} data-playing={playing === variant}>
            <div className="propagation-phrase-heading">
              <h3>{label}{label !== variant && <span className="gallery-note"> · {variant}</span>}</h3>
              <button type="button" className="gallery-music-stop" aria-label={`Play ${label} phrase`}
                disabled={soundVolume === 0} onClick={() => { void play(variant); }}>
                {playing === variant ? "Replay ↺" : "Play ▷"}
              </button>
            </div>
            <p className="gallery-note">{DESCRIPTIONS[variant]}</p>
            <PhrasePlot notes={notes} low={low} high={high} sounding={playing === variant ? sounding : null} sustain={sustain} label={label === variant ? label : `${label} · ${variant}`} />
          </article>
        ))}
      </div>
      <p className="gallery-note propagation-caption">Same plucked attack and encounter timing throughout. Planet notes keep their scale degrees; arrangements change order and octave.</p>
      <p className="gallery-note">Gallery study only. Playing a phrase stops the theme. Uses <a href="#music">Sound volume</a>.</p>
      <p className="gallery-note propagation-status" role="status">
        {soundVolume === 0 ? "Sound is muted. Raise Sound volume above to listen." : error ? "Audio could not start. Try Play again." : activePhrase ? `${activePhrase.label} · ${sounding === null ? "Listening" : activePhrase.notes[sounding]!.planet}` : "Ready to listen"}
      </p>
    </section>
  );
}

function PhrasePlot({ notes, low, high, sounding, sustain, label }: {
  notes: PropagationNote[]; low: number; high: number; sounding: number | null; sustain: boolean; label: string;
}) {
  const duration = notes.at(-1)!.at + 0.35;
  const x = (note: PropagationNote) => 34 + (note.at - 0.2) / Math.max(0.83, duration - 0.55) * 492;
  const y = (note: PropagationNote) => 28 + (high - note.midi) / (high - low) * 104;
  return (
    <svg className="propagation-plot" viewBox="0 0 560 200" role="img"
      aria-label={`${label}: ${notes.map((note) => `${note.planet} ${phraseNoteName(note)}`).join(" → ")}`}>
      <line x1="24" y1="153" x2="536" y2="153" stroke={NEUTRAL.smoke} />
      <polyline points={notes.map((note) => `${x(note)},${y(note)}`).join(" ")} fill="none" stroke={NEUTRAL.mist} strokeOpacity="0.5" />
      {notes.map((note, index) => (
        <g key={note.planet} className="propagation-note" data-sounding={sounding !== null && (sustain ? index <= sounding : index === sounding)} data-planet={note.planet}>
          <circle className="propagation-note-ring" cx={x(note)} cy={y(note)} r="17" fill={NEUTRAL.void} stroke={PLANET_PRIMARY[note.planet]} />
          <text x={x(note)} y={y(note) + 1} textAnchor="middle" dominantBaseline="central" fill={PLANET_PRIMARY[note.planet]} className="propagation-glyph">{PLANET_GLYPH[note.planet]}</text>
          <text x={x(note)} y="171" textAnchor="middle" className="propagation-planet-label">{note.planet}</text>
          <text x={x(note)} y="189" textAnchor="middle" className="propagation-pitch-label">{phraseNoteName(note)}</text>
        </g>
      ))}
    </svg>
  );
}
