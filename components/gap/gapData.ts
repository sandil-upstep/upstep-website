// Content and helpers for the Grandmaster Accelerator Program page
// (app/(site)/gap), ported from the "GAP Landing" reference. Time zones,
// phone numbers and name/email checks come from the demo booking drawer's
// helpers (demoBookingData.ts), so both forms behave the same.
//
// TODO: `registerForGap` is a stand-in until the registration API exists.

import { addDays, timeLabel, wallClock, weekday, ZONES, type Zone } from "../demoBookingData";

// ---- Session preview ----
// TODO: the reference plays one video for every title; swap in each video's
// own YouTube ID once they're published.
export const PREVIEW_VIDEO_ID = "XHOmBV4js_E";
export const VIDEOS = [
  "Rook to e6 for a winning advantage",
  "Master active moves & logic",
  "King & 3 pawns vs king: the draw",
  "Unbelievable attack & king hunt",
  "A GM’s shocking exchange sacrifice",
  "Endgame secrets: ace your technique",
  "How to win a crucial match",
].map((title) => ({ title, videoId: PREVIEW_VIDEO_ID }));

// The 1280×720 still (HD uploads have one): 16:9 without the letterboxing
// hqdefault has, and sharp at the player's size.
export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
export const ytEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;

// ---- Program ----
export type Module = {
  title: string;
  amount: string; // shown in the module list
  big: string; // and large in its detail panel, over `unit`
  unit: string;
  tag: string;
  body: string;
  icon: { src: string; width: number; height: number };
  hours?: number; // the modules that make up the year's training hours
  short?: string; // and their names on the hours bar
};

export const MODULES: Module[] = [
  {
    title: "GM Live Masterclass",
    amount: "72 hrs",
    big: "72",
    unit: "hours a year, live",
    tag: "Core program",
    body: "Learn directly from Grandmasters in live sessions. Complex ideas, taught the simplest way. Includes 4 masterclasses with GM Viswanathan Anand.",
    icon: { src: "/images/structured/group-class.png", width: 1254, height: 1254 },
    hours: 72,
    short: "GM Live",
  },
  {
    title: "Booster Live Masterclass",
    amount: "72 hrs",
    big: "72",
    unit: "hours a year, live",
    tag: "Complimentary",
    body: "Fast, hands-on sessions packed with ideas you can take straight into your next game.",
    icon: { src: "/images/structured/bulb.webp", width: 166, height: 197 },
    hours: 72,
    short: "Booster",
  },
  {
    title: "Recorded GM Bonus Vault",
    amount: "72 hrs",
    big: "72",
    unit: "hours a year, on demand",
    tag: "Complimentary",
    body: "Extra Grandmaster sessions on top of the live classes. Watch and rewatch whenever you like.",
    icon: { src: "/images/structured/books.webp", width: 219, height: 178 },
    hours: 72,
    short: "Bonus Vault",
  },
  {
    title: "Psychology Sessions",
    amount: "4",
    big: "4",
    unit: "sessions a year",
    tag: "Mindset",
    body: "Build a champion’s mindset: focus, resilience and calm under tournament pressure.",
    icon: { src: "/images/structured/target.png", width: 1254, height: 1254 },
  },
  {
    title: "Parent–Teacher Meetings",
    amount: "4",
    big: "4",
    unit: "meetings a year",
    tag: "Progress",
    body: "Regular check-ins with the coaches on progress, plans and any questions you have.",
    icon: { src: "/images/structured/roadmap.png", width: 1254, height: 1254 },
  },
];

export const TOTAL_HOURS = MODULES.reduce((sum, m) => sum + (m.hours ?? 0), 0); // 216
export const FREE_HOURS = 144; // the Booster and Bonus Vault hours

// ---- Expected outcome ----
export const RATING_MIN = 1400;
export const RATING_MAX = 1800;
export const RATING_GAIN = 250;
// The projection's track runs from 1300 to 2200.
const TRACK_FROM = 1300;
const TRACK_SPAN = 900;
export const trackPct = (rating: number) => `${(((rating - TRACK_FROM) / TRACK_SPAN) * 100).toFixed(1)}%`;
export const gainPct = `${((RATING_GAIN / TRACK_SPAN) * 100).toFixed(1)}%`;

// ---- Fees ----
export type Currency = "INR" | "USD";
export const FEES: Record<Currency, { value: number; price: number; symbol: string; locale: string; label: string }> = {
  INR: { value: 105600, price: 25000, symbol: "₹", locale: "en-IN", label: "₹ INR" },
  USD: { value: 1200, price: 290, symbol: "US$", locale: "en-US", label: "$ USD" },
};
export const FIDE_DISCOUNT = 0.1;
export const MONTHS = 12;
export const feeFor = (currency: Currency, fide: boolean) => FEES[currency].price * (fide ? 1 - FIDE_DISCOUNT : 1);
// "₹25,000", "₹1,05,600", "US$290"
export function money(amount: number, currency: Currency) {
  const { symbol, locale } = FEES[currency];
  return symbol + new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(amount));
}
// The program's prices are in rupees in India and dollars everywhere else.
export const currencyFor = (country: string): Currency => (country === "IN" ? "INR" : "USD");

