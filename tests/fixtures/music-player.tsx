import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import BackgroundMusic from "../../src/BackgroundMusic";
import { LanguageProvider, LanguageSwitch } from "../../src/i18n";
import type { MusicTrack } from "../../src/music";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "../../src/styles.css";

const params = new URLSearchParams(location.search);
const count = Number(params.get("count") ?? 3);
const tracks: MusicTrack[] = Array.from({ length: count }, (_, index) => ({
  id: `fixture-${index}`,
  title: index === 0 ? "Background music" : `Fixture song ${String(index + 1).padStart(2, "0")}${index === 2 ? " — A long recording title for responsive playlist testing 很长的测试歌曲标题" : ""}`,
  src: params.has("broken") && index === 0 ? "audio/missing-fixture.mp3" : `audio/background-music.mp3?fixture=${index}`,
  performer: index === 0 ? undefined : "Haoyang Ling",
  cover: index === 1 ? "images/logo.webp" : undefined,
}));

function Fixture() {
  const [playing, setPlaying] = useState(false);
  return <><div style={{ padding: 20 }}><LanguageSwitch /><a style={{ margin: 20 }} href="#destination">Outside navigation</a><p id="destination">Player fixture</p><span data-testid="playing-state" aria-hidden="true">{String(playing)}</span></div><BackgroundMusic tracks={tracks} onPlayingChange={setPlaying} /></>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><LanguageProvider><Fixture /></LanguageProvider></React.StrictMode>);
