// Copy for the courses overview page (app/(site)/courses), from its design
// (chess-levels.html). Placeholder copy ("Some title goes here", lorem ipsum,
// "Title goes here") is kept as the design has it until the real text lands.

export type Format = {
  name: string;
  tone: "peach" | "salmon" | "sky";
  values: string[]; // one per COMPARE_ROWS entry
  note: string;
};

export const COMPARE_ROWS = ["Frequency", "No. of sessions", "Duration", "Age group", "Batch size", "Format"];

export const FORMATS: Format[] = [
  {
    name: "One-on-one",
    tone: "peach",
    values: ["2 days/week", "20", "2.5 months", "4–5 years", "1", "Live online sessions"],
    note: "Get personalised, one-on-one chess coaching with a dedicated coach.",
  },
  {
    name: "Focused Group",
    tone: "salmon",
    values: ["2 days/week", "24", "3 months", "5–15 years", "4", "Live online sessions"],
    note: "Focuses more on implementation & frequent analysis in a smaller group.",
  },
  {
    name: "Regular Group",
    tone: "sky",
    values: ["2 days/week", "24", "3 months", "5–15 years", "8", "Live online sessions"],
    note: "Offers flexibility in learning chess at a steady pace.",
  },
];

export const COMPARE_FOOTNOTE = "Game Analysis | Live Chess Playing | Tests | Assessment will be part of the curriculum";

export const STATS = [
  { value: 30, suffix: "k+", label: "Chess Students Trained", icon: "/images/structured/one-on-one.png" },
  { value: 517, suffix: "k+", label: "Chess Classes Delivered", icon: "/images/structured/chessboard.png" },
  { value: 120, suffix: "+", label: "Certified Coaches", icon: "/images/structured/medal.png" },
  { value: 15, suffix: "+", label: "Countries", icon: "/images/structured/target.png" },
];

export const QUOTES = [
  {
    text: "Very professional chess coaches and proficient. My kid’s interest in chess has gone up and he is able to play very well!",
    name: "L. Thomas – Parent",
  },
  {
    text: "The weekly game reviews made the biggest difference. My daughter now explains her own mistakes before the coach does.",
    name: "A. Mehta – Parent",
  },
  {
    text: "Classes are structured and fun. My son went from learning the moves to playing his first rated tournament in a year.",
    name: "S. Okafor – Parent",
  },
];

// The collage's four photos, placed by .courses-coach--p1…p4.
export const COACH_PHOTOS = [
  { src: "/images/courses/coach-2.png", width: 370, height: 371, caption: undefined },
  { src: "/images/courses/coach-1.png", width: 335, height: 336, caption: "FIDE Rating: 1800", light: true },
  { src: "/images/courses/coach-1.png", width: 335, height: 336, caption: undefined, light: true },
  { src: "/images/courses/coach-2.png", width: 370, height: 371, caption: "FIDE Rating: 1800" },
];

// Three staggered rows, as in the design; a benefit without an icon is padded
// to the same height.
export const BENEFIT_ROWS: { label: [string, string]; icon?: string }[][] = [
  [
    { label: ["Personal Coach to", "teach & Guide"], icon: "/images/structured/one-on-one.png" },
    { label: ["Puzzles for", "Targeted Growth"], icon: "/images/structured/puzzle.png" },
    { label: ["Complimentary", "Practical Sessions"], icon: "/images/structured/group-class.png" },
  ],
  [
    { label: ["Analysis", "of Games"], icon: "/images/structured/game-analysis.png" },
    { label: ["Notes", "for Revision"] },
  ],
  [
    { label: ["Regular", "Tournaments"], icon: "/images/structured/trophy.png" },
    { label: ["Dedicated", "Relationship Manager"] },
  ],
];

export type Faq = { q: string; a: string[]; list?: string[]; after?: string[] };

export const FAQS: Faq[] = [
  {
    q: "Will my child get certificate?",
    a: ["Yes. Your child receives a certificate after completing each level, once they pass the end-of-level assessment."],
  },
  {
    q: "What do we need to start online Chess Classes?",
    a: ["All you need is:"],
    list: ["A Device (Desktop | Laptop | Tablet | Phone)", "Good internet connection", "Willingness to learn and explore"],
    after: [
      "Chess is one of the few sports that can be learnt online and offline equally well with guided training, practice and analysis.",
    ],
  },
  {
    q: "Why kids should learn Chess?",
    a: [
      "Chess builds concentration, patience and problem solving. Kids learn to plan ahead, think through consequences and handle winning and losing calmly.",
    ],
  },
  {
    q: "Can I take break between classes?",
    a: ["Yes. Let your relationship manager know in advance and missed sessions can be paused or rescheduled."],
  },
  {
    q: "Who will teach?",
    a: [
      "Certified coaches teach every class, with International Masters (IMs) and Grand Masters (GMs) leading the advanced and Master levels.",
    ],
  },
  {
    q: "Time and Days of class?",
    a: ["Classes run 2 days a week. You choose a slot that suits your time zone when you enrol."],
  },
];

// flagcdn.com codes, as in ReviewSection.
export const COUNTRIES = [
  { code: "sg", label: "Singapore" },
  { code: "gb", label: "United Kingdom" },
  { code: "ae", label: "United Arab Emirates" },
  { code: "ca", label: "Canada" },
  { code: "au", label: "Australia" },
  { code: "de", label: "Germany" },
  { code: "nl", label: "Netherlands" },
  { code: "ch", label: "Switzerland" },
];

export const SHOWCASE_CARDS = ["Card 1", "Card 2", "Card 3", "Card 4", "Card 5"];
