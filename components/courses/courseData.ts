// The curriculum's six levels, shared by the home page's staircase
// (ScientificallyStructuredSection) and the course pages, and the three
// courses the header's Courses menu links to, two levels each.

export type Level = { name: string; desc: string };

export const LEVELS: Level[] = [
  {
    name: "Beginner Level",
    desc: "Introduce your child to chess and its incredible possibilities. By the end, they’ll know how to play by international chess rules and apply basic chess strategies.",
  },
  {
    name: "Advanced Beginner Level",
    desc: "Practical guidance to defeat amateur players. Students will master chess tactics and openings to gain a strong foundation.",
  },
  {
    name: "Intermediate Level",
    desc: "Students learn to defend under pressure, manage the clock and turn small advantages into winning positions.",
  },
  {
    name: "Advanced Level",
    desc: "Long-term planning and endgame technique prepare students to compete in rated tournaments with confidence.",
  },
  {
    name: "Expert Level",
    desc: "Deep game analysis and opening preparation sharpen accuracy, so every move is played with a clear purpose.",
  },
  {
    name: "Master & Pro Master Level",
    desc: "Elite coaching for title-level play: advanced strategy, psychology and preparation for national and international events.",
  },
];

export type Course = {
  slug: string;
  name: string;
  lead: string;
  levels: number[]; // indexes into LEVELS
};

// TODO: placeholder grouping until the real catalogue is settled (see the
// header's COURSE_LINKS).
export const COURSES: Course[] = [
  {
    slug: "beginner",
    name: "Beginner",
    lead: "From the first move to beating amateur players: the rules, basic strategy, and the tactics and openings that build a strong foundation.",
    levels: [0, 1],
  },
  {
    slug: "intermediate",
    name: "Intermediate",
    lead: "For players who know the game: defending under pressure, managing the clock, and planning far enough ahead to compete in rated tournaments.",
    levels: [2, 3],
  },
  {
    slug: "advanced",
    name: "Advanced",
    lead: "Deep analysis, opening preparation and elite coaching for players aiming at titles and national and international events.",
    levels: [4, 5],
  },
];

export const courseBySlug = (slug: string) => COURSES.find((c) => c.slug === slug);
