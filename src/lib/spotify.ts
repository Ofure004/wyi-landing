// lib/spotify.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SHOW_ID = process.env.NEXT_PUBLIC_SPOTIFY_SHOW_ID;

export type SpotifyEpisodeInfo = {
  spotifyUrl?: string;
  durationMs?: number;
  spotifyId?: string;
};

type SpotifyEpisode = {
  id: string;
  name: string;
  description: string;
  release_date: string;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
};

// In-memory cache with 2-hour expiration
let cachedEpisodes: SpotifyEpisode[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 120 * 1000; // 2 hours

async function getSpotifyToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET)
    throw new Error("Missing SPOTIFY_CLIENT_ID/SECRET");

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error("Failed to get spotify token");
  const j = (await r.json()) as { access_token: string };
  return j.access_token as string;
}

/**
 * Fetch ALL episodes from the Spotify show (with pagination)
 */
async function getAllShowEpisodes(): Promise<SpotifyEpisode[]> {
  if (!SHOW_ID) {
    console.warn("NEXT_PUBLIC_SPOTIFY_SHOW_ID not configured");
    return [];
  }

  // Check in-memory cache
  const now = Date.now();
  if (cachedEpisodes && now - cacheTimestamp < CACHE_DURATION) {
    return cachedEpisodes;
  }

  const token = await getSpotifyToken();
  const allEpisodes: SpotifyEpisode[] = [];
  let url:
    | string
    | null = `https://api.spotify.com/v1/shows/${SHOW_ID}/episodes?limit=50`;

  while (url) {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!r.ok) {
      console.error("Failed to fetch Spotify episodes:", await r.text());
      break;
    }

    const j = (await r.json()) as {
      items: SpotifyEpisode[];
      next: string | null;
    };

    allEpisodes.push(...j.items);
    url = j.next;
  }

  // Update in-memory cache
  cachedEpisodes = allEpisodes;
  cacheTimestamp = now;

  return allEpisodes;
}

/**
 * Match a YouTube episode to its Spotify counterpart by publish date and duration
 */
export async function enrichWithSpotify(
  title: string,
  publishedAt?: string,
  durationSeconds?: number
): Promise<SpotifyEpisodeInfo | null> {
  if (!CLIENT_ID || !CLIENT_SECRET || !SHOW_ID) return null;

  try {
    const spotifyEpisodes = await getAllShowEpisodes();

    if (!spotifyEpisodes.length) return null;

    // Strategy 1: Match by publish date (most reliable)
    if (publishedAt) {
      const ytDate = new Date(publishedAt).toISOString().split("T")[0]; // YYYY-MM-DD

      const dateMatches = spotifyEpisodes.filter((ep) => {
        const spotifyDate = ep.release_date; // Already in YYYY-MM-DD format
        return spotifyDate === ytDate;
      });

      // If we have date matches, narrow down by duration if available
      if (dateMatches.length === 1) {
        const match = dateMatches[0];
        return {
          spotifyUrl: match.external_urls.spotify,
          durationMs: match.duration_ms,
          spotifyId: match.id,
        };
      }

      if (dateMatches.length > 1 && durationSeconds) {
        // Multiple episodes on same day, use duration to disambiguate
        const ytDurationMs = durationSeconds * 1000;
        const closestMatch = dateMatches.reduce((closest, ep) => {
          const currentDiff = Math.abs(ep.duration_ms - ytDurationMs);
          const closestDiff = Math.abs(closest.duration_ms - ytDurationMs);
          return currentDiff < closestDiff ? ep : closest;
        });

        // Only return if duration is within 10 seconds (10000ms)
        if (Math.abs(closestMatch.duration_ms - ytDurationMs) < 10000) {
          return {
            spotifyUrl: closestMatch.external_urls.spotify,
            durationMs: closestMatch.duration_ms,
            spotifyId: closestMatch.id,
          };
        }
      }
    }

    // Strategy 2: Fallback to duration matching only (less reliable)
    if (durationSeconds) {
      const ytDurationMs = durationSeconds * 1000;
      const durationMatches = spotifyEpisodes.filter((ep) => {
        const diff = Math.abs(ep.duration_ms - ytDurationMs);
        return diff < 10000; // Within 10 seconds
      });

      if (durationMatches.length === 1) {
        const match = durationMatches[0];
        return {
          spotifyUrl: match.external_urls.spotify,
          durationMs: match.duration_ms,
          spotifyId: match.id,
        };
      }
    }

    // No reliable match found
    return null;
  } catch (err) {
    console.error("Error enriching with Spotify:", err);
    return null;
  }
}
