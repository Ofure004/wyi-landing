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
  category?: string;
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

// A video is treated as a Short when its real duration is <= 180s, or when its
// URL is an explicit /shorts/ link. We intentionally avoid title-based guessing
// (e.g. matching "short" in a word) which produced false positives/negatives.
const SHORT_MAX_SECONDS = 180;

function isShort(
  durationSeconds: number | null | undefined,
  url: string | undefined
): boolean {
  if (typeof durationSeconds === "number" && durationSeconds <= SHORT_MAX_SECONDS)
    return true;
  if (url && url.toLowerCase().includes("/shorts/")) return true;
  return false;
}

function formatDuration(durationSeconds: number | null | undefined): string | null {
  if (typeof durationSeconds !== "number") return null;
  return `${Math.floor(durationSeconds / 60)}:${String(
    durationSeconds % 60
  ).padStart(2, "0")}`;
}

async function maybeEnrichSpotify(
  title: string,
  date: string | undefined,
  durationSeconds: number | null | undefined
) {
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    return enrichWithSpotify(
      title,
      date,
      typeof durationSeconds === "number" ? durationSeconds : undefined
    );
  }
  return null;
}

/**
 * Fetch the full episode catalogue via the YouTube Data API.
 *
 * Unlike the RSS feed (capped at the 15 most recent uploads), this reads the
 * channel's uploads playlist with pagination, so every episode is reachable.
 */
async function getEpisodesFromApi(): Promise<EpisodeItem[]> {
  const { getAllChannelUploads, getCategorizedVideos } = await import(
    "./youtube"
  );

  const [uploads, categorized] = await Promise.all([
    getAllChannelUploads(),
    getCategorizedVideos(),
  ]);

  const categoryById = new Map(categorized.map((v) => [v.id, v.category]));

  const toEpisode = async (
    video: any,
    category: string | undefined
  ): Promise<EpisodeItem> => {
    const spotify = await maybeEnrichSpotify(
      video.title || "",
      video.publishedAt,
      video.durationSeconds
    );
    const thumbnails = (video.thumbnails as any) || {};
    return {
      id: video.id,
      title: video.title || "",
      description: (video.description || "").slice(0, 300),
      publishedAt: video.publishedAt,
      thumbnail:
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url ||
        "",
      durationSeconds: video.durationSeconds ?? null,
      durationFormatted: formatDuration(video.durationSeconds),
      youtubeUrl: video.youtubeUrl,
      category,
      spotify,
    };
  };

  const seen = new Set<string>();
  const out: EpisodeItem[] = [];

  // 1) Channel uploads — drop only *uncategorized* Shorts. Anything curated
  // into a category playlist is kept regardless of length.
  for (const video of uploads) {
    if (seen.has(video.id)) continue;
    seen.add(video.id);

    const category = categoryById.get(video.id);
    if (!category && isShort(video.durationSeconds, video.youtubeUrl)) continue;

    out.push(await toEpisode(video, category));
  }

  // 2) Any categorized video not present in the uploads feed (e.g. a collab on
  // another channel). Included so each category's count mirrors its playlist.
  for (const video of categorized) {
    if (seen.has(video.id)) continue;
    seen.add(video.id);
    out.push(await toEpisode(video, video.category));
  }

  return out;
}

/**
 * Fetch episodes from the YouTube channel RSS feed. Used as a fallback before
 * a YOUTUBE_API_KEY is configured (or if the Data API call fails). Note: RSS is
 * limited by YouTube to the 15 most recent uploads.
 */
async function getEpisodesFromRss(): Promise<EpisodeItem[]> {
  const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
  const rssUrl =
    process.env.YOUTUBE_RSS_URL ||
    (channelId
      ? `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      : undefined);

  if (!rssUrl) {
    throw new Error(
      "No YouTube RSS URL configured and NEXT_PUBLIC_YOUTUBE_CHANNEL_ID is missing."
    );
  }

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

  const episodes = await Promise.all(
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
        (raw as any).ytDuration?.seconds || media["yt:duration"]?.[0]?.$.seconds;

      const durationSeconds = durationRaw
        ? Number.parseInt(String(durationRaw), 10)
        : undefined;

      const youtubeUrl =
        raw.link ||
        `https://www.youtube.com/watch?v=${encodeURIComponent(String(id))}`;

      // Filter out Shorts by real duration / explicit /shorts/ URL.
      if (isShort(durationSeconds, youtubeUrl)) return null;

      const spotify = await maybeEnrichSpotify(
        raw.title || "",
        raw.isoDate || raw.pubDate,
        durationSeconds
      );

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
        durationFormatted: formatDuration(durationSeconds),
        youtubeUrl,
        spotify,
      };

      return item;
    })
  );

  return episodes.filter(Boolean) as EpisodeItem[];
}

export async function getEpisodesGrouped(): Promise<EpisodeGroup[]> {
  // Prefer the YouTube Data API when a key is configured: it returns the full
  // catalogue (RSS is hard-capped at the 15 most recent uploads, leaving only a
  // handful of long-form episodes once Shorts are filtered out). Fall back to
  // RSS when the key is absent or the API call fails, so the site keeps working
  // before YOUTUBE_API_KEY is added.
  let episodes: EpisodeItem[] = [];

  const apiConfigured = Boolean(
    process.env.YOUTUBE_API_KEY && process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID
  );

  try {
    if (apiConfigured) {
      try {
        episodes = await getEpisodesFromApi();
      } catch (err) {
        console.error(
          "YouTube Data API fetch failed; falling back to RSS feed.",
          err
        );
        episodes = await getEpisodesFromRss();
      }
    } else {
      episodes = await getEpisodesFromRss();
    }
  } catch (err) {
    // No configured source (e.g. missing NEXT_PUBLIC_YOUTUBE_CHANNEL_ID on a
    // deploy preview) or a transient failure: render with no episodes rather
    // than crashing the whole page build. ISR revalidation fills these in once
    // a data source is reachable.
    console.error(
      "Episode fetch failed; rendering with no episodes for now.",
      err
    );
    episodes = [];
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
