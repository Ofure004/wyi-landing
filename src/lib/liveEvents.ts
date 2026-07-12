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
  tagline: string;
  /** Human-readable date, e.g. "March 2026" or "Coming 2026". */
  date: string;
  location: string;
  status: "past" | "upcoming";
  attendees?: number;
  speakerCount?: number;
  registerUrl?: string;
  /** Headline stats for the upcoming-event card. */
  highlights?: LiveHighlight[];
  /** Discussion areas / themes for the upcoming event. */
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
    title: "Inside Africa's energy transition — live, in one room.",
    tagline:
      "80 attendees. 5 leaders across the value chain. One unfiltered conversation — watch it back, session by session.",
    date: "March 2026",
    location: "Lagos",
    status: "past",
    attendees: 80,
    speakerCount: 5,
    sessions: [
      {
        id: "vol-1-s1",
        number: 1,
        title: "Who actually builds the grid",
        speaker: "Amara Okafor",
        role: "Head of Distribution, PowerLink NG",
        duration: "24:10",
      },
      {
        id: "vol-1-s2",
        number: 2,
        title: "Solar at scale — the messy middle",
        speaker: "Tunde Bakare",
        role: "Founder, SunReach",
        duration: "31:47",
      },
      {
        id: "vol-1-s3",
        number: 3,
        title: "The talent pipeline nobody funds",
        speaker: "Zainab Musa",
        role: "Director, Energy Skills Africa",
        duration: "28:33",
      },
    ],
  },
  {
    id: "vol-0",
    volume: "Vol. 0",
    title: "Why we went live",
    tagline:
      "The pilot conversation that started it all — 40 people, one long night of honesty.",
    date: "October 2025",
    location: "Abuja",
    status: "past",
    attendees: 40,
    speakerCount: 3,
    sessions: [
      {
        id: "vol-0-s1",
        number: 1,
        title: "From podcast to stage",
        speaker: "The WYi Team",
        role: "Watts Your Impact",
        duration: "19:52",
      },
      {
        id: "vol-0-s2",
        number: 2,
        title: "What the room taught us",
        speaker: "Guest Panel",
        role: "Founders & operators",
        duration: "22:04",
      },
    ],
  },
];

export const nextEvent = liveEvents.find((e) => e.status === "upcoming");

export const pastEvents = liveEvents.filter((e) => e.status === "past");

/** Most recent past edition — used where a single recap is needed. */
export const featuredRecap = pastEvents[0] ?? liveEvents[0];
