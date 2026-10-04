import { useState } from "react";
import {
  CSS_KNOBS,
  TUNING_DEFAULTS,
  TUNING_KNOBS,
  readCssKnob,
  resetCssKnobs,
  resetTuning,
  setCssKnob,
  setTuning,
  useTuning,
} from "@/svg/tuning";
import { playUISound } from "@/audio/engine";
import { playFocusSound, playHoverSound } from "@/audio/interaction";

/**
 * Dev-only chart and title tuner: live sliders for the concentric radii, the
 * arc, the invite's breath, and the title glow. These values are chosen by
 * dragging and watching the screen behind the panel.
 *
 * Nothing here persists. Copy the settled numbers into `viewbox.ts`,
 * `chart-style.ts`, `motion.css`, and `tokens.css`; a reload is the discard.
 */
export function ChartTuner() {
  const tuning = useTuning();
  // CSS knobs live as custom properties, so the DOM already holds the
  // value and this state only mirrors it for the slider position. Seeded from
  // current CSS values, so the panel also retains overrides when reopened.
  const [css, setCss] = useState<Record<string, number>>(() =>
    Object.fromEntries(CSS_KNOBS.map((k) => [k.prop, readCssKnob(k.prop)])),
  );

  const resetAll = () => {
    const changed = (Object.keys(tuning) as Array<keyof typeof tuning>).some(
      (key) => tuning[key] !== TUNING_DEFAULTS[key],
    ) || CSS_KNOBS.some((knob) => document.documentElement.style.getPropertyValue(knob.prop));
    if (!changed) return;
    playUISound("select");
    resetTuning();
    resetCssKnobs();
    setCss(Object.fromEntries(CSS_KNOBS.map((k) => [k.prop, readCssKnob(k.prop)])));
  };

  return (
    <div className="dev-console-block">
      <div className="dev-tuner-head">
        <span>Chart &amp; title</span>
        <button type="button" className="dev-tuner-reset" onClick={resetAll} onPointerEnter={playHoverSound} onFocus={playFocusSound}>
          Reset
        </button>
      </div>

      <div className="dev-console-checks">
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
      </div>

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

      {CSS_KNOBS.map((knob) => (
        <label key={knob.prop} className="dev-tuner-knob">
          <span>
            {knob.label} <strong>{css[knob.prop]}{knob.suffix}</strong>
          </span>
          <input
            type="range"
            min={knob.min}
            max={knob.max}
            step={knob.step}
            value={css[knob.prop] ?? knob.min}
            onPointerEnter={playHoverSound}
            onFocus={playFocusSound}
            onChange={(e) => {
              const value = Number(e.target.value);
              setCssKnob(knob.prop, value, knob.suffix);
              setCss((values) => ({ ...values, [knob.prop]: value }));
            }}
          />
        </label>
      ))}
    </div>
  );
}
