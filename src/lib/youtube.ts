// lib/youtube.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

// Read config lazily so importing this module never throws at load time.
// Callers that need the API guard via these helpers and surface a clear error
// only when the API is actually used.
function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("Missing YOUTUBE_API_KEY in env");
  return key;
}

function getChannelId(): string {
  const id = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
  if (!id) throw new Error("Missing NEXT_PUBLIC_YOUTUBE_CHANNEL_ID in env");
  return id;
}

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
  const key = getApiKey();
  const channelId = getChannelId();
  let pageToken = "";
  do {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&type=video&order=date&key=${key}${
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
  const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${getChannelId()}&maxResults=50&key=${getApiKey()}`;
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
  const key = getApiKey();
  const items: YTVideo[] = [];
  let pageToken = "";
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${key}${
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

  const key = getApiKey();
  for (const chunk of chunks) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${chunk.join(
      ","
    )}&key=${key}`;
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
 * Get the full uploads catalogue for the channel, enriched with durations.
 *
 * Every YouTube channel has a special "uploads" playlist whose id is the
 * channel id with the leading `UC` swapped for `UU`. Reading that playlist via
 * playlistItems (with pagination) returns the *entire* upload history rather
 * than the 15-item cap of the RSS feed, and costs only ~2-3 quota units per
 * refresh (1 unit per playlistItems page + 1 per videos detail chunk).
 */
export async function getAllChannelUploads(): Promise<YTVideo[]> {
  const channelId = getChannelId();
  if (!channelId.startsWith("UC")) {
    throw new Error(
      `Expected a channel id starting with "UC", got "${channelId}"`
    );
  }
  const uploadsPlaylistId = `UU${channelId.slice(2)}`;

  const items = await getPlaylistItems(uploadsPlaylistId);

  // Enrich with real durations (and richer snippet data) so callers can filter
  // Shorts by actual length rather than guessing from titles.
  const detailsMap = await getVideosDetails(items.map((it) => it.id));

  return items.map((it) => {
    const det = detailsMap[it.id] || {};
    return {
      ...it,
      durationISO: det.durationISO ?? it.durationISO,
      durationSeconds: det.durationSeconds ?? it.durationSeconds,
      thumbnails: det.thumbnails ?? it.thumbnails,
    };
  });
}

/**
 * Canonical episode categories. A YouTube playlist is treated as a category
 * when its title matches one of these (case/spacing-insensitive).
 */
export const EPISODE_CATEGORIES = [
  "Career",
  "Entertainment",
  "Entrepreneurship",
  "Sustainability",
] as const;
export type EpisodeCategory = (typeof EPISODE_CATEGORIES)[number];

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

export type CategorizedVideo = YTVideo & { category: EpisodeCategory };

/**
 * Return every video that belongs to a category playlist, tagged with its
 * category and enriched with durations.
 *
 * Only playlists whose (normalized) title matches one of EPISODE_CATEGORIES are
 * considered, so the on-site category lists/counts mirror the real YouTube
 * playlists exactly. Failures degrade gracefully to an empty list (the UI then
 * shows no filters). Quota: 1 unit for the playlists listing + 1 per matched
 * playlist page + 1 per 50 videos for duration enrichment.
 */
export async function getCategorizedVideos(): Promise<CategorizedVideo[]> {
  let playlists: YTPlaylist[];
  try {
    playlists = await getPlaylists();
  } catch {
    return [];
  }

  const catLookup = EPISODE_CATEGORIES.map((label) => ({
    key: normalizeTitle(label),
    label,
  }));

  // First matching playlist wins if a video appears in several.
  const byId = new Map<string, CategorizedVideo>();
  for (const pl of playlists) {
    const match = catLookup.find((c) =>
      normalizeTitle(pl.title).includes(c.key)
    );
    if (!match) continue;
    try {
      const items = await getPlaylistItems(pl.id);
      for (const it of items) {
        if (!byId.has(it.id)) byId.set(it.id, { ...it, category: match.label });
      }
    } catch {
      // ignore a single failing playlist and keep going
    }
  }

  // Enrich with real durations (playlistItems doesn't include them).
  const ids = [...byId.keys()];
  if (ids.length) {
    const details = await getVideosDetails(ids);
    for (const id of ids) {
      const det = details[id];
      const v = byId.get(id)!;
      if (det) {
        v.durationISO = det.durationISO ?? v.durationISO;
        v.durationSeconds = det.durationSeconds ?? v.durationSeconds;
        v.thumbnails = det.thumbnails ?? v.thumbnails;
        if (!v.title && det.title) v.title = det.title;
      }
    }
  }

  return [...byId.values()];
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
