import Image from "next/image";
import {
  SvgMic,
  SvgArrow,
  SvgInstagram,
  SvgTiktok,
  SvgTwitter,
  SvgMail,
} from "../../public/assets/svgs";
import heroCropped from "../../public/images/hero-cropped.jpg";
// import Marquee from "../components/Marquee";
import { Nav } from "../components/Nav";
import {
  getEpisodesGrouped,
  type EpisodeGroup,
  type EpisodeItem,
} from "@/lib/episodes";
import EpisodeListClient from "../components/EpisodeListClient";
import { ScrollToTopButton } from "../components/ScrollToTopButton";

export const revalidate = 600; // cache page data for 10 minutes

export default async function Home() {
  const groups: EpisodeGroup[] = await getEpisodesGrouped();
  const allEpisodes: EpisodeItem[] = groups.flatMap((g) => g.episodes);
  const latest: EpisodeItem | undefined = allEpisodes.slice().sort((a, b) => {
    const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bt - at;
  })[0];
  const episodeNumber = allEpisodes.length;

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
      return iso;
    }
  };

  const renderDigitsWithFallback = (text: string) =>
    text.split(/(\d+)/).map((part, idx) =>
      /^\d+$/.test(part) ? (
        <span key={idx} className="font-montserrat italic">
          {part}
        </span>
      ) : (
        <span key={idx}>{part}</span>
      )
    );

  return (
    <div className="min-h-screen bg-black text-white">
      <section id="home" className="relative h-screen w-full">
        <Image
          src={heroCropped}
          alt="watts your impact hero image"
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
          className="object-cover object-center"
          quality={100}
        />
        <div className="absolute w-full inset-0 bg-[#440542]/30 z-10" />

        {/* Left-center hero prompt */}
        {/* <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-30">
          <h2 className="text-white font-montserrat text-2xl md:text-4xl">
            let’s talk about it.
          </h2>
        </div> */}

        {/* Latest episode content */}
        {latest && (
          <div className="absolute inset-0 z-20 flex items-end">
            <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end mx-auto px-4 pb-24 md:pb-12 gap-6">
              <div className="max-w-4xl">
                <div className="text-sm uppercase tracking-widest text-[var(--brand-yellow)] mb-4">
                  <span>EPISODE&nbsp;</span>
                  <span className="font-montserrat italic">
                    {episodeNumber}
                  </span>
                  <span>&nbsp;\&nbsp;</span>
                  <span>{formatDate(latest.publishedAt)}</span>
                </div>
                <h1 className="font-charleville text-[clamp(2rem,8vw,3.5rem)] md:text-[clamp(2.5rem,6vw,55px)] leading-tight text-[var(--brand-yellow)]">
                  {renderDigitsWithFallback(latest.title)}
                </h1>
              </div>
              <div className="mt-2 md:mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={latest.spotify?.spotifyUrl ?? latest.youtubeUrl}
                  target="_blank"
                  className="relative overflow-hidden rounded-xl px-6 py-3 font-semibold shadow-lg inline-flex items-center gap-3 border-2 border-white hover:border-none group"
                >
                  <span
                    className="absolute inset-0 bg-[var(--brand-yellow)] origin-bottom-right scale-0 transform transition-transform duration-300 group-hover:scale-100 rounded-xl"
                    aria-hidden
                  />
                  <span className="relative z-10 text-white transition-colors duration-200 group-hover:text-black font-bold text-lg">
                    Listen
                  </span>
                  <SvgMic className="relative z-10 w-5 h-5 text-white transition-colors duration-200 group-hover:text-black" />
                </a>
                <a
                  href={latest.youtubeUrl}
                  target="_blank"
                  className="relative overflow-hidden rounded-xl px-6 py-3 font-semibold shadow-lg inline-flex items-center gap-3 border-2 border-white hover:border-none group"
                >
                  <span
                    className="absolute inset-0 bg-[var(--brand-yellow)] origin-bottom-right scale-0 transform transition-transform duration-300 group-hover:scale-100 rounded-xl"
                    aria-hidden
                  />
                  <span className="relative z-10 text-white transition-colors duration-200 group-hover:text-black font-bold text-lg">
                    Watch
                  </span>
                  <SvgArrow className="relative z-10 w-5 h-5 text-white transition-colors duration-200 group-hover:text-black" />
                </a>
              </div>
            </div>
          </div>
        )}

        <Nav />
      </section>

      <section>
        <div className="w-full border-b-2 border-[rgba(250,204,21,0.15)]">
          <div className="max-w-6xl mx-auto px-12 lg:px-24 py-10 md:py-12 my-10 md:my-12 flex flex-col md:flex-row items-stretch md:items-start gap-6 md:gap-12">
            <a
              href="https://open.spotify.com/show/4d1u94a9G8aOJdFk7KmF8l?si=1c8b222c461e4850"
              target="_blank"
              className="relative overflow-hidden rounded-xl px-8 py-4 font-semibold shadow-lg inline-flex justify-center items-center gap-3 bg-[var(--brand-pink)] group"
            >
              <span
                className="absolute inset-0 bg-[var(--brand-yellow)] origin-bottom-right scale-0 transform transition-transform duration-300 group-hover:scale-100 rounded-xl"
                aria-hidden
              />
              <span className="relative z-10 text-white transition-colors duration-200 group-hover:text-black font-bold text-lg md:text-xl text-left">
                Listen on Spotify
              </span>
              <SvgMic className="relative z-10 w-5 h-5 text-white transition-colors duration-200 group-hover:text-black" />
            </a>
            <a
              href="https://www.youtube.com/@wattsyourimpact"
              target="_blank"
              className="relative overflow-hidden rounded-xl px-8 py-4 font-semibold shadow-lg inline-flex justify-center items-center gap-3 bg-[var(--brand-pink)] group"
            >
              <span
                className="absolute inset-0 bg-[var(--brand-yellow)] origin-bottom-right scale-0 transform transition-transform duration-300 group-hover:scale-100 rounded-xl"
                aria-hidden
              />
              <span className="relative z-10 text-white transition-colors duration-200 group-hover:text-black font-bold text-lg md:text-xl text-left">
                Subscribe on YouTube
              </span>
              <SvgArrow className="relative z-10 w-5 h-5 text-white transition-colors duration-200 group-hover:text-black" />
            </a>
          </div>
        </div>
        <div id="episodes">
          <EpisodeListClient excludeId={latest?.id} pageSize={4} />
        </div>
      </section>
      <section className="w-full border-b-2 border-[rgba(250,204,21,0.15)]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-12 mb-10 md:mb-12">
          <h2 className="text-[var(--brand-yellow)] font-semibold font-charleville text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Stay posted on the latest podcast episodes.
          </h2>
          <p className="text-[var(--brand-yellow)] font-charleville mt-3 text-2xl sm:text-4xl md:text-5xl lg:text-6xl">
            Listen on{" "}
            <a
              href="https://open.spotify.com/show/2WuXt8alcwRm3FGOpt9Qkh"
              target="_blank"
              className="text-[var(--brand-orange)] underline"
            >
              Spotify
            </a>{" "}
            or{" "}
            <a
              href="https://podcasts.apple.com/us/podcast/watts-your-impact/id1791522753"
              target="_blank"
              className="text-[var(--brand-orange)] underline"
            >
              Apple Podcasts
            </a>
          </p>
          <p className="text-[var(--brand-yellow)] font-charleville mt-3 text-2xl sm:text-4xl md:text-5xl lg:text-6xl">
            Don&apos;t forget to subscribe to our{" "}
            <a
              href="https://www.youtube.com/@wattsyourimpact"
              target="_blank"
              className="text-[var(--brand-orange)] underline"
            >
              YouTube
            </a>
          </p>
        </div>
      </section>
      <section id="contact">
        <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-24 flex flex-col md:flex-row items-center justify-center w-full gap-8 md:gap-12">
          <p className="text-4xl sm:text-5xl md:text-6xl italic font-bold text-center md:text-left">
            What&apos;s <br className="hidden sm:block" /> your impact?
          </p>
          <div className="flex flex-col items-center md:items-start gap-4">
            <p className="text-base sm:text-lg font-medium tracking-wide max-w-xl text-center md:text-left">
              Everyone has the power to make an impact. Want to share how
              you&apos;re creating change — in your community, your career, or
              your own small way? Send us a mail, Let&apos;s talk about it!
            </p>
            <a
              href="https://wattsyourimpact.com/"
              target="_blank"
              className="overflow-hidden rounded-xl px-6 md:px-8 py-3 md:py-4 font-semibold shadow-lg border border-[var(--brand-yellow)] inline-flex items-center gap-3 hover:bg-[var(--brand-orange)] hover:border-none group"
            >
              <p className="text-[var(--brand-yellow)] transition-colors duration-200 font-bold text-lg md:text-xl group-hover:text-[var(--brand-red)]">
                Send us a mail
              </p>
            </a>
          </div>
        </div>
      </section>
      {/* <section aria-hidden="false" className="marquee py-8">
        <Marquee />
      </section> */}
      <section id="footer" className="w-full border-t border-white/10">
        <div className="flex flex-col items-center justify-between gap-6 pt-10 md:pt-12 max-w-6xl mx-auto px-4 md:px-8 lg:px-12 pb-10">
          <div className="flex flex-col md:flex-row items-center mx-auto justify-between w-full gap-6">
            <Image
              src="/images/logo.svg"
              alt="Watts Your Impact"
              width={120}
              height={120}
              className="object-contain"
            />

            <div className="flex flex-col items-center md:items-end gap-2">
              <p className="text-white text-xl md:text-2xl font-semibold">
                Follow us on socials
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://instagram.com/wattsyourimpact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-[var(--brand-yellow)] hover:bg-white/10"
                >
                  <SvgInstagram width={40} height={40} />
                </a>
                <a
                  href="https://x.com/wattsyourimpact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-[var(--brand-yellow)] hover:bg-white/10"
                >
                  <SvgTwitter width={40} height={40} />
                </a>
                <a
                  href="https://www.tiktok.com/@wattsyourimpact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-[var(--brand-yellow)] hover:bg-white/10"
                >
                  <SvgTiktok width={40} height={40} />
                </a>
                <a
                  href="mailto:hello@wattsyourimpact.org"
                  className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-[var(--brand-yellow)] hover:bg-white/10"
                >
                  <SvgMail width={40} height={40} />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-6 flex flex-col md:flex-row items-center justify-between text-white/60 text-xs sm:text-sm md:text-base gap-2">
            <div>© {new Date().getFullYear()} Watts Your Impact</div>
          </div>
        </div>
      </section>
      <ScrollToTopButton />
    </div>
  );
}
