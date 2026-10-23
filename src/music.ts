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
  {
    id: "chong-bai",
    title: "崇拜",
    src: "https://linghaoyang.oss-cn-beijing.aliyuncs.com/%E5%B4%87%E6%8B%9C%20Martin.wav",
  },
  {
    id: "qu-bei-ji-wang-ji-ni",
    title: "去北极忘记你",
    src: "https://linghaoyang.oss-cn-beijing.aliyuncs.com/%E5%8E%BB%E5%8C%97%E6%9E%81%E5%BF%98%E8%AE%B0%E4%BD%A0%20Martin.wav",
  },
  {
    id: "shui-xing-ji",
    title: "水星记",
    src: "https://linghaoyang.oss-cn-beijing.aliyuncs.com/%E6%B0%B4%E6%98%9F%E8%AE%B0%20Martin.wav",
  },
  {
    id: "yong-bei-ji-chang-qing-ge",
    title: "用背脊唱情歌",
    src: "https://linghaoyang.oss-cn-beijing.aliyuncs.com/%E7%94%A8%E8%83%8C%E8%84%8A%E5%94%B1%E6%83%85%E6%AD%8C%20Martin.wav",
  },
];

export function musicAssetUrl(path: string): string {
  return /^(https?:|blob:|data:)/i.test(path)
    ? path
    : `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}
