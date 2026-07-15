// Live-events data for Watts Your Impact Live.
//
// The upcoming event is drawn from the WYI Live concept brief; the past
// edition (Power Circle) uses details from its speaker brief. Swap for a
// CMS/API source when ready.

export type LiveSession = {
  id: string;
  /** 1-based ordering within its event. */
  number: number;
  title: string;
  /** Short descriptor shown under the title. */
  caption?: string;
  speaker?: string;
  role?: string;
  duration?: string;
  /** Video link — a Google Drive "/view" URL or any external video URL. */
  videoUrl?: string;
};

/** A headline stat shown on the upcoming-event card. */
export type LiveHighlight = {
  value: string;
  label: string;
};

export type LiveEvent = {
  id: string;
  title: string;
  /** Edition label, e.g. "First Edition". */
  edition?: string;
  /** Secondary line under the title. */
  subtitle?: string;
  tagline: string;
  /** Human-readable date, e.g. "June 2025" or "Coming 2026". */
  date: string;
  location: string;
  status: "past" | "upcoming";
  attendees?: number;
  speakerCount?: number;
  /** Short audience descriptor, e.g. "20–25 women". */
  audience?: string;
  /** A single question the edition was built around. */
  question?: string;
  /** Host / convenor credit line. */
  host?: string;
  registerUrl?: string;
  /** Headline stats for the upcoming-event card. */
  highlights?: LiveHighlight[];
  /** Discussion areas / themes explored at the event. */
  topics?: string[];
  /** Recordings from the event. */
  sessions: LiveSession[];
  /** Google Drive file IDs for event photos. */
  gallery?: string[];
};

/** Convert a Google Drive "/view" share URL into an embeddable player URL. */
export function drivePreviewUrl(viewUrl: string): string {
  return viewUrl.replace(/\/view.*$/, "/preview");
}

/** Extract the file ID from a Google Drive "/file/d/<id>/..." URL. */
export function driveFileId(url: string): string {
  const match = url.match(/\/d\/([^/]+)/);
  return match ? match[1] : "";
}

/** Build a Google Drive image URL from a file ID (file must be link-shared). */
export function driveImageUrl(id: string, width = 1600): string {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;
}

export const liveEvents: LiveEvent[] = [
  {
    id: "next-live",
    title: "The People Powering Africa's Energy Future",
    tagline:
      "A live podcast experience bringing 4–5 of the energy sector's most influential voices together for one moderated, unfiltered conversation — professionally recorded and livestreamed for the room and the world.",
    date: "Coming 2026",
    location: "Lagos, Nigeria",
    status: "upcoming",
    speakerCount: 5,
    registerUrl:
      "mailto:info@wattsyourimpact.com?subject=Watts%20Your%20Impact%20Live%20%E2%80%94%20Register%20interest",
    highlights: [
      { value: "4–5", label: "Energy leaders across the value chain" },
      { value: "50–100", label: "Guests live in the room" },
      { value: "Live + Streamed", label: "Join in person or online" },
    ],
    topics: [
      "Leadership in energy",
      "Career journeys",
      "Energy access & infrastructure",
      "Renewables & sustainability",
      "Innovation & technology",
      "Investment & financing",
      "Talent & workforce",
    ],
    sessions: [],
  },
  {
    id: "power-circle",
    title: "Power Circle",
    edition: "First Edition",
    subtitle: "Landing Global Roles — What It Actually Takes",
    tagline:
      "An intimate, invite-only gathering for mid-career women in energy. One senior executive, one room, and a 60-minute fireside on what it actually takes to build a global career — no panels, no keynotes, just honesty.",
    question: "How do you actually land a global role?",
    host: "An EnergyHaus × Watts Your Impact collaboration · Hosted by Tosin George, Founder, EnergyHaus",
    date: "June 2025",
    location: "Lagos",
    status: "past",
    attendees: 25,
    audience: "20–25 women",
    speakerCount: 1,
    topics: [
      "Your journey",
      "Visibility & credibility",
      "The personal cost of ambition",
      "Being an African woman in global spaces",
      "What the landscape looks like now",
    ],
    sessions: [
      {
        id: "pc-guest",
        number: 1,
        title: "The fireside, in full",
        caption: "In conversation with the guest speaker",
        videoUrl:
          "https://drive.google.com/file/d/1gcz6ezaIeYIZAG7cvBFVIx99Q_0UVyll/view",
      },
      {
        id: "pc-takeaways",
        number: 2,
        title: "Key takeaways",
        caption: "The moments that landed",
        videoUrl:
          "https://drive.google.com/file/d/1K-nepq4-vRr7YGPpYT2-pfUUhDY4gX3m/view",
      },
      {
        id: "pc-coverage",
        number: 3,
        title: "Event coverage",
        caption: "Inside the room",
        videoUrl:
          "https://drive.google.com/file/d/1IWezfy2OhRUISfNYFruXWitjzzIWskrv/view",
      },
    ],
    gallery: [
      "1BnvGOKmborW3OrlCEAza2T-s8--H17RK",
      "1FlWnLLly2AnHCPsM_vUzrBuWzfSUK5Xo",
      "1HIvHh7IBDLn1iNv4L90IZX8lZeHcl9JG",
      "1weX912MLJ1n3LjpiQY0bHdkNFg656yEv",
      "19H1d_bfASLoZpDI0Qx3_8Ps35bw3tvtj",
      "1pIlD7MjLC6CQsVCRrqc-GZ6doaM0gVum",
      "1itGxPM_42qjM7gN7VzEC6b-jzfzKG8j9",
      "1SixUNgLVITECv4Y8hGTtKGyLJEfefjF-",
    ],
  },
];

export const nextEvent = liveEvents.find((e) => e.status === "upcoming");

export const pastEvents = liveEvents.filter((e) => e.status === "past");

/** Most recent past edition — used where a single recap is needed. */
export const featuredRecap = pastEvents[0] ?? liveEvents[0];
