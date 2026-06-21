"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  SvgArrow,
  SvgChevronLeft,
  SvgChevronRight,
  SvgSpotify,
  SvgApple,
} from "../../public/assets/svgs";
import type { EpisodeItem } from "@/lib/episodes";

type Props = {
  excludeId?: string | null;
  pageSize?: number;
  initialPage?: number;
};

// Preferred display order for the category filter; any unexpected categories
// found in the data are appended after these.
const CATEGORY_ORDER = [
  "Career",
  "Entertainment",
  "Entrepreneurship",
  "Sustainability",
];

// Accent colors for the per-episode category badge (kept in the brand palette;
// sustainability uses a green that reads naturally for the theme).
const CATEGORY_COLORS: Record<string, string> = {
  Career: "var(--brand-yellow)",
  Entertainment: "var(--brand-pink)",
  Entrepreneurship: "var(--brand-orange)",
  Sustainability: "#3fbf6b",
};

export default function EpisodeListClient({
  excludeId,
  pageSize = 4,
  initialPage = 0,
}: Props) {
  const [all, setAll] = useState<EpisodeItem[]>([]);
  const [page, setPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const renderDigitsWithMontItalic = (text?: string | null) => {
    if (!text) return null;
    return text.split(/(\d+)/).map((part, idx) =>
      /^\d+$/.test(part) ? (
        <span key={idx} className="font-montserrat italic">
          {part}
        </span>
      ) : (
        <span key={idx}>{part}</span>
      )
    );
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d
        .toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase();
    } catch {
      return iso ?? "";
    }
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        // request many items; the API supports server pagination but we want all
        params.set("limit", "1000");
        if (excludeId) params.set("excludeId", excludeId);
        const res = await fetch(`/api/episodes?${params.toString()}`);
        const j = await res.json();
        // API may return { items } (flat) or { data: [ { playlistId, episodes: [...] } ] } (grouped)
        let items: EpisodeItem[] = [];
        if (Array.isArray(j.items)) {
          items = j.items;
        } else if (Array.isArray(j.data)) {
          // flatten grouped data
          items = j.data.flatMap(
            (g: { episodes?: EpisodeItem[] }) => g.episodes || []
          );
        } else {
          items = [];
        }
        // sort newest-first
        items.sort((a, b) => {
          const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
          const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
          return bt - at;
        });
        // Keep the full catalogue in `all` (including the featured/header
        // episode) so categories and counts reflect the true totals. The
        // featured episode is excluded only from the rendered list, in `view`.
        if (mounted) {
          setAll(items);
          // reset page if out of bounds after filtering
          setPage((p) => {
            const pagesAfter = Math.max(1, Math.ceil(items.length / pageSize));
            return p >= pagesAfter ? Math.max(0, pagesAfter - 1) : p;
          });
        }
      } catch {
        if (mounted) setAll([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [excludeId, pageSize]);

  // Categories actually present in the data, in preferred order. Empty when no
  // episode is categorized (e.g. RSS fallback) — the filter bar then hides.
  const categories = useMemo(() => {
    const present = new Set(
      all.map((e) => e.category).filter(Boolean) as string[]
    );
    const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
    const extras = [...present].filter((c) => !CATEGORY_ORDER.includes(c));
    return [...ordered, ...extras];
  }, [all]);

  // Reset to the first page whenever the active category changes.
  useEffect(() => {
    setPage(0);
  }, [activeCategory]);

  // Episodes matching the active category (full catalogue, incl. featured) —
  // used for the displayed count so it reflects the true number of videos.
  const inCategory = useMemo(
    () =>
      activeCategory ? all.filter((e) => e.category === activeCategory) : all,
    [all, activeCategory]
  );
  const count = inCategory.length;

  // The rendered list excludes the featured/header episode (shown in the hero).
  const view = useMemo(
    () =>
      excludeId ? inCategory.filter((e) => e.id !== excludeId) : inCategory,
    [inCategory, excludeId]
  );

  const total = view.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = page * pageSize;
  const visible = view.slice(start, start + pageSize);

  const getPageItems = (current: number, totalPages: number) => {
    const out: Array<number | string> = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) out.push(i);
      return out;
    }
    // current is 1-based
    if (current <= 4) {
      out.push(1, 2, 3, 4, "...", totalPages);
      return out;
    }
    if (current >= totalPages - 3) {
      out.push(
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
      return out;
    }
    out.push(1, "...", current - 1, current, current + 1, "...", totalPages);
    return out;
  };

  const pageItems = getPageItems(page + 1, pages);

  return (
    <div>
      {categories.length > 0 && (
        <div className="container mx-auto px-12 lg:px-0 max-w-7xl mb-12">
          <div className="flex items-center justify-between gap-4 border-b-2 border-[rgba(250,204,21,0.15)] pb-6">
            <div
              className="flex gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1"
              role="tablist"
              aria-label="Filter episodes by category"
            >
              {[null, ...categories].map((cat) => {
                const isActive = activeCategory === cat;
                const label = cat ?? "All";
                return (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-montserrat uppercase tracking-widest transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[var(--brand-pink)] text-white md:bg-transparent md:text-[var(--brand-yellow)] md:underline md:underline-offset-8 md:decoration-2 md:decoration-[var(--brand-yellow)]"
                        : "border border-[rgba(250,204,21,0.15)] text-[var(--brand-yellow)]/70 hover:text-[var(--brand-yellow)]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <span className="hidden md:block text-xs uppercase tracking-widest text-white/50 whitespace-nowrap">
              {count} {count === 1 ? "episode" : "episodes"}
            </span>
          </div>
        </div>
      )}

      {loading && <div className="text-white/60 mb-6">Loading...</div>}

      <div>
        {visible.map((episode) => (
          <div
            key={episode.id}
            className="container mx-auto px-12 lg:px-0 py-12 mb-20 border-t-2 border-[rgba(250,204,21,0.15)] max-w-7xl"
          >
            <div className="mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 md:gap-8 items-center">
                <div className="md:col-span-4">
                  <div className="w-full aspect-square rounded-lg overflow-hidden shadow-2xl">
                    <Image
                      src={episode.thumbnail || "/images/wyihero.jpg"}
                      alt={episode.title}
                      width={1000}
                      height={1000}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
                <div className="md:col-span-8 text-center md:text-left  text-white">
                  <div className="text-sm uppercase tracking-widest text-[var(--brand-yellow)] mb-6">
                    <span>EPISODE&nbsp;</span>
                    <span className="font-montserrat italic">
                      {(() => {
                        const idx = all.findIndex((x) => x.id === episode.id);
                        return idx >= 0 ? String(all.length - idx) : "";
                      })()}
                    </span>
                    <span>&nbsp;\&nbsp;</span>
                    <span>{formatDate(episode.publishedAt)}</span>
                    {episode.category && (
                      <>
                        <span>&nbsp;\&nbsp;</span>
                        <span
                          className="font-semibold"
                          style={{
                            color:
                              CATEGORY_COLORS[episode.category] ??
                              "var(--brand-yellow)",
                          }}
                        >
                          {episode.category}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="font-charleville text-4xl md:text-6xl leading-tight text-[var(--brand-yellow)] mb-6">
                    {renderDigitsWithMontItalic(episode.title)}
                  </h3>
                  <p className="font-montserrat text-white/80 max-w-prose mb-6">
                    {episode.description}
                  </p>
                  <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4">
                    {/* Spotify button – fall back to YouTube if no Spotify-specific URL */}
                    <a
                      href={episode.spotify?.spotifyUrl ?? episode.youtubeUrl}
                      target="_blank"
                      className="relative overflow-hidden rounded-xl px-6 py-3 font-semibold shadow-lg inline-flex justify-center items-center gap-3 bg-[var(--brand-pink)] group w-3/4 md:w-auto"
                    >
                      <span
                        className="absolute inset-0 bg-[var(--brand-yellow)] origin-bottom-right scale-0 transform transition-transform duration-300 group-hover:scale-100 rounded-2xl"
                        aria-hidden
                      />
                      <span className="relative z-10 text-white transition-colors duration-200 group-hover:text-black">
                        Spotify
                      </span>
                      <SvgSpotify className="relative z-10 w-5 h-5 text-white transition-colors duration-200 group-hover:text-black" />
                    </a>

                    {/* Apple Podcasts button – prefer per-episode Apple URL, fall back to YouTube */}
                    <a
                      href="https://podcasts.apple.com/us/podcast/watts-your-impact/id1791522753"
                      target="_blank"
                      className="relative overflow-hidden rounded-xl px-6 py-3 font-semibold shadow-lg inline-flex justify-center items-center gap-3 bg-[var(--brand-pink)] group w-3/4 md:w-auto"
                    >
                      <span
                        className="absolute inset-0 bg-[var(--brand-yellow)] origin-bottom-right scale-0 transform transition-transform duration-300 group-hover:scale-100 rounded-2xl"
                        aria-hidden
                      />
                      <span className="relative z-10 text-white transition-colors duration-200 group-hover:text-black">
                        Apple Podcasts
                      </span>
                      <SvgApple className="relative z-10 w-8 h-6 text-white transition-colors duration-200 group-hover:text-black" />
                    </a>
                    {/* Watch should always go to the YouTube video */}
                    <a
                      href={episode.youtubeUrl}
                      target="_blank"
                      className="relative overflow-hidden rounded-xl px-6 py-3 font-semibold shadow-lg inline-flex justify-center items-center gap-3 bg-[var(--brand-pink)] group w-3/4 md:w-auto"
                    >
                      <span
                        className="absolute inset-0 bg-[var(--brand-yellow)] origin-bottom-right scale-0 transform transition-transform duration-300 group-hover:scale-100"
                        aria-hidden
                      />
                      <span className="relative z-10 text-white transition-colors duration-200 group-hover:text-black">
                        Watch
                      </span>
                      <SvgArrow className="relative z-10 w-5 h-5 text-white transition-colors duration-200 group-hover:text-black" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 mb-6 w-full border-b-2 border-[rgba(250,204,21,0.15)] pb-16">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          //   className="px-3 py-2 bg-white/5 rounded"
          aria-label="Previous page"
        >
          <SvgChevronLeft className="w-5 h-5 text-[var(--brand-yellow)] opacity-50 transition-colors duration-200 hover:opacity-100 cursor-pointer" />
        </button>

        <nav aria-label="Pagination" className="flex items-center gap-6">
          {pageItems.map((it, idx) =>
            it === "..." ? (
              <span key={`ell-${idx}`} className="text-white/50 text-2xl">
                …
              </span>
            ) : (
              <button
                key={`p-${String(it)}-${idx}`}
                onClick={() => setPage((Number(it) as number) - 1)}
                className={`text-[var(--brand-yellow)] text-4xl ${
                  (Number(it) as number) - 1 === page
                    ? "underline"
                    : "opacity-80"
                }`}
                aria-current={
                  (Number(it) as number) - 1 === page ? "page" : undefined
                }
              >
                {it}
              </button>
            )
          )}
        </nav>

        <button
          onClick={() => setPage((p) => Math.min(p + 1, pages - 1))}
          disabled={page >= pages - 1 || loading}
          //   className="px-3 py-2 bg-white/5 rounded"
          aria-label="Next page"
        >
          <SvgChevronRight className="w-5 h-5 text-[var(--brand-yellow)] opacity-50 transition-colors duration-200 hover:opacity-100 cursor-pointer" />
        </button>
      </div>
    </div>
  );
}
