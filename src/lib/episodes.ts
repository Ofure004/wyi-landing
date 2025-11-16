/* eslint-disable @typescript-eslint/no-explicit-any */
import { getVideosDetails, isLikelyShort, YTVideo } from "@/lib/youtube";
import { enrichWithSpotify } from "@/lib/spotify";

export type EpisodeItem = {
  id: string;
  title: string;
  description: string;
  publishedAt?: string;
  thumbnail: string;
  durationSeconds: number | null;
  durationFormatted: string | null;
  youtubeUrl: string;
  spotify: {
    spotifyUrl?: string;
    durationMs?: number;
    spotifyId?: string;
  } | null;
};

export type EpisodeGroup = {
  playlistId: string;
  playlistTitle: string;
  episodes: EpisodeItem[];
};

export async function getEpisodesGrouped(): Promise<EpisodeGroup[]> {
  // Fetch all channel videos (newest first) to avoid playlist duplicates/missing items
  const { getChannelVideos } = await import("./youtube"); // dynamic import to avoid cycles
  const channelVideos = await getChannelVideos();

  // de-duplicate by id (just in case) and preserve order from API (newest-first)
  const seen = new Set<string>();
  const unique = channelVideos.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  const ids = unique.map((u) => u.id);
  const detailsMap = await getVideosDetails(ids);

  const episodes = await Promise.all(
    unique.map(async (u) => {
      const det = detailsMap[u.id] || {};
      const video: YTVideo = {
        id: u.id,
        title: (det as any).title ?? u.title,
        description: (det as any).description ?? u.description,
        publishedAt: (det as any).publishedAt ?? u.publishedAt,
        thumbnails: (det as any).thumbnails ?? u.thumbnails,
        durationISO: (det as any).durationISO,
        durationSeconds: (det as any).durationSeconds,
        youtubeUrl: u.youtubeUrl,
      } as any;

      // filter shorts
      if (isLikelyShort(video)) return null;

      let spotify = null;
      if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
        spotify = await enrichWithSpotify(video.title || "");
      }

      const item: EpisodeItem = {
        id: video.id,
        title: video.title,
        description: (video.description || "").slice(0, 300),
        publishedAt: video.publishedAt,
        thumbnail:
          (video.thumbnails as any)?.high?.url ||
          (video.thumbnails as any)?.medium?.url ||
          (video.thumbnails as any)?.default?.url ||
          "",
        durationSeconds: video.durationSeconds ?? null,
        durationFormatted:
          typeof video.durationSeconds === "number"
            ? `${Math.floor(video.durationSeconds / 60)}:${String(
                video.durationSeconds % 60
              ).padStart(2, "0")}`
            : null,
        youtubeUrl: video.youtubeUrl,
        spotify,
      };
      return item;
    })
  );

  const filtered = (episodes.filter(Boolean) as EpisodeItem[]).sort((a, b) => {
    const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bt - at;
  });

  return [
    {
      playlistId: "all",
      playlistTitle: "All Episodes",
      episodes: filtered,
    },
  ];
}
