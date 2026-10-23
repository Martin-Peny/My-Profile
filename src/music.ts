export type MusicTrack = {
  id: string;
  title: string;
  src: string;
  performer?: string;
  cover?: string;
};

// Add recordings here in the order they should appear in the playlist.
export const musicTracks: MusicTrack[] = [
  { id: "background-music", title: "Background music", src: "audio/background-music.mp3" },
];

export function musicAssetUrl(path: string): string {
  return /^(https?:|blob:|data:)/i.test(path)
    ? path
    : `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}
