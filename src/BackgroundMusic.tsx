import { useLanguage } from "./i18n";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { musicAssetUrl, musicTracks, type MusicTrack } from "./music";
import "./BackgroundMusic.css";
import { useFloatingRecord } from "./useFloatingRecord";

type PlaybackMode = "ordered" | "shuffle" | "repeat-one";
type PlayerProps = {
  onPlayingChange?: (playing: boolean) => void;
  tracks?: readonly MusicTrack[];
};

function timeLabel(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

function PlayerIcon({ kind }: { kind: "play" | "pause" | "previous" | "next" | "volume" | "search" | "close" }) {
  const paths = {
    play: "m9 5 11 7-11 7z",
    pause: "M6 5h4v14H6zm8 0h4v14h-4z",
    previous: "M5 5h2v14H5zm14 0L8 12l11 7z",
    next: "M17 5h2v14h-2zM5 5l11 7-11 7z",
    volume: "M3 9h4l5-4v14l-5-4H3z",
    search: "M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
    close: "m6 6 12 12M6 18 18 6",
  };
  const outlined = kind === "search" || kind === "close";
  return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill={outlined ? "none" : "currentColor"} stroke={outlined ? "currentColor" : "none"} strokeWidth="1.5" strokeLinecap="round"><path d={paths[kind]} />{kind === "volume" && <path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" fill="none" stroke="currentColor" strokeWidth="1.5" />}</svg>;
}

export default function BackgroundMusic({ onPlayingChange, tracks = musicTracks }: PlayerProps) {
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const indexRef = useRef(0);
  const requestRef = useRef(0);
  const mountedRef = useRef(false);
  const wantsPlayback = useRef(false);
  const stopAutoplayRef = useRef(() => {});
  const historyRef = useRef({ entries: [0], position: 0 });
  const shuffleBag = useRef<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const floating = useFloatingRecord(launcherRef, panelRef, open, () => setOpen(current => !current));
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [volume, setVolume] = useState(35);
  const [muted, setMuted] = useState(false);
  const [mode, setMode] = useState<PlaybackMode>("ordered");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [search, setSearch] = useState("");
  const currentTrack = tracks[currentIndex];
  const modeLabel = mode === "ordered" ? "In order" : mode === "shuffle" ? "Shuffle" : "Repeat one";

  useEffect(() => { onPlayingChange?.(playing); }, [playing, onPlayingChange]);

  useEffect(() => {
    if (open || floating.dragging) setShowIntro(false);
  }, [open, floating.dragging]);

  async function startPlayback(automatic = false) {
    const audio = audioRef.current;
    if (!audio || !tracks[indexRef.current]) return;
    const request = ++requestRef.current;
    wantsPlayback.current = true;
    setLoading(true);
    setError(false);
    try {
      if (audio.error) audio.load();
      await audio.play();
    } catch (cause) {
      if (request !== requestRef.current || !mountedRef.current) return;
      wantsPlayback.current = false;
      setLoading(false);
      setPlaying(false);
      // Source changes abort old play promises; autoplay policy failures are not media errors.
      if (cause instanceof DOMException && (cause.name === "AbortError" || (automatic && cause.name === "NotAllowedError"))) return;
      setError(true);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    const audio = audioRef.current!;
    indexRef.current = 0;
    setCurrentIndex(0);
    setPosition(0);
    setDuration(0);
    historyRef.current = { entries: [0], position: 0 };
    shuffleBag.current = tracks.map((_, index) => index).slice(1);
    const stopWaiting = () => {
      document.removeEventListener("pointerdown", startOnInteraction);
      document.removeEventListener("keydown", startOnInteraction);
    };
    const startOnInteraction = (event: Event) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      if (event instanceof KeyboardEvent && (event.repeat || !["Enter", " "].includes(event.key))) return;
      void startPlayback(true);
    };
    stopAutoplayRef.current = stopWaiting;
    if (tracks.length) {
      audio.src = musicAssetUrl(tracks[0].src);
      document.addEventListener("pointerdown", startOnInteraction);
      document.addEventListener("keydown", startOnInteraction);
      void startPlayback(true);
    } else {
      audio.removeAttribute("src");
      audio.load();
      setPlaying(false); setLoading(false); setError(false);
    }
    return () => {
      mountedRef.current = false;
      ++requestRef.current;
      stopWaiting();
      audio.pause();
    };
  }, [tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) { audio.volume = volume / 100; audio.muted = muted; }
  }, [volume, muted]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Element && !rootRef.current?.contains(event.target) && !event.target.closest(".language-switch")) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      if (rootRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        launcherRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);

  function selectTrack(index: number, recordHistory = true) {
    const audio = audioRef.current;
    if (!audio || !tracks[index]) return;
    stopAutoplayRef.current();
    ++requestRef.current;
    audio.pause();
    indexRef.current = index;
    setCurrentIndex(index);
    setPosition(0); setDuration(0); setPlaying(false);
    if (recordHistory) {
      const history = historyRef.current;
      history.entries = [...history.entries.slice(0, history.position + 1), index];
      history.position = history.entries.length - 1;
    }
    shuffleBag.current = shuffleBag.current.filter(item => item !== index);
    audio.src = musicAssetUrl(tracks[index].src);
    audio.load();
    void startPlayback();
  }

  function nextTrack() {
    if (!tracks.length) return;
    const history = historyRef.current;
    if (history.position < history.entries.length - 1) {
      selectTrack(history.entries[++history.position], false);
      return;
    }
    if (mode === "shuffle" && tracks.length > 1) {
      if (!shuffleBag.current.length) shuffleBag.current = tracks.map((_, index) => index).filter(index => index !== indexRef.current);
      selectTrack(shuffleBag.current[Math.floor(Math.random() * shuffleBag.current.length)]);
    } else selectTrack((indexRef.current + 1) % tracks.length);
  }

  function previousTrack() {
    if (!tracks.length) return;
    const history = historyRef.current;
    if (history.position > 0) selectTrack(history.entries[--history.position], false);
    else selectTrack(mode === "shuffle" ? indexRef.current : (indexRef.current - 1 + tracks.length) % tracks.length);
  }

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    stopAutoplayRef.current();
    if (!audio.paused || (loading && wantsPlayback.current)) {
      wantsPlayback.current = false;
      ++requestRef.current;
      audio.pause();
      setLoading(false); setPlaying(false);
    } else void startPlayback();
  }

  function changeMode() {
    setMode(mode === "ordered" ? "shuffle" : mode === "shuffle" ? "repeat-one" : "ordered");
    shuffleBag.current = tracks.map((_, index) => index).filter(index => index !== indexRef.current);
  }

  const progress = duration ? Math.min(100, position / duration * 100) : 0;
  const filteredTracks = tracks.map((track, index) => ({ track, index })).filter(({ track }) => t(track.title).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const playbackLabel = t(playing || (loading && wantsPlayback.current) ? "Pause music" : "Play music");
  const playButton = (className: string) => <button className={className} type="button" aria-label={playbackLabel} aria-pressed={playing} disabled={!currentTrack} onClick={togglePlayback}><PlayerIcon kind={playing || (loading && wantsPlayback.current) ? "pause" : "play"} /></button>;
  const errorFeedback = <div className={error ? "bgm-error" : "sr-only"} role="status">{error ? t("Music unavailable. Press play to retry.") : ""}{error && <button type="button" onClick={() => { stopAutoplayRef.current(); void startPlayback(); }}>{t("Retry playback")}</button>}</div>;

  return (
    <div ref={rootRef} className="background-music" role="group" aria-label={t("Music player")} data-playing={playing} data-loading={loading} data-dragging={floating.dragging} style={floating.positionStyle}>
      <audio ref={audioRef} loop={mode === "repeat-one" || tracks.length === 1} preload="none"
        onPlaying={() => { stopAutoplayRef.current(); setPlaying(true); setLoading(false); setError(false); }}
        onPause={() => setPlaying(false)}
        onWaiting={() => { if (wantsPlayback.current) { setLoading(true); setPlaying(false); } }}
        onTimeUpdate={event => setPosition(event.currentTarget.currentTime)}
        onDurationChange={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        onEnded={() => { setPlaying(false); nextTrack(); }}
        onError={event => { if (!event.currentTarget.error) return; wantsPlayback.current = false; setPlaying(false); setLoading(false); setError(true); }}
      />
      <button ref={launcherRef} className="music-record-toggle" type="button" title={t("Music player")} aria-label={t(open ? "Close playlist" : "Open playlist")} aria-description={`${t("Music player")}. ${t("Drag the record to move it. Click to open the playlist.")}`} aria-expanded={open} aria-controls="music-panel" {...floating.pointerHandlers} onClick={event => { if (floating.allowClick(event.detail === 0)) setOpen(!open); }}>
        <span className="music-record" aria-hidden="true"><span className="music-record-label" /></span>
        <span className="music-launcher-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="23" height="23" fill="none"><path d="M10 17V6l10-2v11M10 9l10-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><ellipse cx="7" cy="17.5" rx="3" ry="2.5" fill="currentColor" /><ellipse cx="17" cy="15.5" rx="3" ry="2.5" fill="currentColor" /></svg>
          <span>{t("MUSIC")}</span>
        </span>
      </button>
      {showIntro && <span className="music-intro-hint" aria-hidden="true"><span>{t("Music player")}</span><strong>{t("Click to listen")}</strong></span>}
      <section ref={panelRef} className="music-panel" id="music-panel" aria-labelledby="music-panel-title" hidden={!open} style={floating.panelStyle}>
        <header className="music-panel-header">
          <div><span className="music-eyebrow">{t("Haoyang Ling")} / {t("MUSIC")}</span><h2 id="music-panel-title">{t("ON THE RECORD")}</h2></div>
          <button type="button" className="music-icon-button" aria-label={t("Close playlist")} onClick={() => { setOpen(false); launcherRef.current?.focus(); }}><PlayerIcon kind="close" /></button>
        </header>
        <div className="music-now-playing">
          <div className="music-cover" aria-hidden="true">{currentTrack?.cover ? <img key={currentTrack.cover} src={musicAssetUrl(currentTrack.cover)} alt="" onError={event => { event.currentTarget.style.display = "none"; }} /> : null}<span className="music-record"><span className="music-record-label" /></span></div>
          <div className="music-current-copy"><span className="music-eyebrow">{t(loading ? "LOADING" : playing ? "Now playing" : "Selected track")}</span><h3>{currentTrack ? t(currentTrack.title) : t("No songs yet")}</h3>{currentTrack?.performer && <p>{t(currentTrack.performer)}</p>}</div>
          <span className="music-signal" aria-hidden="true"><i /><i /><i /><i /></span>
        </div>
        {open && errorFeedback}
        <div className="music-transport">
          <label className="music-seek"><span className="sr-only">{t("Playback position")}</span><input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(position, duration)} disabled={!duration} aria-valuetext={`${timeLabel(position)} / ${timeLabel(duration)}`} style={{ "--progress": `${progress}%` } as CSSProperties} onChange={event => { const audio = audioRef.current; if (!audio || !duration) return; const value = Number(event.target.value); audio.currentTime = value; setPosition(value); }} /></label>
          <div className="music-time" aria-hidden="true"><span>{timeLabel(position)}</span><span>{timeLabel(duration)}</span></div>
          <div className="music-controls">
            <button type="button" className="music-icon-button" aria-label={t("Previous track")} disabled={!currentTrack} onClick={previousTrack}><PlayerIcon kind="previous" /></button>
            {playButton("music-main-play")}
            <button type="button" className="music-icon-button" aria-label={t("Next track")} disabled={!currentTrack} onClick={nextTrack}><PlayerIcon kind="next" /></button>
          </div>
          <div className="music-options">
            <button type="button" className="music-mode" aria-label={`${t("Playback mode")}: ${t(modeLabel)}`} disabled={!currentTrack} onClick={changeMode}><span aria-hidden="true">{mode === "shuffle" ? "⤨" : "↻"}{mode === "repeat-one" && <sup>1</sup>}</span>{t(modeLabel)}</button>
            <div className="bgm-volume"><button type="button" className="music-icon-button music-mute" aria-label={t(muted || volume === 0 ? "Unmute music" : "Mute music")} aria-pressed={muted || volume === 0} onClick={() => { if (volume === 0) setVolume(35); setMuted(volume === 0 ? false : !muted); }}><PlayerIcon kind="volume" />{(muted || volume === 0) && <span aria-hidden="true">×</span>}</button><label><span className="sr-only">{t("Music volume")}</span><input type="range" min="0" max="100" step="1" value={volume} aria-valuetext={`${volume}%`} onChange={event => { setVolume(Number(event.target.value)); setMuted(false); }} /></label></div>
          </div>
        </div>
        <div className="music-playlist-heading"><h3>{t("PLAYLIST")}</h3><span>{tracks.length} {t(tracks.length === 1 ? "track" : "tracks")}</span></div>
        <label className="music-search"><PlayerIcon kind="search" /><span className="sr-only">{t("Search songs")}</span><input type="search" placeholder={t("Search songs")} value={search} onChange={event => setSearch(event.target.value)} /></label>
        <ol className="music-track-list" aria-label={t("PLAYLIST")}>
          {filteredTracks.map(({ track, index }) => <li key={track.id}><button type="button" className="music-track" aria-current={index === currentIndex ? "true" : undefined} aria-label={`${t("Play track")}: ${t(track.title)}`} onClick={() => selectTrack(index)}><span className="music-track-number" aria-hidden="true">{index === currentIndex && playing ? "►" : String(index + 1).padStart(2, "0")}</span><span className="music-track-copy"><span>{t(track.title)}</span>{track.performer && <small>{t(track.performer)}</small>}</span><span className="music-track-arrow" aria-hidden="true">↗</span></button></li>)}
        </ol>
        {!filteredTracks.length && <p className="music-empty">{t(tracks.length ? "No songs match your search." : "Recordings will appear here when added.")}</p>}
        <footer className="music-panel-footer"><span className="music-status-dot" aria-hidden="true" /><span>{t(loading ? "LOADING" : playing ? "PLAYING" : "Ready when you are")}</span><span aria-hidden="true">HL / 01</span></footer>
      </section>
      {!open && <span className="sr-only" role="status">{error ? t("Music unavailable. Press play to retry.") : ""}</span>}
    </div>
  );
}
