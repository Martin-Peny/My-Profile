import { useLanguage } from "./i18n";
import { useEffect, useRef, useState } from "react";
import { SoundIcon } from "./icons";
import "./BackgroundMusic.css";

export default function BackgroundMusic({ onPlayingChange }: { onPlayingChange?: (playing: boolean) => void }) {
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [volume, setVolume] = useState(35);

  useEffect(() => {
    onPlayingChange?.(playing);
  }, [playing, onPlayingChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;

    const startPlayback = () => {
      void audio.play().catch((cause: unknown) => {
        // A browser may require a visitor gesture before allowing audible playback.
        if (cause instanceof DOMException && (cause.name === "NotAllowedError" || cause.name === "AbortError")) return;
        setError(true);
      });
    };
    const startOnInteraction = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(".background-music")) return;
      if (event instanceof KeyboardEvent && (event.repeat || !["Enter", " "].includes(event.key))) return;
      startPlayback();
    };
    const stopWaitingForInteraction = () => {
      document.removeEventListener("pointerdown", startOnInteraction);
      document.removeEventListener("keydown", startOnInteraction);
    };

    document.addEventListener("pointerdown", startOnInteraction);
    document.addEventListener("keydown", startOnInteraction);
    audio.addEventListener("playing", stopWaitingForInteraction);
    startPlayback();
    return () => {
      stopWaitingForInteraction();
      audio.removeEventListener("playing", stopWaitingForInteraction);
      audio.pause();
    };
  }, []);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }

    setLoading(true);
    setError(false);
    try {
      if (audio.error) audio.load();
      await audio.play();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="background-music" role="group" aria-label={t("Background music")}>
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/background-music.mp3`}
        loop
        preload="auto"
        onPlaying={() => { setPlaying(true); setError(false); }}
        onPause={() => setPlaying(false)}
        onError={() => { setPlaying(false); setLoading(false); setError(true); }}
      />
      <button
        className="bgm-toggle"
        type="button"
        aria-label={t(playing ? "Pause background music" : "Play background music")}
        aria-pressed={playing}
        disabled={loading}
        onClick={togglePlayback}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
          {playing ? <path d="M6 5h4v14H6zm8 0h4v14h-4z" /> : <path d="m8 5 11 7-11 7z" />}
        </svg>
        <span className="bgm-label">{t("BGM")}<span>{t(loading ? "LOADING" : playing ? "PLAYING" : "PLAY")}</span></span>
      </button>
      <label className="bgm-volume">
        <SoundIcon />
        <span className="sr-only">{t("Background music volume")}</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={volume}
          aria-valuetext={`${volume}%`}
          onChange={(event) => {
            const nextVolume = Number(event.target.value);
            setVolume(nextVolume);
            if (audioRef.current) audioRef.current.volume = nextVolume / 100;
          }}
        />
      </label>
      <span className={error ? "bgm-error" : "sr-only"} role="status">
        {error ? t("Music unavailable. Press play to retry.") : ""}
      </span>
    </div>
  );
}
