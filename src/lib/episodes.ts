/* eslint-disable @typescript-eslint/no-explicit-any */
import Parser from "rss-parser";

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
    name?: string;
  } | null;
  apple: {
    appleUrl?: string;
    trackId?: number;
    trackName?: string;
  } | null;
};

export type EpisodeGroup = {
  playlistId: string;
  playlistTitle: string;
  episodes: EpisodeItem[];
};

/* ---------- Configuration / Helpers ---------- */

const RSS_ITEM_SHORT_MAX_SECONDS = 120;
const DURATION_CLOSE_THRESHOLD_SECONDS = 15; // ±15s tolerance for matching audio durations
const DATE_CLOSE_DAYS = 2; // consider dates close if within ±2 days

function normalize(s?: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleSimilarity(a?: string, b?: string) {
  const na = normalize(a).split(" ");
  const nb = normalize(b).split(" ");
  if (!na.length || !nb.length) return 0;
  const aSet = new Set(na);
  const common = nb.filter((w) => aSet.has(w)).length;
  return common / Math.max(na.length, nb.length); // 0..1
}

function datesClose(d1?: string, d2?: string) {
  if (!d1 || !d2) return false;
  const t1 = Date.parse(d1);
  const t2 = Date.parse(d2);
  if (Number.isNaN(t1) || Number.isNaN(t2)) return false;
  const diffDays = Math.abs(t1 - t2) / (1000 * 3600 * 24);
  return diffDays <= DATE_CLOSE_DAYS;
}

function durationCloseSeconds(aMs?: number, bSec?: number) {
  if (typeof aMs !== "number" || typeof bSec !== "number") return false;
  const diff = Math.abs(aMs / 1000 - bSec);
  return diff <= DURATION_CLOSE_THRESHOLD_SECONDS;
}

function formatDuration(seconds?: number | null) {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ---------- Short detection (RSS) ---------- */

function isLikelyShortFromRss(raw: any, durationSeconds?: number) {
  const title = (raw.title || "").toLowerCase();
  const link = (raw.link || "").toLowerCase();

  if (
    typeof durationSeconds === "number" &&
    durationSeconds < RSS_ITEM_SHORT_MAX_SECONDS
  )
    return true;
  if (title.includes("#shorts") || title.includes("shorts")) return true;
  if (link.includes("/shorts/")) return true;

  return false;
}

/* ---------- Spotify helpers ---------- */

async function getSpotifyAccessToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;
  const tokenUrl = "https://accounts.spotify.com/api/token";
  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(id + ":" + secret).toString(
        "base64"
      )}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!resp.ok) return null;
  const json = await resp.json();
  return json.access_token ?? null;
}

type SpotifyEpisodeCandidate = {
  id: string;
  name: string;
  description?: string;
  release_date?: string;
  duration_ms?: number;
  external_urls?: { spotify?: string };
};

async function searchSpotifyEpisodes(query: string, token: string) {
  // We'll search episodes and shows (cover both). Use episode search first.
  const q = encodeURIComponent(query);
  const urlEp = `https://api.spotify.com/v1/search?q=${q}&type=episode,show&limit=10`;
  const resp = await fetch(urlEp, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) return { episodes: [], shows: [] };
  const json = await resp.json();
  return {
    episodes: (json.episodes?.items as SpotifyEpisodeCandidate[]) || [],
    shows: (json.shows?.items as any) || [],
  };
}

/* ---------- Apple (iTunes) helpers ---------- */

type AppleEpisodeCandidate = {
  trackId?: number;
  trackName?: string;
  trackViewUrl?: string;
  releaseDate?: string;
  trackTimeMillis?: number;
};

async function searchAppleEpisodes(podcastTitleOrEpisodeTitle: string) {
  const q = encodeURIComponent(podcastTitleOrEpisodeTitle);
  const url = `https://itunes.apple.com/search?term=${q}&entity=podcastEpisode&limit=20`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const json = await resp.json();
  return (json.results as AppleEpisodeCandidate[]) || [];
}

/* ---------- Matching / scoring ---------- */

function scoreSpotifyCandidate(
  candidate: SpotifyEpisodeCandidate,
  rssEpisode: Partial<EpisodeItem>
) {
  let score = 0;

  // title similarity (0..1) scaled to 0..50
  const tSim = titleSimilarity(candidate.name, rssEpisode.title);
  score += tSim * 50;

  // description match
  if (candidate.description && rssEpisode.description) {
    const ds = titleSimilarity(candidate.description, rssEpisode.description);
    score += Math.min(ds * 25, 25);
  }

  // release date close
  if (datesClose(candidate.release_date, rssEpisode.publishedAt)) {
    score += 15;
  }

  // duration close
  if (
    durationCloseSeconds(
      candidate.duration_ms,
      rssEpisode.durationSeconds ?? undefined
    )
  ) {
    score += 20;
  }

  // small boost for exact title substring or exact id match
  if (normalize(candidate.name) === normalize(rssEpisode.title)) score += 20;
  return score;
}

function scoreAppleCandidate(
  candidate: AppleEpisodeCandidate,
  rssEpisode: Partial<EpisodeItem>
) {
  let score = 0;
  const tSim = titleSimilarity(candidate.trackName, rssEpisode.title);
  score += tSim * 60;
  if (
    candidate.releaseDate &&
    rssEpisode.publishedAt &&
    datesClose(candidate.releaseDate, rssEpisode.publishedAt)
  )
    score += 20;
  if (
    candidate.trackTimeMillis &&
    typeof rssEpisode.durationSeconds === "number"
  ) {
    if (
      durationCloseSeconds(
        candidate.trackTimeMillis,
        rssEpisode.durationSeconds
      )
    )
      score += 20;
  }
  return score;
}

/* ---------- RSS parsing ---------- */

