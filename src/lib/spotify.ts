// lib/spotify.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

export type SpotifyEpisodeInfo = {
  spotifyUrl?: string;
  durationMs?: number;
  spotifyId?: string;
};

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
 * Best-effort: search Spotify episodes by query (episode title). Returns top result if similarity OK.
 */
export async function searchSpotifyEpisode(
  title: string,
  token: string
): Promise<SpotifyEpisodeInfo | null> {
  // sanitize and shorten query
  const q = encodeURIComponent(title.slice(0, 120));
  const url = `https://api.spotify.com/v1/search?q=${q}&type=episode&limit=3`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const j = (await r.json()) as { episodes: { items: any[] } };
  const items = (j.episodes?.items || []) as any[];
  if (!items.length) return null;

  // pick the best match by simplified title equality or startWith
  const normalized = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const target = normalized(title);
  for (const it of items) {
    const t = normalized(it.name || "");
    if (t === target || t.startsWith(target) || target.startsWith(t)) {
      return {
        spotifyUrl: it.external_urls?.spotify,
        durationMs: it.duration_ms,
        spotifyId: it.id,
      };
    }
  }

  // fallback to first result
  const it0 = items[0];
  return {
    spotifyUrl: it0.external_urls?.spotify,
    durationMs: it0.duration_ms,
    spotifyId: it0.id,
  };
}

export async function enrichWithSpotify(
  title: string
): Promise<SpotifyEpisodeInfo | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;
  try {
    const token = await getSpotifyToken();
    return await searchSpotifyEpisode(title, token);
  } catch {
    // Fail silently; enrichment is best-effort and should not pollute logs
    return null;
  }
}
