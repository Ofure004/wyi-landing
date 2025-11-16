"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  SvgMic,
  SvgArrow,
  SvgChevronLeft,
  SvgChevronRight,
} from "../../public/assets/svgs";
import type { EpisodeItem } from "@/lib/episodes";

type Props = {
  excludeId?: string | null;
  pageSize?: number;
  initialPage?: number;
};

export default function EpisodeListClient({
  excludeId,
  pageSize = 4,
  initialPage = 0,
}: Props) {
  const [all, setAll] = useState<EpisodeItem[]>([]);
  const [page, setPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(false);

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
        // locally exclude the header/latest episode if requested
        if (excludeId) {
          items = items.filter((it) => it.id !== excludeId);
        }
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

  const total = all.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = page * pageSize;
  const visible = all.slice(start, start + pageSize);

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
                        return idx >= 0 ? String(total - idx) : "";
                      })()}
                    </span>
                    <span>&nbsp;\&nbsp;</span>
                    <span>{formatDate(episode.publishedAt)}</span>
                  </div>
                  <h3 className="font-charleville text-4xl md:text-6xl leading-tight text-[var(--brand-yellow)] mb-6">
                    {renderDigitsWithMontItalic(episode.title)}
                  </h3>
                  <p className="font-montserrat text-white/80 max-w-prose mb-6">
                    {episode.description}
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <a
                      href={episode.youtubeUrl}
                      target="_blank"
                      className="relative overflow-hidden rounded-xl px-6 py-3 font-semibold shadow-lg inline-flex items-center gap-3 bg-[var(--brand-pink)] group"
                    >
                      <span
                        className="absolute inset-0 bg-[var(--brand-yellow)] origin-bottom-right scale-0 transform transition-transform duration-300 group-hover:scale-100 rounded-2xl"
                        aria-hidden
                      />
                      <span className="relative z-10 text-white transition-colors duration-200 group-hover:text-black">
                        Listen
                      </span>
                      <SvgMic className="relative z-10 w-5 h-5 text-white transition-colors duration-200 group-hover:text-black" />
                    </a>
                    <a
                      href={episode.spotify?.spotifyUrl ?? episode.youtubeUrl}
                      target="_blank"
                      className="relative overflow-hidden rounded-xl px-6 py-3 font-semibold shadow-lg inline-flex items-center gap-3 bg-[var(--brand-pink)] group"
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
