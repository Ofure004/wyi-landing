// Live-events data for Watts Your Impact Live.
//
// The upcoming event is drawn from the WYI Live concept brief; past editions
// use placeholder data until real recaps are available. Swap for a CMS/API
// source when ready.

export type LiveSession = {
  id: string;
  /** 1-based session number within its event. */
  number: number;
  title: string;
  speaker: string;
  role: string;
  duration: string;
  /** Optional recording link; falls back to the live page when absent. */
  videoUrl?: string;
};

/** A headline stat shown on the upcoming-event card. */
export type LiveHighlight = {
  value: string;
  label: string;
};

export type LiveEvent = {
  id: string;
  /** Short label, e.g. "Vol. 1". */
  volume: string;
  title: string;
  /** Edition subtitle, e.g. "First Edition · Landing Global Roles". */
  subtitle?: string;
  tagline: string;
  /** Human-readable date, e.g. "March 2026" or "Coming 2026". */
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
  sessions: LiveSession[];
};

export const liveEvents: LiveEvent[] = [
  {
    id: "vol-2",
    volume: "Vol. 2",
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
    id: "vol-1",
    volume: "Vol. 1",
    title: "Power Circle",
    subtitle: "First Edition · Landing Global Roles — What It Actually Takes",
    tagline:
      "An intimate, invite-only gathering for mid-career women in energy. One senior executive, one room, and a 60-minute fireside on what it actually takes to build a global career — no panels, no keynotes, just honesty.",
    question: "How do you actually land a global role?",
    host: "Hosted by Tosin George · Founder, EnergyHaus",
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
    sessions: [],
  },
];

export const nextEvent = liveEvents.find((e) => e.status === "upcoming");

export const pastEvents = liveEvents.filter((e) => e.status === "past");

/** Most recent past edition — used where a single recap is needed. */
export const featuredRecap = pastEvents[0] ?? liveEvents[0];
