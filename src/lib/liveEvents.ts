// Placeholder / dummy data for Watts Your Impact Live events.
// Replace with real event data (or a CMS/API source) when available.

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

export type LiveEvent = {
  id: string;
  /** Short label, e.g. "Vol. 1". */
  volume: string;
  title: string;
  tagline: string;
  /** Human-readable date, e.g. "March 2026". */
  date: string;
  location: string;
  status: "past" | "upcoming";
  attendees?: number;
  speakerCount?: number;
  registerUrl?: string;
  sessions: LiveSession[];
};

export const liveEvents: LiveEvent[] = [
  {
    id: "vol-2",
    volume: "Vol. 2",
    title: "Financing the transition",
    tagline:
      "Capital, policy and the people closing Africa's energy access gap.",
    date: "Q4 2026",
    location: "Lagos",
    status: "upcoming",
    speakerCount: 6,
    registerUrl: "#register",
    sessions: [],
  },
  {
    id: "vol-1",
    volume: "Vol. 1",
    title: "The people powering Africa's energy future — live, in one room.",
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

export const featuredRecap =
  liveEvents.find((e) => e.status === "past") ?? liveEvents[0];

export const nextEvent = liveEvents.find((e) => e.status === "upcoming");
