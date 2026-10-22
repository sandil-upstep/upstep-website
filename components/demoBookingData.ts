// Data and time helpers for the demo booking drawer (DemoBookingDrawer.tsx),
// ported from the "Demo booking flow revamp" reference.
//
// TODO: availability (`slotsOn`) and `bookDemo` are stand-ins until the
// booking API exists: the slots are a fixed IST schedule thinned out by a
// repeatable pattern, and booking only waits a moment.

export type Zone = {
  id: string; // IANA zone
  region: string;
  country: string; // ISO code, for the phone field's default
  locale: string; // gives Intl the zone's usual abbreviation (IST, BST, EDT…)
};

export const ZONES: Zone[] = [
  { id: "Asia/Kolkata", region: "India", country: "IN", locale: "en-IN" },
  { id: "Asia/Dubai", region: "UAE", country: "AE", locale: "en-AE" },
  { id: "Europe/London", region: "UK", country: "GB", locale: "en-GB" },
  { id: "Europe/Berlin", region: "Europe", country: "DE", locale: "en-GB" },
  { id: "Asia/Singapore", region: "Singapore", country: "SG", locale: "en-SG" },
  { id: "Australia/Sydney", region: "Sydney", country: "AU", locale: "en-AU" },
  { id: "America/New_York", region: "US East", country: "US", locale: "en-US" },
  { id: "America/Los_Angeles", region: "US West", country: "US", locale: "en-US" },
];

// Zones that share one of the listed zones' clocks.
const ZONE_ALIASES: Record<string, string> = {
  "Asia/Calcutta": "Asia/Kolkata",
  "Europe/Paris": "Europe/Berlin",
  "Europe/Amsterdam": "Europe/Berlin",
  "Australia/Melbourne": "Australia/Sydney",
  "America/Toronto": "America/New_York",
};

// A listed zone, or any other IANA zone named after its city.
export const zoneFor = (id: string): Zone =>
  ZONES.find((z) => z.id === (ZONE_ALIASES[id] ?? id)) ?? {
    id,
    region: id.split("/").pop()!.replace(/_/g, " "),
    country: "",
    locale: "en-GB",
  };

// The visitor's own zone: a listed one when it matches, otherwise their zone
// itself, added to the list, so times are always shown in their clock.
export function detectZone(): { zone: Zone; zones: Zone[]; detected: boolean } {
  let id = "";
  try {
    id = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {}
  if (!id) return { zone: ZONES[0], zones: ZONES, detected: false };
  const zone = zoneFor(id);
  return { zone, zones: ZONES.includes(zone) ? ZONES : [zone, ...ZONES], detected: true };
}

const tzName = (zone: Zone, at: number, style: "short" | "shortOffset") =>
  new Intl.DateTimeFormat(style === "short" ? zone.locale : "en-US", { timeZone: zone.id, timeZoneName: style })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value ?? "";
// "IST", "BST"… (or "GMT+3" where a zone has no abbreviation).
export const zoneShort = (zone: Zone, at = Date.now()) => tzName(zone, at, "short").replace(/^GMT\+0$/, "GMT");
// "India · IST (UTC+5:30)"
export function zoneLabel(zone: Zone, at = Date.now()) {
  const off = tzName(zone, at, "shortOffset").replace("GMT", "UTC").replace("-", "−");
  return `${zone.region} · ${zoneShort(zone, at)} (${off === "UTC" ? "UTC+0" : off})`;
}

// digits: how long the number is after the country code, without a trunk 0.
export type Country = { iso: string; name: string; dial: string; digits: readonly [number, number] };
export const COUNTRIES: Country[] = (
  [
    ["IN", "India", "+91", 10, 10],
    ["AE", "United Arab Emirates", "+971", 8, 9],
    ["GB", "United Kingdom", "+44", 9, 10],
    ["US", "United States / Canada", "+1", 10, 10],
    ["SG", "Singapore", "+65", 8, 8],
    ["AU", "Australia", "+61", 9, 9],
    ["DE", "Germany", "+49", 7, 11],
    ["QA", "Qatar", "+974", 8, 8],
    ["SA", "Saudi Arabia", "+966", 9, 9],
    ["OM", "Oman", "+968", 8, 8],
    ["KW", "Kuwait", "+965", 8, 8],
    ["MY", "Malaysia", "+60", 8, 10],
    ["NZ", "New Zealand", "+64", 8, 10],
    ["ZA", "South Africa", "+27", 9, 9],
    ["HK", "Hong Kong", "+852", 8, 8],
  ] as const
).map(([iso, name, dial, min, max]) => ({ iso, name, dial, digits: [min, max] as const }));
export const countryFor = (iso: string) => COUNTRIES.find((c) => c.iso === iso) ?? COUNTRIES[0];
// "10 digits", "8–9 digits"
export const digitsLabel = ({ digits: [min, max] }: Country) => `${min === max ? min : `${min}–${max}`} digits`;

// The number's digits after the country code, however it was typed: "98765
// 43210", "+91 98765 43210", "0091…", "919876543210", or with a trunk 0
// ("07700 900123" in the UK). Null when it isn't a phone number.
export function nationalNumber(value: string, c: Country): string | null {
  if (!/^[\d\s+\-().]*$/.test(value)) return null;
  const dial = c.dial.slice(1);
  let d = value.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2).startsWith(dial) ? d.slice(2 + dial.length) : d.slice(2);
  else if ((value.trim().startsWith("+") || d.length > c.digits[1]) && d.startsWith(dial)) d = d.slice(dial.length);
  d = d.replace(/^0/, "");
  return d.length >= c.digits[0] && d.length <= c.digits[1] ? d : null;
}

