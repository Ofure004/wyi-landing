// lib/youtube.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

const YT_KEY = process.env.YOUTUBE_API_KEY!;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID!;

if (!YT_KEY) throw new Error("Missing YOUTUBE_API_KEY in env");
if (!CHANNEL_ID) throw new Error("Missing YOUTUBE_CHANNEL_ID in env");

export type YTPlaylist = {
  id: string;
  title: string;
  description?: string;
};

export type YTVideo = {
  id: string;
  title: string;
  description?: string;
  publishedAt?: string;
  thumbnails: {
    default?: { url: string; width?: number; height?: number };
    medium?: { url: string; width?: number; height?: number };
    high?: { url: string; width?: number; height?: number };
    standard?: { url: string; width?: number; height?: number };
  };
  durationISO?: string; // ISO 8601
  durationSeconds?: number;
  youtubeUrl: string;
};

function iso8601DurationToSeconds(iso: string): number {
  // crude ISO8601 duration parser (PT#H#M#S)
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] ?? "0", 10);
  const mm = parseInt(m[2] ?? "0", 10);
  const s = parseInt(m[3] ?? "0", 10);
  return h * 3600 + mm * 60 + s;
}

async function fetchJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`YouTube fetch failed: ${r.status} ${r.statusText} ${txt}`);
  }
  return (await r.json()) as any;
}

/**
 * List all videos on the channel (newest first) using the search endpoint.
 * Returns an array of lightweight video objects (id, title, description, publishedAt, thumbnails, youtubeUrl)
 */
export async function getChannelVideos(): Promise<
  {
    id: string;
    title: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: any;
    youtubeUrl: string;
  }[]
> {
  const out: {
    id: string;
    title: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: any;
    youtubeUrl: string;
  }[] = [];
  let pageToken = "";
  do {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&type=video&order=date&key=${YT_KEY}${
      pageToken ? `&pageToken=${pageToken}` : ""
    }`;
    const json = await fetchJson(url);
    for (const it of json.items || []) {
      const vid = it.id?.videoId;
      if (!vid) continue;
      out.push({
        id: vid,
        title: it.snippet?.title,
        description: it.snippet?.description,
        publishedAt: it.snippet?.publishedAt,
        thumbnails: it.snippet?.thumbnails ?? {},
        youtubeUrl: `https://www.youtube.com/watch?v=${vid}`,
      });
    }
    pageToken = json.nextPageToken ?? "";
  } while (pageToken);
  return out;
}

/**
 * Get playlists for the channel (public playlists).
 */
export async function getPlaylists(): Promise<YTPlaylist[]> {
  const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&key=${YT_KEY}`;
  const json = await fetchJson(url);
  return (json.items || []).map((it: any) => ({
    id: it.id,
    title: it.snippet.title,
    description: it.snippet.description,
  }));
}

/**
 * Get items for a playlist (paginated); returns array of video ids + snippet metadata
 */
export async function getPlaylistItems(playlistId: string): Promise<YTVideo[]> {
  const items: YTVideo[] = [];
  let pageToken = "";
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${YT_KEY}${
      pageToken ? `&pageToken=${pageToken}` : ""
    }`;
    const json = await fetchJson(url);
    for (const it of json.items || []) {
      // item.snippet.resourceId.videoId
      const vid = it.snippet.resourceId?.videoId;
      if (!vid) continue;
      items.push({
        id: vid,
        title: it.snippet.title,
        description: it.snippet.description,
        publishedAt: it.snippet.publishedAt,
        thumbnails: it.snippet.thumbnails ?? {},
        youtubeUrl: `https://www.youtube.com/watch?v=${vid}`,
      });
    }
    pageToken = json.nextPageToken ?? "";
  } while (pageToken);
  return items;
}

/**
 * Fetch video details (contentDetails contains duration ISO)
 * Accepts up to 50 ids per call.
 */
export async function getVideosDetails(
  videoIds: string[]
): Promise<Record<string, Partial<YTVideo>>> {
  const out: Record<string, Partial<YTVideo>> = {};
  if (!videoIds.length) return out;

  // chunk in 50s
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${chunk.join(
      ","
    )}&key=${YT_KEY}`;
    const json = await fetchJson(url);
    for (const v of json.items || []) {
      const durISO = v.contentDetails?.duration;
      const durSec = durISO ? iso8601DurationToSeconds(durISO) : undefined;
      out[v.id] = {
        durationISO: durISO,
        durationSeconds: durSec,
        thumbnails: v.snippet?.thumbnails ?? {},
        title: v.snippet?.title,
        description: v.snippet?.description,
        publishedAt: v.snippet?.publishedAt,
        youtubeUrl: `https://www.youtube.com/watch?v=${v.id}`,
      };
    }
  }
  return out;
}

/**
 * Heuristic: is this a short?
 * - durationSeconds < 60 OR
 * - thumbnail vertical (height > width where available) OR
 * - title contains '#shorts' or 'shorts'
 */
export function isLikelyShort(video: YTVideo | Partial<YTVideo>) {
  const t = (video.title || "").toLowerCase();
  if (t.includes("#shorts") || t.includes("shorts") || t.includes(" short "))
    return true;
  if (video.youtubeUrl && video.youtubeUrl.includes("/shorts/")) return true;

  if (typeof video.durationSeconds === "number" && video.durationSeconds < 120)
    return true;

  // check thumbnails for vertical
  const thumbs = video.thumbnails ?? {};
  const any = thumbs.high ?? thumbs.medium ?? thumbs.default;
  if (any?.height && any?.width && any.height > any.width) return true;

  return false;
}
