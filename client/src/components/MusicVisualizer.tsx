import { memo, useEffect, useId, useRef, useSyncExternalStore, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { getMusicParts, seekTheme, subscribeMusicParts, themeBeat, toggleMusicPart } from "@/audio/engine";
import { MUSIC_PARTS, roleAudible } from "@/audio/music-parts";
import { surfaceNotes } from "@/audio/score";
import { nameToMidi, THEMES, type ThemeName, type ThemeRole } from "@/audio/themes";
import { NEUTRAL, PLANET_PRIMARY } from "@/svg/palette";

const LOW_PITCH = 36; // C2
const HIGH_PITCH = 88; // E6, shared by every theme and overview.
const PITCH_LABELS = ["C2", "C3", "C4", "C5", "C6"];
const NOTE_STYLE = {
  lead: { strokeWidth: 3, opacity: 1 },
  bass: { strokeWidth: 2, opacity: 0.8 },
  pad: { strokeWidth: 1, opacity: 0.35 },
  arp: { strokeWidth: 1, opacity: 0.55 },
  kick: { strokeWidth: 2, opacity: 0.65 },
  snare: { strokeWidth: 2, opacity: 0.65 },
  hat: { strokeWidth: 1, opacity: 0.45 },
} satisfies Record<ThemeRole, { strokeWidth: number; opacity: number }>;
const isRhythm = (role: ThemeRole) => role === "kick" || role === "snare" || role === "hat";
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/** The map score, with one pitch scale for comparing every composition. */
export const MusicVisualizer = memo(function MusicVisualizer({ theme, overview = false, status }: {
  theme: ThemeName;
  overview?: boolean;
  status?: ReactNode;
}) {
  const spec = THEMES[theme];
  const parts = useSyncExternalStore(subscribeMusicParts, getMusicParts);
  const notes = surfaceNotes(spec, "map");
  const color = theme === "Main" ? NEUTRAL.gold : PLANET_PRIMARY[theme];
  const duration = spec.beats * 60 / spec.bpm;
  const hasRhythm = notes.some((note) => isRhythm(note.role));
  const width = overview ? 300 : 1000;
  const height = overview ? 88 : 320;
  const left = overview ? 0 : 48;
  const right = overview ? width : width - 20;
  const top = overview ? 4 : 16;
  const bottom = overview ? 72 : 256;
  const rhythmY = overview ? 83 : 282;
  const x = (beat: number) => left + beat / spec.beats * (right - left);
  const y = (pitch: number) => top + (HIGH_PITCH - pitch) / (HIGH_PITCH - LOW_PITCH) * (bottom - top);
  const playhead = useRef<SVGLineElement>(null);
  const plotRef = useRef<SVGSVGElement>(null);
  const seekHint = useRef<HTMLParagraphElement>(null);
  const hintId = useId();
  const dragBeat = useRef<number | null>(null);

  function pointerBeat(event: PointerEvent<SVGSVGElement>): number {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = (event.clientX - bounds.left) / bounds.width * width;
    return Math.max(0, Math.min(1, (position - left) / (right - left))) * spec.beats;
  }

  function beginSeek(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || themeBeat(theme) === null) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragBeat.current = pointerBeat(event);
  }

  function finishSeek(event: PointerEvent<SVGSVGElement>) {
    if (dragBeat.current === null) return;
    dragBeat.current = null;
    seekTheme(theme, pointerBeat(event));
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function keySeek(event: KeyboardEvent<SVGSVGElement>) {
    const beat = themeBeat(theme);
    if (beat === null) return;
    let target: number;
    switch (event.key) {
      case "ArrowLeft": case "ArrowDown": target = beat - 5 * spec.bpm / 60; break;
      case "ArrowRight": case "ArrowUp": target = beat + 5 * spec.bpm / 60; break;
      case "Home": target = 0; break;
      case "End": target = spec.beats; break;
      default: return;
    }
    event.preventDefault();
    seekTheme(theme, target);
  }

  useEffect(() => {
    if (overview) return;
    dragBeat.current = null;
    let frame: number;
    const update = () => {
      const playingBeat = themeBeat(theme);
      if (playingBeat === null) dragBeat.current = null;
      const beat = dragBeat.current ?? playingBeat;
      const plot = plotRef.current!;
      plot.setAttribute("aria-disabled", String(playingBeat === null));
      const seconds = Math.floor((beat ?? 0) * 60 / spec.bpm);
      plot.setAttribute("aria-valuenow", String(seconds));
      plot.setAttribute("aria-valuetext", `${timeLabel(seconds)} of ${timeLabel(duration)}`);
      const hint = playingBeat === null ? "Seeking is available when this theme is playing."
        : "Click or drag to seek · Arrow keys move 5 seconds · Home / End";
      if (seekHint.current!.textContent !== hint) seekHint.current!.textContent = hint;
      const line = playhead.current!;
      line.setAttribute("visibility", beat === null ? "hidden" : "visible");
      if (beat !== null) {
        const position = left + beat / spec.beats * (right - left);
        line.setAttribute("x1", String(position));
        line.setAttribute("x2", String(position));
      }
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [theme, overview, spec.beats, spec.bpm, duration, left, right]);

  const plot = (
    <svg ref={plotRef} className={overview ? "music-overview" : "music-score"} viewBox={`0 0 ${width} ${height}`}
      role={overview ? undefined : "slider"} aria-hidden={overview || undefined}
      tabIndex={overview ? undefined : 0}
      aria-label={overview ? undefined : `${theme} map arrangement playback position. Time from left to right, pitch from low to high, note lengths show duration.`}
      aria-describedby={overview ? undefined : hintId}
      aria-orientation={overview ? undefined : "horizontal"}
      aria-valuemin={overview ? undefined : 0} aria-valuemax={overview ? undefined : duration}
      aria-valuenow={overview ? undefined : 0} aria-disabled={overview ? undefined : true}
      onPointerDown={overview ? undefined : beginSeek}
      onPointerMove={overview ? undefined : (event) => { if (dragBeat.current !== null) dragBeat.current = pointerBeat(event); }}
      onPointerUp={overview ? undefined : finishSeek}
      onPointerCancel={overview ? undefined : () => { dragBeat.current = null; }}
      onLostPointerCapture={overview ? undefined : () => { dragBeat.current = null; }}
      onKeyDown={overview ? undefined : keySeek}>
      {!overview && (
        <g className="music-score-grid">
          {PITCH_LABELS.map((name) => (
            <g key={name}>
              <line x1={left} x2={right} y1={y(nameToMidi(name))} y2={y(nameToMidi(name))} />
              <text x={left - 12} y={y(nameToMidi(name))} dominantBaseline="central" textAnchor="end">{name}</text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <g key={fraction}>
              <line x1={x(spec.beats * fraction)} x2={x(spec.beats * fraction)} y1={top} y2={hasRhythm ? rhythmY + 5 : bottom} />
              <text x={x(spec.beats * fraction)} y={height - 8} textAnchor={fraction === 0 ? "start" : fraction === 1 ? "end" : "middle"}>
                {timeLabel(duration * fraction)}
              </text>
            </g>
          ))}
          {hasRhythm && <text x={left - 12} y={rhythmY} dominantBaseline="central" textAnchor="end">Beat</text>}
        </g>
      )}
      <g stroke={color}>
        {notes.map((note, index) => {
          const position = isRhythm(note.role) ? rhythmY : y(nameToMidi(note.n));
          return <line key={index} className="music-score-note" data-role={note.role}
            x1={x(note.t)} x2={x(note.t + note.d)} y1={position} y2={position}
            {...NOTE_STYLE[note.role]} vectorEffect="non-scaling-stroke"
            opacity={NOTE_STYLE[note.role].opacity * (overview || roleAudible(parts, note.role) ? 1 : 0.15)}
            strokeWidth={overview ? NOTE_STYLE[note.role].strokeWidth * 0.6 : NOTE_STYLE[note.role].strokeWidth} />;
        })}
      </g>
      {!overview && <line ref={playhead} className="music-playhead" visibility="hidden"
        x1={left} x2={left} y1={top} y2={hasRhythm ? rhythmY + 5 : bottom}
        stroke={NEUTRAL.bone} strokeWidth="1" vectorEffect="non-scaling-stroke" />}
    </svg>
  );

  if (overview) return plot;
  return (
    <figure className="music-visualizer">
      <figcaption className="music-score-caption">
        <span className="music-score-title" style={{ color }}>{theme === "Main" ? "Main Theme" : theme}</span>
        <span>{spec.bpm} BPM · {timeLabel(duration)} loop</span>
      </figcaption>
      <div className="music-score-scroll">{plot}</div>
      <div className="music-score-key">
        {status}
        <p ref={seekHint} id={hintId} className="gallery-note music-seek-hint" />
        <div className="music-parts" role="group" aria-label="Music parts">
          {MUSIC_PARTS.filter((part) => notes.some((note) => part.roles.some((role) => role === note.role))).map((part) => (
            <button key={part.id} type="button" className="music-part" aria-pressed={!parts.muted.includes(part.id)}
              onClick={() => toggleMusicPart(part.id)}>
              <svg viewBox="0 0 24 8" aria-hidden="true">
                <line x1="0" x2="24" y1="4" y2="4" stroke={color} {...NOTE_STYLE[part.roles[0]]} />
              </svg>
              {part.label}
            </button>
          ))}
        </div>
      </div>
    </figure>
  );
});