async function fetchEpisodesFromRss(rssUrl: string): Promise<EpisodeItem[]> {
  const parser = new Parser<any>({
    customFields: {
      item: [
        ["media:group", "media", { keepArray: true }],
        ["yt:videoId", "ytVideoId"],
        ["yt:duration", "ytDuration"],
        ["itunes:duration", "itunesDuration"],
      ],
    },
  });

  const feed = await parser.parseURL(rssUrl);
  const items = feed.items || [];

  const episodes = await Promise.all(
    items.map(async (raw: any): Promise<EpisodeItem | null> => {
      try {
        const id =
          raw.ytVideoId ||
          raw.id ||
          raw.guid ||
          (raw.link
            ? new URL(String(raw.link)).searchParams.get("v")
            : undefined) ||
          (raw.enclosure?.url ?? ""); // fallback to enclosure

        if (!id) return null;

        const media = (raw as any).media?.[0] || {};
        const thumbEntry = media["media:thumbnail"]?.[0];
        const thumbnail =
          thumbEntry?.$.url || raw.itunes?.image || raw.enclosure?.url || "";

        // duration: attempt multiple possible fields
        let durationSeconds: number | undefined;
        if (raw.ytDuration?.seconds) {
          durationSeconds = Number.parseInt(String(raw.ytDuration.seconds), 10);
        } else if (raw.itunesDuration) {
          // itunes duration might be "MM:SS" or "HH:MM:SS"
          const parts = String(raw.itunesDuration).split(":").map(Number);
          if (parts.length === 3)
            durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          else if (parts.length === 2)
            durationSeconds = parts[0] * 60 + parts[1];
          else durationSeconds = parts[0];
        } else if (raw.duration) {
          durationSeconds = Number(raw.duration);
        }

        // filter shorts
        if (isLikelyShortFromRss(raw, durationSeconds)) return null;

        const publishedAt = raw.isoDate || raw.pubDate || raw.publishedAt;

        const item: EpisodeItem = {
          id: String(id),
          title: raw.title || "",
          description: (
            raw.contentSnippet ||
            media["media:description"]?.[0]?._ ||
            raw.content ||
            raw.itunes?.summary ||
            ""
          ).slice(0, 1000),
          publishedAt,
          thumbnail,
          durationSeconds:
            typeof durationSeconds === "number" ? durationSeconds : null,
          durationFormatted: formatDuration(
            typeof durationSeconds === "number" ? durationSeconds : null
          ),
          youtubeUrl:
            raw.link ||
            `https://www.youtube.com/watch?v=${encodeURIComponent(String(id))}`,
          spotify: null,
          apple: null,
        };

        return item;
      } catch (err) {
        // swallow one bad item but continue
        console.warn("Failed to parse RSS item", err);
        return null;
      }
    })
  );

  return episodes.filter(Boolean) as EpisodeItem[];
}

/* ---------- Complete enrichment flow ---------- */

export async function getEpisodesGrouped(): Promise<EpisodeGroup[]> {
  const rssUrl = process.env.YOUTUBE_RSS_URL || process.env.PODCAST_RSS_URL;
  if (!rssUrl) {
    throw new Error(
      "No RSS URL configured. Set YOUTUBE_RSS_URL or PODCAST_RSS_URL environment variable."
    );
  }

  // 1) Get episodes from RSS
  const episodes = await fetchEpisodesFromRss(rssUrl);

  // 2) Try to enrich with Spotify and Apple
  // We'll fetch a token once and reuse
  const spotifyToken = await getSpotifyAccessToken();

  // Limit concurrency a bit
  const concurrency = 6;
  const out: EpisodeItem[] = [];
  for (let i = 0; i < episodes.length; i += concurrency) {
    const slice = episodes.slice(i, i + concurrency);
    const promises = slice.map(async (ep) => {
      // Spotify enrichment (if available)
      try {
        if (spotifyToken) {
          const searchQuery = `${ep.title} ${ep.publishedAt ?? ""}`.trim();
          const { episodes: sEpList } = await searchSpotifyEpisodes(
            searchQuery,
            spotifyToken
          );

          // Score each candidate
          let best: SpotifyEpisodeCandidate | null = null;
          let bestScore = 0;
          for (const cand of sEpList) {
            const sc = scoreSpotifyCandidate(cand, ep);
            if (sc > bestScore) {
              bestScore = sc;
              best = cand;
            }
          }

          if (best && bestScore >= 50) {
            ep.spotify = {
              spotifyUrl: best.external_urls?.spotify || `https://open.spotify.com/episode/${best.id}`,
              durationMs: best.duration_ms,
              spotifyId: best.id,
              name: best.name,
            };
          } else {
            ep.spotify = null;
          }
        }
      } catch (err) {
        console.warn("Spotify enrichment failed for", ep.title, err);
        ep.spotify = null;
      }

      // Apple enrichment (no auth)
      try {
        const appleCandidates = await searchAppleEpisodes(`${ep.title}`);
        let best: AppleEpisodeCandidate | null = null;
        let bestScore = 0;
        for (const cand of appleCandidates) {
          const sc = scoreAppleCandidate(cand, ep);
          if (sc > bestScore) {
            bestScore = sc;
            best = cand;
          }
        }
        if (best && bestScore >= 50) {
          ep.apple = {
            appleUrl: best.trackViewUrl,
            trackId: best.trackId,
            trackName: best.trackName,
          };
        } else {
          ep.apple = null;
        }
      } catch (err) {
        console.warn("Apple enrichment failed for", ep.title, err);
        ep.apple = null;
      }
      return ep;
    });

    const resolved = await Promise.all(promises);
    out.push(...resolved);
  }

  // 3) Sort newest -> oldest
  const filtered = out.sort((a, b) => {
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