export const AGES = ["4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16+"];
export const LEVELS = [
  { label: "New to chess", sub: "Never played before" },
  { label: "Knows the moves", sub: "Plays a little at home" },
  { label: "Plays regularly", sub: "At school, a club or tournaments" },
];

export type Details = {
  firstName: string;
  lastName: string;
  age: string;
  level: string;
  parentName: string;
  email: string;
  code: string;
  phone: string;
  code2: string;
  phone2: string;
};
export const EMPTY_DETAILS: Details = {
  firstName: "",
  lastName: "",
  age: "",
  level: "",
  parentName: "",
  email: "",
  code: "IN",
  phone: "",
  code2: "IN",
  phone2: "",
};
// Each field's problem: left empty (when it's needed), or not valid.
export type FieldError = "missing" | "invalid";
export type DetailErrors = Partial<
  Record<"firstName" | "lastName" | "age" | "level" | "parentName" | "email" | "phone" | "phone2", FieldError>
>;
// Letters in any script, with the spaces, apostrophes, hyphens and dots names have.
const NAME = /^\p{L}[\p{L}\p{M}' .’-]*$/u;
// One @, a dotted domain with no empty parts, and a top-level domain of letters.
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.\p{L}{2,}$/u;
export const isName = (v: string) => NAME.test(v);
export const isEmail = (v: string) => EMAIL.test(v);
const check = (value: string, ok: (v: string) => boolean, required: boolean): FieldError | undefined => {
  const v = value.trim();
  if (!v) return required ? "missing" : undefined;
  return ok(v) ? undefined : "invalid";
};
export function validate(f: Details): DetailErrors {
  const e: DetailErrors = {
    firstName: check(f.firstName, isName, true),
    lastName: check(f.lastName, isName, false),
    age: f.age ? undefined : "missing",
    level: f.level ? undefined : "missing",
    parentName: check(f.parentName, isName, true),
    email: check(f.email, isEmail, true),
    phone: check(f.phone, (v) => nationalNumber(v, countryFor(f.code)) != null, true),
    phone2: check(f.phone2, (v) => nationalNumber(v, countryFor(f.code2)) != null, false),
  };
  return Object.fromEntries(Object.entries(e).filter(([, v]) => v));
}

// The details as they're sent: trimmed, single-spaced, numbers as bare digits.
export function cleanDetails(f: Details): Details {
  const text = (v: string) => v.trim().replace(/\s+/g, " ");
  return {
    ...f,
    firstName: text(f.firstName),
    lastName: text(f.lastName),
    parentName: text(f.parentName),
    email: f.email.trim(),
    phone: nationalNumber(f.phone, countryFor(f.code)) ?? "",
    phone2: nationalNumber(f.phone2, countryFor(f.code2)) ?? "",
  };
}

// ---- Calendar ----
// A calendar day in the chosen zone.
export type Day = { y: number; m: number; d: number };
export const dayKey = (x: Day) => `${x.y}-${x.m}-${x.d}`;
export const sameDay = (a: Day | null, b: Day | null) => !!a && !!b && a.y === b.y && a.m === b.m && a.d === b.d;
export const addDays = (x: Day, n: number): Day => {
  const t = new Date(Date.UTC(x.y, x.m, x.d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
};
export const weekday = (x: Day) => new Date(Date.UTC(x.y, x.m, x.d)).getUTCDay(); // 0 = Sunday

const partsCache = new Map<string, Intl.DateTimeFormat>();
// The zone's wall clock at an instant.
export function wallClock(at: number, zone: Zone) {
  let f = partsCache.get(zone.id);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone.id,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    });
    partsCache.set(zone.id, f);
  }
  const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
  return { day: { y: +p.year, m: +p.month - 1, d: +p.day } as Day, minutes: +p.hour * 60 + +p.minute };
}

