"use client";

import { useCallback, useEffect, useState } from "react";
import {
  drivePreviewUrl,
  driveImageUrl,
  driveFileId,
  type LiveSession,
} from "@/lib/liveEvents";

const STRIPES =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 12px, rgba(255,255,255,0.06) 12px 24px)";

function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5.14v13.72c0 .83.91 1.33 1.61.89l10.79-6.86a1.05 1.05 0 0 0 0-1.78L9.61 4.25A1.05 1.05 0 0 0 8 5.14Z" />
    </svg>
  );
}

/** Drive video poster frame; falls back to the striped placeholder on error. */
function Poster({ session }: { session: LiveSession }) {
  const [failed, setFailed] = useState(false);
  const id = session.videoUrl ? driveFileId(session.videoUrl) : "";

  return (
    <>
      <span className="absolute inset-0" style={{ backgroundImage: STRIPES }} aria-hidden />
      {id && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={driveImageUrl(id, 800)}
          alt=""
          aria-hidden
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </>
  );
}

export default function RecapVideos({ sessions }: { sessions: LiveSession[] }) {
  const [active, setActive] = useState<LiveSession | null>(null);
  const close = useCallback(() => setActive(null), []);

  // Close on Escape and lock body scroll while the player is open.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, close]);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] text-left transition-colors hover:border-white/25"
            aria-label={`Play ${s.title}`}
          >
            <div className="relative aspect-video overflow-hidden bg-black">
              <Poster session={s} />
              <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/25" aria-hidden />
              <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--brand-yellow)] text-black shadow-lg transition-transform duration-300 group-hover:scale-110">
                <PlayIcon className="h-6 w-6 translate-x-[1px]" />
              </span>
            </div>
            <span className="flex flex-1 flex-col p-5">
              <span className="font-charleville text-xl leading-snug text-[#f4ecd6]">
                {s.title}
              </span>
              {s.caption && (
                <span className="mt-1 text-sm font-montserrat text-white/50">
                  {s.caption}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {active && active.videoUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={close}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close video"
              className="absolute -top-11 right-0 flex items-center gap-2 font-montserrat text-sm text-white/70 transition-colors hover:text-white"
            >
              Close ✕
            </button>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
              <iframe
                src={drivePreviewUrl(active.videoUrl)}
                title={active.title}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <p className="mt-3 font-montserrat text-sm text-white/60">
              <span className="text-[#f4ecd6]">{active.title}</span>
              {active.caption ? ` — ${active.caption}` : ""}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
