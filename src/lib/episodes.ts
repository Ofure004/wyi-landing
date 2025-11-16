/* eslint-disable @typescript-eslint/no-explicit-any */
import Parser from "rss-parser";
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

function isLikelyShortFromRss(raw: any, durationSeconds?: number) {
  const title = (raw.title || "").toLowerCase();
  const link = (raw.link || "").toLowerCase();

  if (typeof durationSeconds === "number" && durationSeconds < 120) return true;
  if (title.includes("#shorts") || title.includes("shorts")) return true;
  if (link.includes("/shorts/")) return true;

  return false;
}

export async function getEpisodesGrouped(): Promise<EpisodeGroup[]> {
  // Prefer fetching episodes from the YouTube RSS feed to avoid YouTube API
  // quota limits. We fall back to the Data API only if RSS is not configured.
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const rssUrl =
    process.env.YOUTUBE_RSS_URL ||
    (channelId
      ? `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      : undefined);

  let episodes: EpisodeItem[] = [];

  if (rssUrl) {
    const parser = new Parser<any>({
      customFields: {
        item: [
          ["media:group", "media", { keepArray: true }],
          ["yt:videoId", "ytVideoId"],
          ["yt:duration", "ytDuration"],
        ],
      },
    });
    const feed = await parser.parseURL(rssUrl);

    const items = feed.items || [];

    episodes = await Promise.all(
      items.map(async (raw: any) => {
        const id =
          raw.ytVideoId ||
          raw.id ||
          raw.guid ||
          (raw.link ? new URL(raw.link).searchParams.get("v") : undefined);

        if (!id) return null;

        const media = (raw as any).media?.[0] || {};

        const thumbEntry = media["media:thumbnail"]?.[0];
        const thumbnail = thumbEntry?.$.url || raw.enclosure?.url || "";

        const durationRaw =
          (raw as any).ytDuration?.seconds ||
          media["yt:duration"]?.[0]?.$.seconds;

        const durationSeconds = durationRaw
          ? Number.parseInt(String(durationRaw), 10)
          : undefined;

        // Filter out shorts using duration + heuristics.
        if (isLikelyShortFromRss(raw, durationSeconds)) return null;

        let spotify = null;
        if (
          process.env.SPOTIFY_CLIENT_ID &&
          process.env.SPOTIFY_CLIENT_SECRET
        ) {
          spotify = await enrichWithSpotify(raw.title || "");
        }

        const item: EpisodeItem = {
          id: String(id),
          title: raw.title || "",
          description: (
            raw.contentSnippet ||
            media["media:description"]?.[0]?._ ||
            raw.content ||
            ""
          ).slice(0, 300),
          publishedAt: raw.isoDate || raw.pubDate,
          thumbnail,
          durationSeconds: durationSeconds ?? null,
          durationFormatted:
            typeof durationSeconds === "number"
              ? `${Math.floor(durationSeconds / 60)}:${String(
                  durationSeconds % 60
                ).padStart(2, "0")}`
              : null,
          youtubeUrl:
            raw.link ||
            `https://www.youtube.com/watch?v=${encodeURIComponent(String(id))}`,
          spotify,
        };

        return item;
      })
    ).then((arr) => arr.filter(Boolean) as EpisodeItem[]);
  } else {
    // Fallback: use the YouTube Data API (will consume quota).
    if (process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID) {
      const { getChannelVideos, getVideosDetails, isLikelyShort } =
        await import("./youtube");

      const channelVideos = await getChannelVideos();

      const seen = new Set<string>();
      const unique = channelVideos.filter((v) => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });

      const ids = unique.map((u) => u.id);
      const detailsMap = await getVideosDetails(ids);

      episodes = await Promise.all(
        unique.map(async (u) => {
          const det = detailsMap[u.id] || {};
          const video: any = {
            id: u.id,
            title: (det as any).title ?? u.title,
            description: (det as any).description ?? u.description,
            publishedAt: (det as any).publishedAt ?? u.publishedAt,
            thumbnails: (det as any).thumbnails ?? u.thumbnails,
            durationISO: (det as any).durationISO,
            durationSeconds: (det as any).durationSeconds,
            youtubeUrl: u.youtubeUrl,
          };

          if (isLikelyShort(video)) return null;

          let spotify = null;
          if (
            process.env.SPOTIFY_CLIENT_ID &&
            process.env.SPOTIFY_CLIENT_SECRET
          ) {
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
      ).then((arr) => arr.filter(Boolean) as EpisodeItem[]);
    } else {
      throw new Error(
        "No YouTube RSS URL configured and YOUTUBE_API_KEY/YOUTUBE_CHANNEL_ID are missing."
      );
    }
  }

  const filtered = episodes.sort((a, b) => {
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
