"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { SvgSpotify, SvgApple, SvgArrow } from "../../public/assets/svgs";
import type { EpisodeItem } from "@/lib/episodes";
import { formatDate } from "@/lib/helpers";

type Props = {
  episodes: EpisodeItem[];
  excludeId?: string | null;
};

// Preferred display order for the category groups; any unexpected categories
// found in the data are appended after these.
const CATEGORY_ORDER = [
  "Career",
  "Entertainment",
  "Entrepreneurship",
  "Sustainability",
];

// Accent colours per category, kept in the brand palette. Sustainability uses a
// green that reads naturally alongside the brand colours.
const CATEGORY_COLORS: Record<string, string> = {
  Career: "var(--brand-yellow)",
  Entertainment: "var(--brand-pink)",
  Entrepreneurship: "var(--brand-orange)",
  Sustainability: "#3fbf6b",
};

const APPLE_PODCAST_URL =
  "https://podcasts.apple.com/us/podcast/watts-your-impact/id1791522753";

const accentFor = (category?: string) =>
  (category && CATEGORY_COLORS[category]) || "var(--brand-yellow)";

export default function EpisodesShowcase({ episodes, excludeId }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Newest-first catalogue. Episode numbers are derived from this order so the
  // most recent upload carries the highest number.
  const sorted = useMemo(() => {
    return episodes.slice().sort((a, b) => {
      const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return bt - at;
    });
  }, [episodes]);

  const episodeNumberById = useMemo(() => {
    const map = new Map<string, number>();
    sorted.forEach((e, idx) => map.set(e.id, sorted.length - idx));
    return map;
  }, [sorted]);

  // The rendered list excludes the featured episode shown in the hero.
  const visible = useMemo(
    () => (excludeId ? sorted.filter((e) => e.id !== excludeId) : sorted),
    [sorted, excludeId],
  );

  // Categories actually present in the data, in preferred order.
  const categories = useMemo(() => {
    const present = new Set(
      visible.map((e) => e.category).filter(Boolean) as string[],
    );
    const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
    const extras = [...present].filter((c) => !CATEGORY_ORDER.includes(c));
    return [...ordered, ...extras];
  }, [visible]);

  // Group episodes by category, honouring the active filter. Episodes without a
  // category fall into an "Other" group so nothing silently disappears.
  const groups = useMemo(() => {
    const shown = categories.filter(
      (c) => !activeCategory || c === activeCategory,
    );
    return shown
      .map((category) => ({
        category,
        episodes: visible.filter((e) => e.category === category),
      }))
      .filter((g) => g.episodes.length > 0);
  }, [categories, activeCategory, visible]);

  return (
    <section className="bg-black text-white">
      {/* Our Focus — intro statement */}
      <div className="mx-auto px-6 md:px-10 lg:px-12 pt-20 md:pt-28 pb-10 md:pb-16">
        <p className="text-sm font-montserrat uppercase tracking-[0.25em] text-[var(--brand-yellow)] mb-6">
          Our Focus
        </p>
        <h2 className="font-charleville text-[clamp(1.9rem,5vw,3.5rem)] leading-[1.15] text-[#f4ecd6] max-w-5xl">
          The people powering the energy future — humanized. We turn technical,
          insider conversations into stories anyone can learn from.
        </h2>
      </div>

      {/* Episodes header + category filter pills */}
      <div className="mx-auto px-6 md:px-12 lg:px-16 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <h3 className="font-charleville text-4xl md:text-5xl font-bold text-[#f4ecd6]">
            Episodes
          </h3>
          {categories.length > 0 && (
            <div
              className="flex flex-wrap gap-2"
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
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-montserrat font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[var(--brand-yellow)] text-black"
                        : "bg-white/[0.03] text-white/60 border border-white/10 hover:text-white hover:border-white/25"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category groups */}
      <div className="mx-auto px-6 md:px-12 lg:px-16 pb-20 md:pb-28">
        {groups.length === 0 && (
          <p className="text-white/50 py-10">No episodes to show yet.</p>
        )}

        {groups.map(({ category, episodes: eps }) => {
          const accent = accentFor(category);
          return (
            <div key={category} className="mb-14 last:mb-0">
              {/* Group heading: dot + label + rule */}
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                />
                <h4 className="font-charleville text-xl md:text-2xl font-semibold text-[#f4ecd6] whitespace-nowrap">
                  {category}
                </h4>
                <span className="h-px flex-1 bg-white/10" aria-hidden />
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eps.map((episode) => (
                  <EpisodeCard
                    key={episode.id}
                    episode={episode}
                    accent={accent}
                    number={episodeNumberById.get(episode.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EpisodeCard({
  episode,
  accent,
  number,
}: {
  episode: EpisodeItem;
  accent: string;
  number?: number;
}) {
  const spotifyUrl = episode.spotify?.spotifyUrl ?? episode.youtubeUrl;

  return (
    <article className="group/card flex flex-col overflow-hidden rounded-xl bg-white/[0.02] border border-white/10 transition-colors hover:border-white/20">
      {/* Thumbnail */}
      <a
        href={episode.youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-video overflow-hidden bg-[#161210]"
        aria-label={`Watch ${episode.title} on YouTube`}
      >
        {episode.thumbnail ? (
          <Image
            src={episode.thumbnail}
            alt={episode.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.3em] text-white/30">
            Thumbnail
          </div>
        )}
        {episode.durationFormatted && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
            {episode.durationFormatted}
          </span>
        )}
      </a>

      {/* Accent line */}
      <span className="h-[3px] w-full" style={{ backgroundColor: accent }} />

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <p
          className="text-xs font-montserrat font-semibold uppercase tracking-wider mb-2"
          style={{ color: accent }}
        >
          {/* {number ? `EP. ${number}` : "EPISODE"} */}
          {/* {episode.category ? ` · ${episode.category}` : ""} */}
          <span>{formatDate(episode.publishedAt)}</span>
        </p>

        <h5 className="font-charleville text-xl leading-snug text-[#f4ecd6] h-12">
          {episode.title.split(/(\d+)/).map((part, i) =>
            /\d/.test(part) ? (
              <span key={i} className="font-montserrat">
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </h5>

        {episode.description && (
          <p className="mt-2 text-sm text-white/45 line-clamp-2 font-montserrat">
            {episode.description}
          </p>
        )}

        {/* Listen / watch buttons */}
        <div className="mt-4 flex items-center gap-2 pt-4 border-t border-white/[0.06]">
          <IconLink
            href={spotifyUrl}
            label={`Listen to ${episode.title} on Spotify`}
            // className="flex items-center gap-2 px-3"
          >
            <SvgSpotify className="h-4 w-4 text-white transition-colors duration-200 group-hover/btn:text-black" />
            {/* <span className="ml-2 text-white transition-colors duration-200 group-hover/btn:text-black text-xs font-semibold">
              Spotify
            </span> */}
          </IconLink>
          <IconLink href={APPLE_PODCAST_URL} label="Listen on Apple Podcasts">
            <SvgApple className="h-6 w-6 text-white transition-colors duration-200 group-hover/btn:text-black" />
            {/* <span className="ml-2 text-white transition-colors duration-200 group-hover/btn:text-black text-xs font-semibold">
              Apple Podcasts
            </span> */}
          </IconLink>
          <IconLink
            href={episode.youtubeUrl}
            label={`Watch ${episode.title} on YouTube`}
          >
            <span className="mr-2 text-white transition-colors duration-200 group-hover/btn:text-black font-semibold text-xs">
              Watch
            </span>
            <SvgArrow className="mt-2 h-8 w-8 text-white transition-colors duration-200 group-hover/btn:text-black" />
          </IconLink>
        </div>
      </div>
    </article>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group/btn relative flex h-10 w-auto py-2 px-6 items-center justify-center border border-white/15 overflow-hidden rounded-lg transition-colors hover:border-transparent"
    >
      <span
        className="absolute inset-0 scale-0 rounded-lg bg-[var(--brand-yellow)] transition-transform duration-300 group-hover/btn:scale-100"
        aria-hidden
      />
      <span className="relative z-10 flex items-center justify-center">
        {children}
      </span>
    </a>
  );
}
