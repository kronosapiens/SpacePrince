import { useState } from "react";
import {
  MOTION_KNOBS,
  TUNING_DEFAULTS,
  TUNING_KNOBS,
  readMotionKnob,
  resetMotionKnobs,
  resetTuning,
  setMotionKnob,
  setTuning,
  useTuning,
} from "@/svg/tuning";
import { playUISound } from "@/audio/engine";
import { playFocusSound, playHoverSound } from "@/audio/interaction";

/**
 * Dev-only chart tuner: live sliders for the concentric radii, the arc, and the
 * invite's breath. These are values that can't be picked by reading a number —
 * a radius only means something against the two radii either side of it, and a
 * breath swing only means something at speed — so they get chosen by dragging
 * and watching the chart behind the panel.
 *
 * Nothing here persists. Copy the settled numbers into `viewbox.ts`,
 * `chart-style.ts`, and `motion.css`; a reload is the discard.
 */
export function ChartTuner() {
  const tuning = useTuning();
  // Motion knobs live as CSS custom properties, so the DOM already holds the
  // value and this state only mirrors it for the slider position. Seeded from
  // whatever motion.css declares, so the panel opens where the stylesheet is.
  const [motion, setMotion] = useState<Record<string, number>>(() =>
    Object.fromEntries(MOTION_KNOBS.map((k) => [k.prop, readMotionKnob(k.prop)])),
  );

  const resetAll = () => {
    const changed = (Object.keys(tuning) as Array<keyof typeof tuning>).some(
      (key) => tuning[key] !== TUNING_DEFAULTS[key],
    ) || MOTION_KNOBS.some((knob) => document.documentElement.style.getPropertyValue(knob.prop));
    if (!changed) return;
    playUISound("select");
    resetTuning();
    resetMotionKnobs();
    setMotion(Object.fromEntries(MOTION_KNOBS.map((k) => [k.prop, readMotionKnob(k.prop)])));
  };

  return (
    <div className="dev-console-block">
      <div className="dev-tuner-head">
        <span>Chart</span>
        <button type="button" className="dev-tuner-reset" onClick={resetAll} onPointerEnter={playHoverSound} onFocus={playFocusSound}>
          Reset
        </button>
      </div>

      <label className="dev-console-check">
        <input
          type="checkbox"
          checked={tuning.showBadges}
          onPointerEnter={playHoverSound}
          onFocus={playFocusSound}
          onChange={(e) => {
            playUISound("select");
            setTuning({ showBadges: e.target.checked });
          }}
        />
        Badges
      </label>

      <label className="dev-console-check">
        <input
          type="checkbox"
          checked={tuning.showGlow}
          onPointerEnter={playHoverSound}
          onFocus={playFocusSound}
          onChange={(e) => {
            playUISound("select");
            setTuning({ showGlow: e.target.checked });
          }}
        />
        Glow
      </label>

      {TUNING_KNOBS.map((knob) => (
        <label key={knob.key} className="dev-tuner-knob">
          <span>
            {knob.label} <strong>{tuning[knob.key]}</strong>
          </span>
          <input
            type="range"
            min={knob.min}
            max={knob.max}
            step={knob.step}
            value={tuning[knob.key]}
            onPointerEnter={playHoverSound}
            onFocus={playFocusSound}
            onChange={(e) => setTuning({ [knob.key]: Number(e.target.value) })}
          />
        </label>
      ))}

      {MOTION_KNOBS.map((knob) => (
        <label key={knob.prop} className="dev-tuner-knob">
          <span>
            {knob.label} <strong>{motion[knob.prop]}{knob.suffix}</strong>
          </span>
          <input
            type="range"
            min={knob.min}
            max={knob.max}
            step={knob.step}
            value={motion[knob.prop] ?? knob.min}
            onPointerEnter={playHoverSound}
            onFocus={playFocusSound}
            onChange={(e) => {
              const value = Number(e.target.value);
              setMotionKnob(knob.prop, value, knob.suffix);
              setMotion((m) => ({ ...m, [knob.prop]: value }));
            }}
          />
        </label>
      ))}
    </div>
  );
}
