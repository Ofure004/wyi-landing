import Link from "next/link";
import { featuredRecap, nextEvent, type LiveSession } from "@/lib/liveEvents";

// Diagonal-stripe placeholder used until real session thumbnails exist.
const STRIPES =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 12px, rgba(255,255,255,0.06) 12px 24px)";

function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5.14v13.72c0 .83.91 1.33 1.61.89l10.79-6.86a1.05 1.05 0 0 0 0-1.78L9.61 4.25A1.05 1.05 0 0 0 8 5.14Z" />
    </svg>
  );
}

function SessionCard({ session }: { session: LiveSession }) {
  return (
    <Link
      href={session.videoUrl ?? "/live"}
      className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-white/25"
      aria-label={`Watch session ${session.number}: ${session.title}`}
    >
      <span className="absolute inset-0" style={{ backgroundImage: STRIPES }} aria-hidden />
      <span className="absolute left-4 top-4 text-xs font-montserrat font-semibold uppercase tracking-wider text-[var(--brand-yellow)]">
        Session {String(session.number).padStart(2, "0")}
      </span>
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-yellow)] text-black shadow-lg transition-transform duration-300 group-hover:scale-110">
        <PlayIcon className="h-5 w-5 translate-x-[1px]" />
      </span>
    </Link>
  );
}

export default function LiveEvents() {
  const recap = featuredRecap;

  return (
    <section id="live" className="bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16 py-20 md:py-28">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-7 sm:p-10 md:p-14">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--brand-yellow)]/10 blur-3xl"
            aria-hidden
          />

          <div className="relative">
            {/* Eyebrow */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="text-sm font-montserrat font-semibold uppercase tracking-[0.2em] text-[var(--brand-yellow)]">
                Watts Your Impact Live
              </span>
              <span className="rounded-full border border-[var(--brand-yellow)]/50 px-3 py-1 text-xs font-montserrat font-semibold uppercase tracking-wider text-[var(--brand-yellow)]">
                Recap · {recap.volume}
              </span>
            </div>

            <h2 className="font-charleville text-[clamp(1.9rem,4.5vw,3.25rem)] leading-[1.1] text-[#f4ecd6] max-w-3xl">
              {recap.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base md:text-lg text-white/55 font-montserrat">
              {recap.tagline}
            </p>

            {/* Session recordings */}
            {recap.sessions.length > 0 && (
              <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
                {recap.sessions.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            )}

            {/* CTA row */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="/live"
                className="group relative inline-flex items-center overflow-hidden rounded-xl bg-[var(--brand-yellow)] px-7 py-3.5 font-montserrat font-bold text-black shadow-lg transition-transform hover:scale-[1.02]"
              >
                {nextEvent
                  ? `Register for ${nextEvent.volume}`
                  : "Explore live events"}
              </Link>
              {nextEvent && (
                <span className="text-sm font-montserrat uppercase tracking-wider text-white/50">
                  {nextEvent.location} · {nextEvent.date}
                </span>
              )}
              <Link
                href="/live"
                className="ml-auto text-sm font-montserrat font-semibold text-[var(--brand-yellow)] underline-offset-4 hover:underline"
              >
                See all live events →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