// ---- Eligibility ----
export const PLATFORMS = ["FIDE", "Chess.com", "Lichess"] as const;
export type Platform = (typeof PLATFORMS)[number];
export type Eligibility = "empty" | "ok" | "low" | "high";

export function eligibility(platform: Platform, value: string): Eligibility {
  const r = parseInt(value, 10);
  if (!r) return "empty";
  if (platform === "FIDE") return r < RATING_MIN ? "low" : r > RATING_MAX ? "high" : "ok";
  return r >= (platform === "Chess.com" ? 1000 : 1200) ? "ok" : "low";
}

export const ratingHint = (platform: Platform) =>
  platform === "FIDE" ? "Your FIDE rating (any format)" : `Your ${platform} rapid rating`;

// What to do next: register, or (below or above GAP's range) talk to the team
// through a free demo.
export const ELIGIBILITY: Record<Eligibility, { title: string; body: string; next?: "register" | "demo"; nextLabel?: string }> = {
  empty: {
    title: "Enter your rating",
    body: "GAP is for FIDE 1400–1800, Chess.com rapid 1000+ or Lichess rapid 1200+.",
  },
  ok: {
    title: "You qualify for GAP",
    body: "Your rating is in range. Seats are limited, so register early to secure yours.",
    next: "register",
    nextLabel: "Register now",
  },
  low: {
    title: "Not quite yet",
    body: "Our level programs build you up to GAP. Start with a free demo and we’ll map your path.",
    next: "demo",
    nextLabel: "Book a free demo",
  },
  high: {
    title: "You’re above GAP’s usual range",
    body: "Talk to us about master-level coaching. We’ll find the right fit.",
    next: "demo",
    nextLabel: "Talk to our team",
  },
};

// ---- Schedule ----
// Monday first, as the week grid shows it.
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const SESSION_MINUTES = 90;
export const SESSION_TYPES = { gm: "GM Live", booster: "Booster" } as const;
export type SessionType = keyof typeof SESSION_TYPES;

const IST = ZONES[0];
const IST_OFFSET = 330;

export type BatchId = 1 | 2;
// Sessions as the coaches run them, in India: weekday (0 = Sunday) and start,
// in minutes after midnight IST.
export const BATCHES: { id: BatchId; name: string; note: string; sessions: { type: SessionType; day: number; start: number }[] }[] = [
  {
    id: 1,
    name: "Batch 1",
    note: "Afternoon slot in India",
    sessions: [
      { type: "booster", day: 3, start: 1140 }, // Wed 7 pm
      { type: "gm", day: 6, start: 960 }, // Sat 4 pm
    ],
  },
  {
    id: 2,
    name: "Batch 2",
    note: "Evening slot in India",
    sessions: [
      { type: "gm", day: 6, start: 1230 }, // Sat 8:30 pm
      { type: "booster", day: 0, start: 1230 }, // Sun 8:30 pm
    ],
  },
];
export const batchFor = (id: BatchId) => BATCHES.find((b) => b.id === id) ?? BATCHES[0];

// day: 0 = Monday, in the zone; start and end in minutes after its midnight.
export type Session = { type: SessionType; day: number; start: number; end: number };

// A batch's sessions in `zone`, as they fall in the week from `now`, Monday
// first. Worked out from real instants, so a zone's daylight saving moves them
// as it should, and a session can land on another day there (Sunday evening
// in India is Sunday morning in New York, but Monday in Sydney).
export function sessionsIn(id: BatchId, zone: Zone, now: number): Session[] {
  const today = wallClock(now, IST).day;
  return batchFor(id)
    .sessions.map((s) => {
      let day = today;
      while (weekday(day) !== s.day) day = addDays(day, 1);
      const at = Date.UTC(day.y, day.m, day.d, 0, s.start - IST_OFFSET);
      const from = wallClock(at, zone);
      return {
        type: s.type,
        day: (weekday(from.day) + 6) % 7,
        start: from.minutes,
        end: wallClock(at + SESSION_MINUTES * 60e3, zone).minutes,
      };
    })
    .sort((a, b) => a.day - b.day || a.start - b.start);
}
// "4 pm – 5:30 pm"
export const sessionTime = (s: Session) => `${timeLabel(s.start)} – ${timeLabel(s.end)}`;
// "Sat 4 pm"
export const sessionShort = (s: Session) => `${DAYS[s.day]} ${timeLabel(s.start)}`;

// ---- Registration ----
export const REGIONS = [
  { label: "India", country: "IN" },
  { label: "USA", country: "US" },
  { label: "Australia", country: "AU" },
  { label: "Singapore", country: "SG" },
  { label: "UK", country: "GB" },
  { label: "UAE", country: "AE" },
  { label: "Other countries", country: "" },
];

export type Registration = {
  name: string;
  email: string;
  region: string;
  code: string; // the WhatsApp number's country (ISO)
  phone: string; // its digits after the country code
  batch: BatchId;
  currency: Currency;
  fide: boolean;
};

// TODO: send the registration to the backend. Resolves once it's received.
export function registerForGap(registration: Registration): Promise<void> {
  void registration;
  return new Promise((resolve) => setTimeout(resolve, 900));
}
