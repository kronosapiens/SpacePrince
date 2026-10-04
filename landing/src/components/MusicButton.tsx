import { useEffect, useRef, useState } from "react";
import type { createMusic } from "@/audio/music";

export function MusicButton() {
  const player = useRef<ReturnType<typeof createMusic> | null>(null);
  const context = useRef<AudioContext | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => () => {
    if (player.current) player.current.dispose();
    else if (context.current) void context.current.close();
    player.current = null;
    context.current = null;
  }, []);

  async function toggle() {
    if (loading) return;
    if (playing) {
      player.current?.pause();
      setPlaying(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      // Unlock audio in the tap itself, before loading Tone, including on iOS.
      const audioContext = context.current ?? new AudioContext();
      context.current = audioContext;
      const [, music] = await Promise.all([
        audioContext.resume(),
        import("@/audio/music"),
      ]);
      if (context.current !== audioContext) return;
      player.current ??= music.createMusic(audioContext);
      player.current.play();
      setPlaying(true);
    } catch {
      if (player.current) player.current.dispose();
      else if (context.current) void context.current.close();
      player.current = null;
      context.current = null;
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const label = loading ? "Loading music…" : playing ? "Pause music" : "Listen";
  return (
    <>
      <button
        className="music-button"
        type="button"
        aria-label={label === "Listen" ? "Listen to the Main theme" : label}
        aria-busy={loading}
        disabled={loading}
        onClick={toggle}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {playing ? (
            <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
          ) : (
            <path d="M8 5v14l11-7z" />
          )}
        </svg>
        <span>{label}</span>
      </button>
      {error && (
        <p className="music-error" role="status">
          Music couldn’t start.
          <button type="button" onClick={() => window.location.reload()}>Reload to try again</button>
        </p>
      )}
    </>
  );
}
