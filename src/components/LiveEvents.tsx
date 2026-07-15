import Link from "next/link";
import { nextEvent, featuredRecap, type LiveHighlight } from "@/lib/liveEvents";

// Diagonal-stripe placeholder, matching the live session tiles elsewhere.
const STRIPES =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 12px, rgba(255,255,255,0.06) 12px 24px)";

function HighlightTile({ item }: { item: LiveHighlight }) {
  return (
    <div className="relative flex min-h-[150px] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-6 pb-4">
      <span
        className="absolute inset-0"
        style={{ backgroundImage: STRIPES }}
        aria-hidden
      />
      <div className="relative">
        <div className="font-montserrat font-bold text-2xl md:text-3xl text-[#f4ecd6]">
          {item.value}
        </div>
        <div className="mt-1 min-h-[40px] items-start font-montserrat text-sm text-white/55">
          {item.label}
        </div>
      </div>
    </div>
  );
}

export default function LiveEvents() {
  // Feature the next/upcoming event; fall back to the latest recap if none.
  const event = nextEvent ?? featuredRecap;
  const isUpcoming = event.status === "upcoming";

  return (
    <section id="live" className="bg-black text-white">
      <div className="mx-auto max-w-[1450px] px-6 md:px-12 lg:px-16 py-20 md:py-28">
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
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-yellow)]/50 px-3 py-1 text-xs font-montserrat font-semibold uppercase tracking-wider text-[var(--brand-yellow)]">
                {isUpcoming && (
                  <span className="h-2 w-2 rounded-full bg-[var(--brand-yellow)]" />
                )}
                {isUpcoming ? "Up Next" : "Recap"}
              </span>
            </div>

            <h2 className="font-charleville text-[clamp(1.9rem,4.5vw,3.25rem)] leading-[1.1] text-[#f4ecd6] max-w-3xl">
              {event.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base md:text-lg text-white/55 font-montserrat">
              {event.tagline}
            </p>

            {/* Discussion topics */}
            {event.topics && event.topics.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {event.topics.slice(0, 5).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-montserrat text-white/60"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}

            {/* Highlight stats */}
            {event.highlights && event.highlights.length > 0 && (
              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {event.highlights.map((h) => (
                  <HighlightTile key={h.label} item={h} />
                ))}
              </div>
            )}

            {/* CTA row */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a
                href={event.registerUrl ?? "mailto:info@wattsyourimpact.com"}
                className="group relative inline-flex items-center overflow-hidden rounded-xl bg-[var(--brand-yellow)] px-7 py-3.5 font-montserrat font-bold text-black shadow-lg transition-transform hover:scale-[1.02]"
              >
                Register your interest
              </a>
              <span className="text-sm font-montserrat uppercase tracking-wider text-white/50">
                {event.location} · {event.date}
              </span>
              <Link
                href="/live"
                className="nav-link nav-link--yellow ml-auto text-sm font-montserrat font-semibold text-[var(--brand-yellow)]"
                data-replace="See past live events →"
              >
                <span>See past live events →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
