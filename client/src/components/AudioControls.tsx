import { useSyncExternalStore, type CSSProperties } from "react";
import {
  getMusicVolume, getSoundVolume, setMusicVolume, setSoundVolume, subscribeVolume,
} from "@/audio/engine";
import { playFocusSound, playHoverSound } from "@/audio/interaction";

/** The menu and dev console control the same saved audio levels. */
export function AudioControls() {
  const sound = useSyncExternalStore(subscribeVolume, getSoundVolume);
  const music = useSyncExternalStore(subscribeVolume, getMusicVolume);

  return (
    <div className="audio-controls">
      <VolumeSlider label="Sound" volume={sound} onChange={setSoundVolume} />
      <VolumeSlider label="Music" volume={music} onChange={setMusicVolume} />
    </div>
  );
}

function VolumeSlider({ label, volume, onChange }: {
  label: string;
  volume: number;
  onChange: (volume: number) => void;
}) {
  const percent = Math.round(volume * 100);
  return (
    <label className="audio-control">
      <span className="audio-control-label">
        <span>{label}</span>
        <span className="audio-control-value">{percent}%</span>
      </span>
      <input
        type="range"
        aria-label={`${label} volume`}
        aria-valuetext={percent === 0 ? "Muted" : `${percent}%`}
        min={0}
        max={100}
        step={1}
        value={percent}
        style={{ "--volume": `${percent}%` } as CSSProperties}
        onPointerEnter={playHoverSound}
        onFocus={playFocusSound}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
    </label>
  );
}