export const DEMO_MINUTES = 20;
const HOLD_DAYS = 28; // how far ahead slots open
const LEAD_MS = 2 * 3600e3; // the soonest a demo can be booked
// The coaches' schedule: start times in IST, minutes after midnight.
const SLOTS_IST = [540, 565, 585, 610, 635, 660, 685, 705, 750, 780, 810, 840, 870, 900, 930, 960, 1020, 1050, 1080, 1110, 1140, 1170, 1200];
const IST_OFFSET = 330;

export type Slot = { at: number; minutes: number }; // start instant, and its wall-clock minutes in the zone
// Open slots on a day in `zone`, earliest first.
export function slotsOn(day: Day, zone: Zone, now: number): Slot[] {
  const out: Slot[] = [];
  // A day in the zone overlaps up to three days in India.
  for (let k = -1; k <= 1; k++) {
    const ist = addDays(day, k);
    const w = weekday(ist);
    if (w === 5 || w === 0) continue; // placeholder: no demos on Fridays and Sundays
    const n = Math.round(Date.UTC(ist.y, ist.m, ist.d) / 864e5);
    SLOTS_IST.forEach((m, j) => {
      if ((n * 31 + j * 17 + w * 7) % 9 <= 2) return; // placeholder: some slots already taken
      const at = Date.UTC(ist.y, ist.m, ist.d, 0, m - IST_OFFSET);
      if (at < now + LEAD_MS || at > now + HOLD_DAYS * 864e5) return;
      const wall = wallClock(at, zone);
      if (sameDay(wall.day, day)) out.push({ at, minutes: wall.minutes });
    });
  }
  return out.sort((a, b) => a.at - b.at);
}

// The first day in `zone` with an open slot, from `now`'s day on.
export function firstOpenDay(zone: Zone, now: number): Day | null {
  let day = wallClock(now, zone).day;
  for (let i = 0; i <= HOLD_DAYS + 1; i++, day = addDays(day, 1)) if (slotsOn(day, zone, now).length) return day;
  return null;
}

// ---- Labels ----
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ordinal = (n: number) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th");

// "10 am", "10:35 am"
export function timeLabel(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
}
// "Wed, 30 Sept"
export const dayShort = (x: Day) => `${WEEKDAYS[weekday(x)].slice(0, 3)}, ${x.d} ${MONTHS_SHORT[x.m]}`;
// "Wednesday, 30 September"
export const dayLong = (x: Day) => `${WEEKDAYS[weekday(x)]}, ${x.d} ${MONTHS[x.m]}`;
// "Wednesday, 30th September, 2026"
export const dayFull = (x: Day) => `${WEEKDAYS[weekday(x)]}, ${ordinal(x.d)} ${MONTHS[x.m]}, ${x.y}`;

export const cap = (v: string) => {
  const t = v.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
};

export type Booking = Details & { slot: number; timeZone: string };
// TODO: send the booking to the backend. Resolves once it's booked.
export function bookDemo(booking: Booking): Promise<void> {
  void booking;
  return new Promise((resolve) => setTimeout(resolve, 900));
}

// ---- Handing the booking to the confirmation page ----
// The confirmation opens in a new tab (/book-demo/confirmed?id=…) the moment
// "Confirm" is pressed, and this tab tells it how the booking went through
// localStorage, which the site's tabs share. Only what the page shows is kept,
// for a week.
// TODO: once the API saves bookings, have the confirmation page load the
// booking by its id from there instead.
export type BookingSummary = Pick<Details, "firstName" | "lastName" | "age" | "level" | "email"> & {
  slot: number;
  timeZone: string;
};
export type StoredBooking = { status: "pending" } | { status: "booked"; booking: BookingSummary } | { status: "failed" };
const STORE_PREFIX = "upstep-demo-booking:";
const STORE_MS = 7 * 864e5;
export const bookingKey = (id: string) => STORE_PREFIX + id;
export const newBookingId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

export function saveBooking(id: string, record: StoredBooking) {
  try {
    const now = Date.now();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k?.startsWith(STORE_PREFIX) || k === bookingKey(id)) continue;
      const old = readBooking(localStorage.getItem(k));
      if (!old || now - old.savedAt > STORE_MS) localStorage.removeItem(k);
    }
    localStorage.setItem(bookingKey(id), JSON.stringify({ ...record, savedAt: now }));
  } catch {}
}
export function readBooking(raw: string | null): (StoredBooking & { savedAt: number }) | null {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
