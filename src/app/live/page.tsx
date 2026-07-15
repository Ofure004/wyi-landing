import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "../../components/Nav";
import { ScrollToTopButton } from "../../components/ScrollToTopButton";
import RecapVideos from "../../components/RecapVideos";
import {
  liveEvents,
  nextEvent,
  driveImageUrl,
  type LiveEvent,
} from "@/lib/liveEvents";

export const metadata: Metadata = {
  title: "Live Events",
  description:
    "Watts Your Impact Live brings the podcast off the mic and into the room — recorded conversations with the people shaping Africa's energy future. Watch past editions and register for what's next.",
  alternates: { canonical: "/live" },
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-montserrat font-bold text-3xl md:text-4xl text-[var(--brand-yellow)]">
        {value}
      </div>
      <div className="mt-1 text-xs font-montserrat uppercase tracking-widest text-white/50">
        {label}
      </div>
    </div>
  );
}

function Gallery({ ids, label }: { ids: string[]; label: string }) {
  return (
    <div className="mt-12">
      <p className="mb-3 font-montserrat text-xs uppercase tracking-widest text-white/40">
        From the room
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ids.map((id, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={id}
            src={driveImageUrl(id, 800)}
            alt={`${label} — photo ${i + 1}`}
            loading="lazy"
            className="aspect-square w-full rounded-xl border border-white/10 object-cover"
          />
        ))}
      </div>
    </div>
  );
}

function PastEdition({ event }: { event: LiveEvent }) {
  const meta = [event.location, event.date, event.audience]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="border-t border-white/10 pt-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          {event.edition && (
            <span className="text-sm font-montserrat font-semibold uppercase tracking-[0.2em] text-[var(--brand-yellow)]">
              {event.edition}
            </span>
          )}
          <h3 className="mt-3 font-charleville text-3xl md:text-4xl leading-tight text-[#f4ecd6] max-w-3xl">
            {event.title}
          </h3>
          {event.subtitle && (
            <p className="mt-2 font-montserrat text-sm uppercase tracking-wider text-white/45">
              {event.subtitle}
            </p>
          )}
          <p className="mt-4 max-w-2xl font-montserrat text-white/55">
            {event.tagline}
          </p>
        </div>
        <div className="shrink-0 text-sm font-montserrat uppercase tracking-wider text-white/50">
          {meta}
        </div>
      </div>

      {event.question && (
        <blockquote className="mt-8 border-l-2 border-[var(--brand-yellow)] pl-5">
          <p className="font-charleville text-2xl md:text-3xl text-[#f4ecd6]">
            &ldquo;{event.question}&rdquo;
          </p>
          <p className="mt-2 font-montserrat text-xs uppercase tracking-widest text-white/40">
            The question the room came for
          </p>
        </blockquote>
      )}

      {event.topics && event.topics.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 font-montserrat text-xs uppercase tracking-widest text-white/40">
            What we explored
          </p>
          <div className="flex flex-wrap gap-2">
            {event.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-montserrat text-white/60"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {event.host && (
        <p className="mt-6 font-montserrat text-sm text-white/50">{event.host}</p>
      )}

      {event.sessions.length > 0 && (
        <div className="mt-12">
          <p className="mb-4 font-montserrat text-xs uppercase tracking-widest text-white/40">
            Watch the recap
          </p>
          <RecapVideos sessions={event.sessions} />
        </div>
      )}

      {event.gallery && event.gallery.length > 0 && (
        <Gallery ids={event.gallery} label={event.title} />
      )}
    </div>
  );
}

export default function LivePage() {
  const past = liveEvents.filter((e) => e.status === "past");

  return (
    <div className="min-h-screen bg-black text-white">
      <Nav />

      {/* Header */}
      <header className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16 pt-32 md:pt-40 pb-12 md:pb-16">
        <p className="text-sm font-montserrat font-semibold uppercase tracking-[0.25em] text-[var(--brand-yellow)] mb-6">
          Watts Your Impact Live
        </p>
        <h1 className="font-charleville text-[clamp(2.2rem,6vw,4rem)] leading-[1.05] text-[#f4ecd6] max-w-4xl">
          Real rooms. Real conversations. Off the mic and on the stage.
        </h1>
        <p className="mt-6 max-w-2xl text-base md:text-lg font-montserrat text-white/55">
          A few times a year we bring the podcast to life — gathering the
          builders, funders and operators shaping Africa&apos;s energy future
          for one unfiltered night. Watch past editions or claim a seat at the
          next one.
        </p>
        <div className="mt-10 flex flex-wrap gap-10 sm:gap-14">
          <Stat value="2" label="Editions" />
          <Stat value="30+" label="Attendees" />
          {/* <Stat value="13" label="Speakers" /> */}
        </div>
      </header>

      {/* Upcoming */}
      {nextEvent && (
        <section className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16 pb-16 md:pb-20">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--brand-yellow)]/30 bg-gradient-to-b from-[var(--brand-yellow)]/[0.06] to-transparent p-8 md:p-12">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--brand-yellow)]/10 blur-3xl"
              aria-hidden
            />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-yellow)]/50 px-3 py-1 text-xs font-montserrat font-semibold uppercase tracking-wider text-[var(--brand-yellow)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--brand-yellow)]" />
                  Up next
                </span>
                <h2 className="mt-5 font-charleville text-3xl md:text-5xl leading-tight text-[#f4ecd6]">
                  {nextEvent.title}
                </h2>
                <p className="mt-4 font-montserrat text-white/60">
                  {nextEvent.tagline}
                </p>
                {nextEvent.topics && nextEvent.topics.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {nextEvent.topics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-montserrat text-white/60"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-6 text-sm font-montserrat uppercase tracking-wider text-white/50">
                  {nextEvent.location} · {nextEvent.date} · 4–5 speakers
                </p>
              </div>
              <div className="shrink-0">
                <a
                  href={
                    nextEvent.registerUrl ?? "mailto:info@wattsyourimpact.com"
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-yellow)] px-8 py-4 font-montserrat font-bold text-black shadow-lg transition-transform hover:scale-[1.02]"
                >
                  Register your interest
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Past editions */}
      <section className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16 pb-20 md:pb-28">
        <h2 className="mb-12 font-charleville text-3xl md:text-4xl font-bold text-[#f4ecd6]">
          Past editions
        </h2>
        <div className="flex flex-col gap-16">
          {past.map((e) => (
            <PastEdition key={e.id} event={e} />
          ))}
        </div>
      </section>

      {/* Back / footer strip */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 md:px-12 lg:px-16 py-8 text-sm font-montserrat text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Watts Your Impact · Be a guest →{" "}
            <a
              href="mailto:info@wattsyourimpact.com"
              className="text-[var(--brand-yellow)] hover:underline"
            >
              info@wattsyourimpact.com
            </a>
          </div>
          <Link href="/" className="text-white/60 hover:text-white">
            ← Back to home
          </Link>
        </div>
      </footer>

      <ScrollToTopButton />
    </div>
  );
}
