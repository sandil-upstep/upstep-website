"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setCoverDark } from "./coverTheme";
import { onFrame, onScrollFrame } from "./SmoothScroll";
import { staircase, type StaircaseHandle } from "./staircaseBridge";
import "./whyChessSection.scss";

gsap.registerPlugin(ScrollTrigger);

// Why Chess Is Important: the king falls in from the staircase above, and
// the outlined heading rises out of its masks once its top reaches the
// middle of the screen (sinking back when scrolled above it again, as the
// other outlined titles do). On desktop the section then
// stays pinned while one scrubbed timeline plays the rest: the insight cards
// rise in from below the screen to their scattered spots round the landed
// king, each at its own depth's pace (parallax); the heading sinks back into
// its masks (the reveal in reverse) as the king travels to the centre and
// the cards gather onto an orbit round it; then the first card flies into
// the info window, which unfolds from it at the top-right, and the pin holds
// it there for a while before the page moves on. Clicking a card opens its
// window right where the card sits: the card settles into the window's icon
// spot and the window unfolds from it, to the right of cards on the right
// of the king and mirrored to the left of those on its left, so it never
// sits under the king. Phones get the same fall, unpinned: on
// landing the items come out onto the orbit, but they aren't clickable
// there; an accordion below the orbit holds the details instead. Ported
// from the "Scientifically Structured improved" design reference.
//
// Every moving part is drawn by render() from plain numbers: the scroll
// timeline tweens its own (`S` scroll fields, each card's rise/arr, and `A`
// for the window it opens), the click timelines theirs (S.bg/card/side and
// each card's fly), so they can overlap and reverse without fighting over
// the same styles. A click takes over from the scroll's window (`manual`)
// until the visitor scrolls back above it.

type WhyItem = {
  id: string;
  label: string;
  headline: [string, string, string]; // before, highlighted, after
  title: string;
  desc: string;
  highlight: string;
};

// Clockwise round the orbit from its top-right slot, as in the design.
const WHY_ITEMS: WhyItem[] = [
  {
    id: "problem",
    label: "Problem-solving",
    headline: ["Boost Grades by ", "20%", ""],
    title: "Increases Problem-Solving Skills",
    desc: "A 1992 New Brunswick (Canada) study split 450 students into three groups: C started chess lessons from first grade alongside math.",
    highlight: "Remarkably, Group C’s scores skyrocketed from 62% to 81.2%, outperforming Group A by 21.46%!",
  },
  {
    id: "fitness",
    label: "Brain fitness",
    headline: ["A ", "Workout", " for the Mind"],
    title: "Keeps the Brain Active",
    desc: "Like exercise for the body, regular challenging play keeps the mind working at any age.",
    highlight: "Research has linked board games like chess to healthier thinking skills later in life.",
  },
  {
    id: "hemispheres",
    label: "Analytical and creative thinking",
    headline: ["Use ", "Both Sides", " of the Brain"],
    title: "Engages Analytical & Creative Thinking",
    desc: "Chess blends calculation and pattern recognition with intuition and imagination.",
    highlight: "Logic and creativity get trained together, in every single game.",
  },
  {
    id: "memory",
    label: "Memory and focus",
    headline: ["Train a ", "Sharper", " Memory"],
    title: "Improves Memory & Concentration",
    desc: "Players keep openings, patterns and plans in mind while staying focused for a whole game.",
    highlight: "Long, calm focus becomes a habit that carries over to homework and exams.",
  },
  {
    id: "logic",
    label: "Logical reasoning",
    headline: ["Think ", "Step by Step", ""],
    title: "Strengthens Logical Reasoning",
    desc: "Before each move, players weigh options, predict replies and test their ideas: the same if-then thinking used in maths and science.",
    highlight: "Kids learn to break a big problem into small, solvable steps.",
  },
  {
    id: "creativity",
    label: "Creativity",
    headline: ["Spark ", "Creative", " Thinking"],
    title: "Builds Creativity & Imagination",
    desc: "Every game asks for new ideas: an unusual plan, a surprising sacrifice, a fresh way to use each piece.",
    highlight: "Children learn there is more than one route to a goal, and to look for the best one.",
  },
];

const img = (id: string) => `/images/why/${id}.webp`;
const KING_SRC = img("king");
const RING_SRC = img("ring");

type Spot3 = readonly [number, number, number]; // centre x, centre y, size
type CubeDef = { src: string; closed: Spot3; open: Spot3; z: number };
const cube = (n: number) => `/images/cubes/cube-${n}.png`;
// The same rendered cubes as the other sections. Design-frame spots; they
// drift from `closed` to `open` as the king centres.
// z: depth for the parallax while the cards rise in (nearer drifts further).
const WHY_CUBES: CubeDef[] = [
  { src: cube(5), closed: [1622, 88, 34], open: [1635, 132, 52], z: 0.45 },
  { src: cube(6), closed: [290, 198, 30], open: [290, 400, 52], z: 0.3 },
  { src: cube(12), closed: [660, 793, 30], open: [510, 800, 30], z: 0.6 },
  { src: cube(2), closed: [1707, 762, 48], open: [1707, 800, 48], z: 0.9 },
];

// Desktop card spots in the design frame: centre, scale (of ITEM) and blur.
type Spot = { x: number; y: number; s: number; blur: number };
// Where each card settles round the landed king as it rises in (WHY_ITEMS
// order), as in the first design. blur in px, o its opacity; z its depth:
// nearer cards start further below the screen, so over the same scroll they
// rise faster than the far ones (the parallax).
const SCATTER: (Spot & { o: number; z: number })[] = [
  { x: 1623, y: 264, s: 1, blur: 0, o: 1, z: 1 }, // problem
  { x: 1797, y: 650, s: 0.73, blur: 0, o: 1, z: 0.65 }, // fitness
  { x: 1158, y: 775, s: 0.95, blur: 1, o: 0.85, z: 0.8 }, // hemispheres
  { x: 338, y: 762, s: 1, blur: 0, o: 1, z: 1 }, // memory
  { x: 722, y: 614, s: 0.82, blur: 0, o: 1, z: 0.75 }, // logic
  { x: 1103, y: 461, s: 0.74, blur: 3, o: 0.55, z: 0.4 }, // creativity
];
const RISE_TRAVEL = 1310; // design px a z = 1 card rises through
// The orbit round the centred king, as in the second design: one slot per
// card (WHY_ITEMS order), clockwise from the top-right one, which sits right
// on the default window's icon spot. blur here is how far (0–1) a card in
// that slot goes out of focus while a window on the right is open (mirrored
// for one on the left).
const SLOTS: Spot[] = [
  { x: 1163, y: 225, s: 0.92, blur: 0 },
  { x: 1340, y: 479, s: 0.74, blur: 0 },
  { x: 1175, y: 683, s: 0.92, blur: 0.2 },
  { x: 637, y: 683, s: 0.92, blur: 1 },
  { x: 513, y: 454, s: 0.92, blur: 1 },
  { x: 767, y: 263, s: 0.92, blur: 1 },
];
const ITEM_MIN = 100; // on-screen px a scale-1 card never shrinks below (narrow tablets)

const KING_BOX = { w: 486, h: 728, cx: 243, top: 14, bottom: 712, base: 659 }; // the image and where the piece sits in it (base: the middle of its footprint)
const KING_MID = (KING_BOX.top + KING_BOX.base) / 2; // the piece's middle, where the items emerge from
const KING_PIECE = KING_BOX.base - KING_BOX.top;
// Design-frame poses. Landed: where the king comes down from the staircase,
// its base on the section's bottom edge so it doesn't hang over the Earth in
// the reviews below. Centre: the large centred king the orbit is built around,
// set down as in the design: the blue band of its base on the section's
// bottom edge and the foot hanging over the reviews below.
const KING_AT = { landed: { cx: 1412, top: 271, s: 0.94 }, centre: { cx: 912, top: 312, s: 0.984 } };
// The halo ring round the 3D king, for each pose: its centre `y` above the
// king's base and its radius `r`, as shares of the king's height (the centred
// pose as in the "King with ring" reference). Its gold arcs turn slowly
// clockwise, RING_SPIN rad/s, after spinning in from RING_IN_TURN back.
const RING_3D = { landed: { y: 0.68, r: 0.24 }, centre: { y: 0.6, r: 0.29 } };
const RING_SPIN = 0.15;
const RING_IN_TURN = (70 * Math.PI) / 180;
// The flat ring image, shown only round the image king (when the 3D one
// can't be drawn): its centre `y` image px below the top of the king's box,
// `d` image px across, for each pose.
const RING_AT = { landed: { y: 220, d: 348 }, centre: { y: 275, d: 412 } };
const RING_IMG = { w: 446, h: 448 };
// Phones: the items sit on an ellipse round the king, the first at its
// top-right and the rest evenly spaced clockwise.
const ORBIT_START = -Math.PI / 3;
const DEFAULT_ITEM = 0; // the window the scroll opens (Problem-solving, already top-right)
const ITEM = { w: 152, h: 118 };
// Info window (design frame): position, and its icon's centre and size, where
// the chosen item lands. It unfolds from the icon's box.
const CARD = { w: 662, iconX: 14 + 61, iconY: 12 + 61, icon: 122 };
// Where a window may sit (design frame): clear of the frame's sides and
// bottom, and below the headline.
const WIN_EDGE = 30;
const WIN_TOP = 140;
const HEADLINE_TOP = 34;
const WHY_W = 1897;
const WHY_H = 940;

// The desktop pin's scrubbed timeline, as fractions of the pin: the cards
// rise in round the landed king; the king travels to the centre as they
// gather onto the orbit; the default window opens; then the pin holds.
const RISE_END = 0.26;
const ARRANGE_AT = 0.3;
const TITLE_OUT_DUR = 0.14;
const MOVE_DUR = 0.3;
const ARR_LAG = 0.02; // the cards set off a beat after the king
const ARR_GAP = 0.015;
const ARR_DUR = 0.26;
const OPEN_AT = ARRANGE_AT + ARR_LAG + (WHY_ITEMS.length - 1) * ARR_GAP + ARR_DUR; // every card on the orbit
const OPEN_FLY = 0.1;
const OPEN_CARD_AT = OPEN_AT + 0.07;
const OPEN_CARD_DUR = 0.12; // the window is fully open at ~0.85; the pin holds it to 1
const N = WHY_ITEMS.length;
const STEP = (Math.PI * 2) / N; // phones: even spacing on the orbit, clockwise

// The fall from the staircase.
const FALL_PAD = 24; // px kept clear around the falling king
const KING_W = 294; // the piece's widest part (its base) in the image
const FALL_SPINS = 2; // turns the king makes on its axis while it falls
const SPIN_END = 0.85; // fall progress where the spin ends
const MOVE_SPINS = 1; // turns the king makes while it moves to the centre

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const r4 = (x: number) => x.toFixed(4);

export default function WhyChessSection() {
  // Phones: the accordion under the orbit; each card holds its own headline.
  const [accOpen, setAccOpen] = useState(DEFAULT_ITEM);
  const toggleAcc = (i: number) => setAccOpen(accOpen === i ? -1 : i);
  const pinRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const fallerRef = useRef<HTMLImageElement>(null);

  // Back to the default item once the section is fully off screen, so the
  // next visit starts where the design does.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) return;
      setAccOpen(DEFAULT_ITEM);
    });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const pin = pinRef.current;
    const section = sectionRef.current;
    const faller = fallerRef.current;
    if (!pin || !section || !faller) return;
    const q = <T extends Element>(sel: string) => section.querySelector<T>(sel)!;
    const frame = q<HTMLDivElement>(".why__frame");
    const eyebrow = q<HTMLParagraphElement>(".why__eyebrow");
    const title = q<HTMLHeadingElement>(".why__title");
    const titleLines = Array.from(section.querySelectorAll<HTMLSpanElement>(".why__line > span"));
    const floor = q<HTMLDivElement>(".why__floor");
    const hero = q<HTMLDivElement>(".why__hero");
    const kingEl = q<HTMLDivElement>(".why__king");
    const kingImg = kingEl.querySelector("img")!;
    const ringEl = q<HTMLDivElement>(".why__ring");
    const ringIn = q<HTMLDivElement>(".why__ring-in");
    const itemsWrap = q<HTMLDivElement>(".why__items");
    const headline = q<HTMLParagraphElement>(".why__headline");
    const card = q<HTMLDivElement>(".why-card");
    const cardIcon = q<HTMLImageElement>(".why-card__icon");
    const cardHeadline = q<HTMLParagraphElement>(".why-card__headline");
    const cardTitle = q<HTMLHeadingElement>(".why-card h3");
    const cardDesc = q<HTMLParagraphElement>(".why-card__desc");
    const cardHi = q<HTMLParagraphElement>(".why-card__highlight");
    const closeBtn = q<HTMLButtonElement>(".why-card__close");
    const cardBody = q<HTMLDivElement>(".why-card__body");
    const backdrop = q<HTMLDivElement>(".why__backdrop");
    // Phones — e: 0 = tucked behind the king, 1 = on the orbit. Desktop —
    // rise: 0 = below the screen, 1 = at its scattered spot; arr: 0 = there,
    // 1 = on the orbit. fly: 0 = on the orbit, 1 = at the info window's icon spot.
    const items = WHY_ITEMS.map((data) => ({
      data,
      el: q<HTMLButtonElement>(`.why-item[data-id="${data.id}"]`),
      cardEl: q<HTMLSpanElement>(`.why-item[data-id="${data.id}"] .why-item__card`),
      st: { e: 0, rise: 0, arr: 0, fly: 0 },
    }));
    const cubes = WHY_CUBES.map((def, i) => ({ def, el: section.querySelectorAll<HTMLDivElement>(".why-cube")[i] }));

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const D = reduceMotion ? 0 : 1; // duration multiplier for the time-based tweens

    // ---- State ----
    const S = {
      title: 0, // heading reveal, 0 → 1 (played/reversed at mid-screen)
      titleOut: 0, // desktop: the heading leaving again once the king has landed, 0 → 1
      ring: 0, // ring spin-in, 0 → 1
      drop: 0, // phones: the king dropping into the hero box
      rise: 0, // desktop: the cubes' parallax drift while the cards rise in
      move: 0, // desktop: the king travelling from its landing spot to the centre
      bg: 0, // the other items easing into the background while a window is open
      card: 0, // the info window opening
      side: 0, // desktop: 0 = the open window is on the right of the king, 1 = on its left
    };
    // Desktop: the default window as the scroll opens it — its card flying
    // in, the rest stepping back, the window unfolding. Drawn until a click
    // takes over (`manual`), then S.bg/S.card and the cards' fly instead.
    const A = { fly: 0, bg: 0, card: 0 };
    let manual = false;
    let handingBack = false; // closing what the visitor opened, before the scroll takes over again
    let mode: "desktop" | "mobile" = "desktop";
    let sel = -1; // index of the open item (while manual)
    let lastFocus: HTMLElement | null = null;
    let clickTl: gsap.core.Timeline | null = null;
    let orbiting = false;
    itemsWrap.inert = true; // until every item is out on the orbit
    let dirty = true;
    const markDirty = () => (dirty = true);

    // ---- Layout: orbit and window geometry, in the coordinates the king and
    // items are drawn in (desktop: the design frame; phones: the hero box). ----
    // Each item's window: its top-left corner, whether it opens to the
    // card's left (flip: icon at its top-right), and the icon spot the card
    // settles into.
    type Place = { left: number; top: number; flip: boolean; spot: { x: number; y: number; s: number } };
    type Geo = {
      cx: number; // phones: the orbit
      cy: number;
      rx: number;
      ry: number;
      king: { cx: number; top: number; s: number }; // the centred king
      itemS: number; // desktop: a multiplier on the design's card scales; phones: the cards' scale
      cardS: number;
      places: Place[];
      dropDist: number;
    };
    let geo: Geo | null = null;
    let winItem = DEFAULT_ITEM; // the item whose details are in the window

    // Desktop: each window opens where its card sits on the orbit — the
    // card's centre on the window's icon spot — on the card's side of the
    // king, nudged only as far as it takes to stay on screen and clear of
    // the headline. Heights are measured with each item's own text.
    function placeWindows(cardS: number, visTop: number): Place[] {
      const heights = WHY_ITEMS.map((it) => {
        fillText(it);
        return card.offsetHeight;
      });
      fillText(WHY_ITEMS[winItem]);
      const w = CARD.w * cardS;
      const ix = CARD.iconX * cardS; // the icon's centre from the window's near edge
      const iy = CARD.iconY * cardS;
      return SLOTS.map((P, i) => {
        const flip = P.x < KING_AT.centre.cx;
        const left = Math.max(WIN_EDGE, Math.min(flip ? P.x + ix - w : P.x - ix, WHY_W - WIN_EDGE - w));
        const top = Math.max(WIN_TOP, visTop + WIN_EDGE, Math.min(P.y - iy, WHY_H - WIN_EDGE - heights[i] * cardS));
        return { left, top, flip, spot: { x: flip ? left + w - ix : left + ix, y: top + iy, s: (CARD.icon * cardS) / ITEM.w } };
      });
    }
    // Moves the window to its item's place.
    function placeCard() {
      const p = geo?.places[winItem];
      if (!p || mode !== "desktop") return;
      card.style.left = `${p.left}px`;
      card.style.top = `${p.top}px`;
      card.classList.toggle("is-flip", p.flip);
    }

    function layout() {
      if (mode === "desktop") {
        const W = section!.clientWidth;
        const Hs = section!.clientHeight;
        const k = W / WHY_W;
        // The frame is scaled to the section's width and anchored to its bottom.
        frame.style.transform = `translate(0px, ${Hs - WHY_H * k}px) scale(${k})`;
        const visH = Hs / k;
        const visTop = WHY_H - visH; // frame y at the top of the screen
        // On tall screens (portrait tablets) the heading stays near the top
        // instead of sinking with the bottom-anchored frame.
        const dy = Math.min(0, visTop + 300);
        frame.style.setProperty("--why-dy", `${dy}px`);
        // Items and the window never shrink below a usable on-screen size
        // (narrow tablets).
        const itemS = Math.max(1, ITEM_MIN / (ITEM.w * k));
        const cardS = Math.max(1, 0.8 / k);
        headline.style.top = `${HEADLINE_TOP}px`;
        geo = {
          cx: 0,
          cy: 0,
          rx: 0,
          ry: 0,
          king: KING_AT.centre,
          itemS,
          cardS,
          places: placeWindows(cardS, visTop),
          dropDist: 0,
        };
        placeCard();
      } else {
        frame.style.transform = "";
        frame.style.removeProperty("--why-dy");
        headline.style.top = "";
        card.style.left = "";
        card.style.top = "";
        card.classList.remove("is-flip");
        const W = hero.clientWidth;
        const H = hero.clientHeight;
        const itemS = (0.2 * W) / ITEM.w;
        const iw = ITEM.w * itemS;
        const ih = ITEM.h * itemS;
        const rx = W / 2 - iw / 2 - 2;
        const ry = H / 2 - ih / 2 - 2;
        const s = itemS * 1.15;
        const kingS = Math.min(0.64 * H, 2 * ry - ih) / KING_PIECE;
        geo = {
          cx: W / 2,
          cy: H / 2,
          rx,
          ry,
          king: { cx: W / 2, top: H / 2 - KING_MID * kingS, s: kingS },
          itemS,
          cardS: 1,
          places: WHY_ITEMS.map(() => ({ left: 0, top: 0, flip: false, spot: { x: W - (ITEM.w * s) / 2 - 2, y: (ITEM.h * s) / 2 + 2, s } })),
          dropDist: H * 0.9,
        };
      }
      dirty = true;
    }

    // ---- Render: every moving part from S ----
    const titleEase = gsap.parseEase("power3.out");
    const at = (el: HTMLElement, x: number, y: number, s: number) =>
      (el.style.transform = `translate(${x}px, ${y}px) scale(${s})`);

    function render() {
      dirty = false;
      const g = geo;
      if (!g) return;
      const desk = mode === "desktop";
      // The window as drawn: the scroll's, until a click takes over.
      const bg = manual ? S.bg : A.bg;
      const cardV = manual ? S.card : A.card;
      const flyOf = (i: number) => (manual ? items[i].st.fly : i === DEFAULT_ITEM ? A.fly : 0);
      const side = manual ? S.side : 0; // the scroll's window (the default item's) is on the right

      // Heading: each line rises out of its mask, the second a beat later.
      // Leaving plays the same reveal backwards (second line sinks first).
      const shown = Math.min(S.title, 1 - (desk ? S.titleOut : 0));
      titleLines.forEach((el, j) => {
        const p = clamp01((shown - j * 0.3) / 0.7);
        el.style.transform = `translateY(${(1 - titleEase(p)) * 140}%)`;
        el.style.opacity = String(clamp01(p * 2.5));
      });
      const away = desk ? bg : 0; // the heading steps back while a window is open
      eyebrow.style.opacity = String(clamp01(shown * 3) * (1 - away));
      eyebrow.style.transform = title.style.transform = `translateY(${-18 * away}px)`;
      title.style.opacity = String(1 - away);

      // King: desktop travels from its landing spot to the centre; phones drop in.
      const m = desk ? S.move : 1;
      const L = KING_AT.landed;
      const ks = lerp(L.s, g.king.s, m);
      const kcx = lerp(L.cx, g.king.cx, m);
      const ktop = lerp(L.top, g.king.top, m) - (desk ? 0 : (1 - S.drop) * g.dropDist);
      const kcy = ktop + KING_MID * ks; // where the items emerge from
      at(kingEl, kcx - KING_BOX.cx * ks, ktop, ks);
      kingEl.style.opacity = desk ? "" : String(clamp01(S.drop * 5));

      const rs = (lerp(RING_AT.landed.d, RING_AT.centre.d, m) * ks) / RING_IMG.w;
      const ry = lerp(RING_AT.landed.y, RING_AT.centre.y, m);
      at(ringEl, kcx - 2 * ks - (RING_IMG.w / 2) * rs, ktop + ry * ks - (RING_IMG.h / 2) * rs, rs);
      ringIn.style.opacity = String(clamp01(S.ring));
      ringIn.style.transform = `scale(${0.55 + 0.45 * S.ring}) rotate(${-70 * (1 - S.ring)}deg)`;

      // Items. Desktop: up from below the screen to their scattered spots,
      // then round onto the orbit. Phones: out from behind the king
      // (spiralling a little as they go) onto the orbit. The open one
      // settles into its window's icon spot.
      let allOut = true;
      items.forEach(({ el, cardEl, st }, i) => {
        let x: number, y: number, s: number, o: number;
        let blur = 0; // px
        let focus: number; // how far it goes out of focus behind an open window
        let shown = true;
        if (desk) {
          if (st.arr < 0.999) allOut = false;
          const sc = SCATTER[i];
          const P = SLOTS[i];
          const scS = sc.s * g.itemS;
          // Nearer cards start further down, so they rise faster; none starts on screen.
          const from = Math.max(sc.y + RISE_TRAVEL * sc.z, WHY_H + (ITEM.h * scS) / 2 + 30);
          x = lerp(sc.x, P.x, st.arr);
          y = lerp(lerp(from, sc.y, st.rise), P.y, st.arr);
          s = lerp(scS, P.s * g.itemS, st.arr);
          o = lerp(sc.o, 1, st.arr);
          blur = sc.blur * (1 - st.arr);
          // The side away from the open window goes out of focus.
          focus = lerp(P.blur, SLOTS[N - 1 - i].blur, side) * st.arr;
          shown = st.rise > 0.001;
        } else {
          const e = st.e;
          if (e < 0.98) allOut = false;
          const a = ORBIT_START + i * STEP - (1 - Math.min(1, e)) * 0.7;
          const depth = 0.9 + 0.1 * Math.sin(a); // a touch smaller round the back (top) of the orbit
          x = lerp(kcx, g.cx + Math.cos(a) * g.rx, e);
          y = lerp(kcy, g.cy + Math.sin(a) * g.ry, e);
          s = g.itemS * depth * (0.35 + 0.65 * e);
          o = clamp01(e * 3);
          focus = 1;
        }
        const fly = flyOf(i);
        const b = bg * (1 - fly) * focus;
        s *= 1 - 0.06 * b;
        o *= 1 - 0.3 * b;
        blur = blur * (1 - fly) + 2.5 * b;
        const spot = g.places[i].spot;
        x = lerp(x, spot.x, fly);
        y = lerp(y, spot.y, fly);
        s = lerp(s, spot.s, fly);
        o = lerp(o, 1, fly);
        at(el, x - (ITEM.w / 2) * s, y - (ITEM.h / 2) * s, s);
        el.style.opacity = String(o);
        el.style.visibility = shown ? "" : "hidden";
        // Its frame fades as it settles into the window, leaving the icon.
        el.style.setProperty("--fly", fly.toFixed(3));
        el.classList.toggle("is-in", fly > 0.5);
        // Out of focus while far back or in the background, as in the design.
        // In tenths of a pixel: finer steps don't show, but each one repaints.
        cardEl.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : "";
        // Behind the king while on the orbit; above the window once flying to it.
        el.style.zIndex = fly > 0.001 ? "7" : "1";
      });
      if (allOut !== orbiting) {
        orbiting = allOut;
        section!.classList.toggle("is-orbiting", orbiting);
        itemsWrap.inert = !orbiting || mode === "mobile";
      }

      if (desk) {
        cubes.forEach(({ def, el }) => {
          const s = lerp(def.closed[2], def.open[2], m);
          const drift = (1 - S.rise) * 140 * def.z; // rising with the cards, at their own depth
          at(el, lerp(def.closed[0], def.open[0], m) - s / 2, lerp(def.closed[1], def.open[1], m) + drift - s / 2, s / 100);
        });
        floor.style.opacity = String(m);
        headline.style.opacity = String(cardV);
        headline.style.transform = `translateY(${(1 - cardV) * 24}px)`;
        // The window unfolds out of its icon's box (where the chosen card
        // sits) down and away from it — rightwards, or leftwards when it
        // opens to the card's left; its text follows.
        const r = r4(1 - cardV);
        const pad = (60 * cardV).toFixed(2); // room for its shadow once open
        const across = `calc(${r} * (100% - ${CARD.iconX * 2}px) - ${pad}px)`;
        const down = `calc(${r} * (100% - ${CARD.iconY * 2}px) - ${pad}px)`;
        card.style.clipPath =
          cardV < 0.999
            ? g.places[winItem].flip
              ? `inset(-60px -60px ${down} ${across} round 10px)`
              : `inset(-60px ${across} ${down} -60px round 10px)`
            : "";
        card.style.opacity = String(clamp01(cardV * 4));
        card.style.transform = `scale(${g.cardS})`;
        const t = clamp01((cardV - 0.45) / 0.55);
        cardBody.style.opacity = closeBtn.style.opacity = String(t);
        cardBody.style.transform = `translateY(${(1 - t) * 10}px)`;
        // The scroll's own window: reachable (and announced) once it's open.
        if (!manual) {
          const open = cardV > 0.5;
          if (open === card.inert) card.inert = !open;
        }
      } else {
        card.style.opacity = "";
        card.style.clipPath = "";
        cardBody.style.opacity = closeBtn.style.opacity = "";
        cardBody.style.transform = "";
        card.style.transform = `translateY(${(1 - cardV) * 110}%)`;
      }
      card.style.visibility = cardV > 0.001 ? "visible" : "hidden";
      card.style.pointerEvents = cardV > 0.5 ? "auto" : "none";
    }

    // ---- Info window ----
    function fillText(it: WhyItem) {
      [headline, cardHeadline].forEach((el) => {
        const em = document.createElement("em");
        em.textContent = it.headline[1];
        el.replaceChildren(it.headline[0], em, it.headline[2]);
      });
      cardIcon.src = img(it.id);
      cardTitle.textContent = it.title;
      cardDesc.textContent = it.desc;
      cardHi.textContent = it.highlight;
    }
    // Item i's details, in its own place.
    function fill(i: number) {
      winItem = i;
      fillText(WHY_ITEMS[i]);
      placeCard();
    }
    fill(DEFAULT_ITEM);
    const sideOf = (i: number) => (geo?.places[i].flip ? 1 : 0);

    // On desktop the scroll opens DEFAULT_ITEM's window itself (A); a click,
    // or closing that window, takes over from wherever the scroll has got
    // to. Scrolling back above the window hands it back to the scroll.
    const allOut = () => items.every((it) => (mode === "desktop" ? it.st.arr >= 0.999 : it.st.e >= 0.98));
    const openItem = () => (manual ? sel : A.fly > 0 || A.bg > 0 || A.card > 0 ? DEFAULT_ITEM : -1);
    function takeOver() {
      if (manual) return;
      manual = true;
      sel = openItem();
      S.bg = A.bg;
      S.card = A.card;
      S.side = sideOf(DEFAULT_ITEM);
      items.forEach((it, j) => (it.st.fly = j === DEFAULT_ITEM ? A.fly : 0));
    }
    function handBack() {
      if (!manual || handingBack) return;
      handingBack = true;
      const restore = card.contains(document.activeElement);
      sel = -1;
      clickTl?.kill();
      section!.classList.remove("is-open");
      card.inert = true;
      if (restore && lastFocus) lastFocus.focus({ preventScroll: true });
      lastFocus = null;
      const sts = items.map((it) => it.st);
      const home = sideOf(DEFAULT_ITEM);
      const done = () => {
        manual = handingBack = false;
        clickTl = null;
        fill(DEFAULT_ITEM);
        dirty = true;
      };
      if (!S.card && !S.bg && S.side === home && sts.every((st) => !st.fly)) return done();
      clickTl = gsap
        .timeline({ onUpdate: markDirty, onComplete: done })
        .to(S, { card: 0, duration: 0.5 * D, ease: "power3.inOut" })
        .to(sts, { fly: 0, duration: 0.8 * D, ease: "power3.inOut" }, ">-0.2")
        .to(S, { bg: 0, side: home, duration: 0.8 * D, ease: "power2.inOut" }, "<");
    }

    // Open item i's window where the card sits: the card settles into the
    // window's icon spot (barely moving unless the window had to be nudged
    // onto the screen) and the window unfolds from it.
    function select(i: number, fromEl: HTMLElement | null) {
      const g = geo;
      if (!allOut() || !g) return;
      takeOver();
      handingBack = false;
      if (sel === i) return close({ restoreFocus: true });
      if (sel < 0) lastFocus = fromEl;
      sel = i;
      clickTl?.kill();
      const tl = gsap.timeline({ onUpdate: markDirty });
      // Switching items: the open window closes first, while it's still full.
      if (S.card > 0) tl.to(S, { card: 0, duration: 0.25 * D, ease: "power2.in" });
      const t0 = tl.duration();
      tl.to(S, { bg: 1, side: sideOf(i), duration: 0.6 * D, ease: "power2.out" }, t0);
      tl.to(items.filter((_, j) => j !== i).map((it) => it.st), { fly: 0, duration: 0.6 * D, ease: "power3.inOut" }, t0);
      tl.to(items[i].st, { fly: 1, duration: 0.5 * D, ease: "power3.inOut" }, t0);
      const openAt = t0 + 0.3 * D;
      tl.call(
        () => {
          fill(i);
          section!.classList.add("is-open");
          card.inert = false;
        },
        undefined,
        openAt
      );
      tl.to(S, { card: 1, duration: 0.55 * D, ease: "power3.out" }, openAt);
      if (fromEl) tl.call(() => closeBtn.focus({ preventScroll: true }));
      clickTl = tl;
    }

    // instant: a reset (scrolled away, breakpoint change), so everything is
    // back at rest and the scroll owns the window again.
    function close({ instant = false, restoreFocus = false } = {}) {
      if (instant) manual = handingBack = false;
      else takeOver();
      if (sel < 0) return;
      sel = -1;
      clickTl?.kill();
      clickTl = null;
      section!.classList.remove("is-open");
      card.inert = true;
      const sts = items.map((it) => it.st);
      if (instant) {
        S.card = S.bg = 0;
        sts.forEach((st) => (st.fly = 0));
        fill(DEFAULT_ITEM);
        dirty = true;
      } else {
        // The window folds back into its icon, easing in and out rather than
        // snapping shut, and the card sets off home before the fold ends so
        // the two read as one motion.
        clickTl = gsap
          .timeline({ onUpdate: markDirty })
          .to(S, { card: 0, duration: 0.5 * D, ease: "power3.inOut" })
          .to(sts, { fly: 0, duration: 0.8 * D, ease: "power3.inOut" }, ">-0.2")
          .to(S, { bg: 0, duration: 0.8 * D, ease: "power2.inOut" }, "<");
      }
      if (restoreFocus && lastFocus) lastFocus.focus({ preventScroll: true });
      lastFocus = null;
    }

    const itemHandlers = items.map(({ el }, i) => {
      const h = (e: MouseEvent) => {
        e.stopPropagation();
        select(i, el);
      };
      el.addEventListener("click", h);
      return () => el.removeEventListener("click", h);
    });
    const closeByUser = () => close({ restoreFocus: true });
    const onClose = (e: MouseEvent) => {
      e.stopPropagation();
      closeByUser();
    };
    closeBtn.addEventListener("click", onClose);
    backdrop.addEventListener("click", closeByUser);
    // Clicking empty space around the open window closes it.
    const onSectionClick = (e: MouseEvent) => {
      if (openItem() >= 0 && !(e.target as HTMLElement).closest(".why-item, .why-card")) closeByUser();
    };
    section.addEventListener("click", onSectionClick);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openItem() >= 0) closeByUser();
    };
    addEventListener("keydown", onKeyDown);

    // ---- Landing: the ring spins up around the king ----
    let revealed = false;
    function reveal(landed: boolean) {
      if (revealed) return;
      revealed = true;
      gsap.to(S, { ring: 1, duration: 1 * D, delay: 0.15 * D, ease: "back.out(1.6)", onUpdate: markDirty });
      if (mode === "mobile") {
        // Phones: the king drops in (unless it has just fallen in from the
        // staircase), then the items come out onto the orbit one by one.
        if (!landed) gsap.to(S, { drop: 1, duration: 0.9 * D, delay: 0.15 * D, ease: "bounce.out", onUpdate: markDirty });
        items.forEach(({ st }, i) =>
          gsap.to(st, {
            e: 1,
            duration: 0.7 * D,
            delay: ((landed ? 0.35 : 0.95) + i * 0.07) * D,
            ease: "back.out(1.4)",
            overwrite: "auto",
            onUpdate: markDirty,
          })
        );
      }
      if (landed && !reduceMotion) {
        kingImg.classList.remove("is-landing");
        void kingImg.offsetWidth;
        kingImg.classList.add("is-landing");
      }
    }
    function unreveal() {
      if (!revealed) return;
      revealed = false;
      close({ instant: true });
      gsap.to(S, { ring: 0, duration: 0.4 * D, ease: "power2.in", onUpdate: markDirty });
      if (mode === "mobile") {
        const sts = items.map((it) => it.st);
        gsap.to(sts, { e: 0, duration: 0.35 * D, ease: "power2.in", overwrite: "auto", onUpdate: markDirty });
        if (!handoff()) gsap.to(S, { drop: 0, duration: 0.4 * D, ease: "power2.in", overwrite: "auto", onUpdate: markDirty });
      }
    }
    const onLanded = () => kingImg.classList.remove("is-landing");
    kingImg.addEventListener("animationend", onLanded);

    // ---- Per-breakpoint timelines ----
    const visibility = new IntersectionObserver(
      ([entry]) => {
        // Without the staircase hand-off (reduced motion, or the 3D board
        // isn't ready): land when it scrolls into view. Phones also reset
        // once it's scrolled back below the screen.
        if (handoff()) return;
        if (entry.isIntersecting) reveal(false);
        else if (mode === "mobile" && entry.boundingClientRect.top > 0) unreveal();
      },
      { threshold: 0.3 }
    );
    const resetState = () => {
      close({ instant: true });
      gsap.killTweensOf([S, A, ...items.map((it) => it.st)]);
      Object.assign(S, { title: 0, titleOut: 0, ring: 0, drop: 0, rise: 0, move: 0, bg: 0, card: 0, side: 0 });
      Object.assign(A, { fly: 0, bg: 0, card: 0 });
      items.forEach((it) => Object.assign(it.st, { e: 0, rise: 0, arr: 0, fly: 0 }));
      card.inert = true;
      revealed = false;
    };

    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 820px)", mobile: "(max-width: 819.98px)" }, (ctx) => {
      mode = ctx.conditions!.desktop ? "desktop" : "mobile";
      resetState();
      layout();
      // The heading rises out of its masks once its top reaches the middle
      // of the screen, and sinks back when scrolled above that again.
      // Measured from the pin wrapper: the section is sticky on desktop, so
      // its own position shifts once it sticks.
      gsap.to(S, {
        title: 1,
        duration: 1.4 * D,
        ease: "none",
        onUpdate: markDirty,
        scrollTrigger: {
          trigger: pin,
          start: () => `top+=${title.getBoundingClientRect().top - section.getBoundingClientRect().top} 50%`,
          toggleActions: "play none none reverse",
        },
      });
      if (mode === "desktop") {
        // One scrubbed timeline across the pin: the cards rise in round the
        // landed king, gather onto the orbit as the king moves to the
        // centre, and the default window opens; the rest of the pin holds
        // it on screen. Scrolling back plays it backwards.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: markDirty,
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: "bottom bottom",
            // Catches up with the scroll over 0.6s instead of jumping with
            // each wheel step, so the cards glide.
            scrub: 0.6,
            onUpdate: (self) => {
              // Back above the window: one the visitor opened (or closed)
              // gives way, and the scroll's own window takes over again.
              if (self.progress < OPEN_AT) handBack();
            },
          },
        });
        // Up from below the screen, each card at its own depth's pace, with
        // the cubes drifting up behind them.
        items.forEach(({ st }) => tl.to(st, { rise: 1, duration: RISE_END, ease: "power2.out" }, 0));
        tl.to(S, { rise: 1, duration: RISE_END, ease: "power1.out" }, 0);
        // The heading leaves as the king sets off for the centre, and the
        // cards follow it round onto the orbit.
        tl.to(S, { titleOut: 1, duration: TITLE_OUT_DUR }, ARRANGE_AT);
        tl.to(S, { move: 1, duration: MOVE_DUR, ease: "power2.inOut" }, ARRANGE_AT);
        items.forEach(({ st }, i) =>
          tl.to(st, { arr: 1, duration: ARR_DUR, ease: "power2.inOut" }, ARRANGE_AT + ARR_LAG + i * ARR_GAP)
        );
        // The default card flies into the window's icon spot as the others
        // step back, and the window unfolds from it.
        tl.to(A, { fly: 1, duration: OPEN_FLY, ease: "power3.inOut" }, OPEN_AT);
        tl.to(A, { bg: 1, duration: OPEN_FLY, ease: "power2.out" }, OPEN_AT);
        tl.to(A, { card: 1, duration: OPEN_CARD_DUR, ease: "power3.out" }, OPEN_CARD_AT);
        tl.set({}, {}, 1);
        // Re-observe so a visitor already here gets the landing straight away.
        visibility.disconnect();
        visibility.observe(section);
      } else {
        // Phones: unpinned. The king falls in from the staircase as on
        // desktop (or drops in when the orbit scrolls into view without it);
        // reveal() then brings the ring and the items out. Watching the orbit
        // rather than the section: the accordion makes the section tall.
        visibility.disconnect();
        visibility.observe(hero);
      }
      return () => close({ instant: true });
    });

    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(section);
    resizeObserver.observe(hero);
    // The windows' heights (and so their places) depend on the loaded fonts.
    let alive = true;
    document.fonts?.ready.then(() => alive && layout());

    // ---- The king: the staircase's 3D king, all the way down ----
    // The fall is tied to the scroll between the staircase's last level and
    // this section reaching the top of the screen. After the landing the same 3D king stays: it is drawn over the (hidden)
    // image king's exact spot, so it rides the layout here — resting where it
    // landed, then spinning MOVE_SPINS turns on its axis as the pinned scroll
    // carries it to the centre. Its halo ring is 3D too, drawn round it on the
    // same canvas so the king hides the ring's far side. Scrolling back plays
    // it all backwards. The image king and its flat ring only show if the 3D
    // king can't be drawn (no WebGL, reduced motion, or the 3D board isn't
    // ready).
    const handoff = () => !reduceMotion && !!staircase.current?.active();
    let fallerOn = false;
    let kingShown = true;
    let king3dKey = ""; // the last pose drawn, so a resting king isn't redrawn every frame
    let king3dOk = false;
    const showFaller = (on: boolean) => {
      if (on !== fallerOn) {
        fallerOn = on;
        faller.style.display = on ? "block" : "none";
      }
    };
    // The image king, and the flat ring round it: the 3D king brings its own ring.
    const showKing = (on: boolean) => {
      if (on !== kingShown) {
        kingShown = on;
        kingEl.style.visibility = ringEl.style.visibility = on ? "" : "hidden";
      }
    };
    const draw3d = (stairs: StaircaseHandle, pose: Parameters<StaircaseHandle["fallKing"]>[0]) => {
      const ring = pose?.ring;
      const key = pose
        ? `${pose.cx.toFixed(1)}|${pose.bottom.toFixed(1)}|${pose.h.toFixed(2)}|${pose.spin.toFixed(4)}` +
          (ring ? `|${ring.y.toFixed(4)}|${ring.r.toFixed(4)}|${ring.turn.toFixed(4)}|${ring.opacity.toFixed(3)}` : "")
        : "";
      if (key === king3dKey) return king3dOk;
      king3dKey = key;
      king3dOk = stairs.fallKing(pose);
      return king3dOk;
    };
    const hide3d = () => {
      if (staircase.current && king3dKey !== "") draw3d(staircase.current, null);
    };
    // The 3D king on the section's king spot. False if it can't be drawn.
    function king3dAtRest(stairs: StaircaseHandle) {
      const r = kingEl.getBoundingClientRect();
      // Scrolled away: nothing to draw, but it still counts as shown.
      if (r.bottom < 0 || r.top > innerHeight) {
        hide3d();
        return true;
      }
      const es = r.width / KING_BOX.w;
      const p = S.move * S.move * (3 - 2 * S.move);
      // The ring spins in as the flat one did: growing, turning clockwise
      // into place and fading up.
      const m = mode === "desktop" ? S.move : 1;
      const ring =
        S.ring > 0.001
          ? {
              y: lerp(RING_3D.landed.y, RING_3D.centre.y, m),
              r: lerp(RING_3D.landed.r, RING_3D.centre.r, m) * (0.55 + 0.45 * S.ring),
              turn: RING_IN_TURN * (1 - S.ring) - (performance.now() / 1000) * RING_SPIN,
              opacity: clamp01(S.ring),
            }
          : null;
      return draw3d(stairs, {
        cx: r.left + r.width / 2,
        bottom: r.top + KING_BOX.base * es,
        h: KING_PIECE * es,
        spin: -MOVE_SPINS * 2 * Math.PI * p, // leftwards, the way it travels
        opacity: 1,
        ring,
      });
    }
    const imageKing = () => {
      hide3d();
      showFaller(false);
      showKing(true);
    };

    function fallFrame() {
      const stairs = staircase.current;
      if (!stairs || !handoff()) {
        imageKing();
        stairs?.setKingHidden(false);
        return;
      }
      // Phones: the king arrives by the fall, so it never drops in as well.
      if (mode === "mobile" && S.drop !== 1) {
        gsap.killTweensOf(S, "drop");
        S.drop = 1;
        dirty = true;
      }
      // Where the pin starts: the section's resting top before it sticks.
      const top = scrollY + pin!.getBoundingClientRect().top;
      const y1 = stairs.pinEnd();
      // +2px: scroll positions can be fractional, so the last pixel still counts as landed.
      const t = top > y1 ? clamp01((scrollY - y1 + 2) / (top - y1)) : 1;
      if (t <= 0) {
        imageKing();
        stairs.setKingHidden(false);
        unreveal();
        return;
      }
      if (t >= 1) {
        stairs.setKingHidden(true);
        reveal(true);
        if (king3dAtRest(stairs)) {
          showFaller(false);
          showKing(false);
        } else imageKing();
        return;
      }
      const Sk = stairs.kingRect();
      if (!Sk) {
        imageKing();
        return;
      }
      if (t < 0.96) unreveal();
      // Target: the king's place in this section, read live (it moves with the page).
      // Both ends are measured like the 3D king: from the middle of the base's
      // footprint up to the top of the cross.
      const r = kingEl.getBoundingClientRect();
      const es = r.width / KING_BOX.w;
      const E = { cx: r.left + r.width / 2, bottom: r.top + KING_BOX.base * es, h: KING_PIECE * es };
      // A small hop off the step, then an accelerating drop.
      const fall = t < 0.22 ? -0.07 * Math.sin((t / 0.22) * Math.PI) : Math.pow((t - 0.22) / 0.78, 2);
      const e = t * t * (3 - 2 * t);
      const h = Sk.h + (E.h - Sk.h) * e;
      const s = h / KING_PIECE;
      // Keep the whole king on screen: the step it leaves scrolls up and
      // away, and its landing spot starts out below the fold.
      const lo = h + FALL_PAD;
      const hi = innerHeight - (KING_BOX.bottom - KING_BOX.base) * s;
      const bottom = Math.min(Math.max(lo, hi), Math.max(lo, Sk.bottom + (E.bottom - Sk.bottom) * fall));
      const halfW = (KING_W * s) / 2 + FALL_PAD;
      const cx = Math.min(Math.max(Sk.cx + (E.cx - Sk.cx) * e, halfW), Math.max(halfW, innerWidth - halfW));
      // FALL_SPINS whole turns on its axis, done by SPIN_END, so it lands
      // facing the way it rests (and starts the spin to the centre from).
      const spinT = clamp01(t / SPIN_END);
      const spin = (E.cx >= Sk.cx ? 1 : -1) * FALL_SPINS * 2 * Math.PI * spinT * spinT * (3 - 2 * spinT);
      const drawn = draw3d(stairs, { cx, bottom, h, spin, opacity: 1 });
      if (!drawn) {
        // No 3D: the image king falls instead.
        faller!.style.transform = `translate(${cx}px, ${bottom}px) scale(${s}) translate(${-KING_BOX.cx}px, ${-KING_BOX.base}px)`;
      }
      showFaller(!drawn);
      showKing(false);
      stairs.setKingHidden(true);
    }

    // Runs after Lenis and GSAP (scroll timeline included) have updated for
    // the frame, so the drawn state never lags the scroll.
    const offFrame = onFrame(() => {
      fallFrame();
      if (dirty) render();
    });

    return () => {
      alive = false;
      offFrame();
      mm.revert();
      clickTl?.kill();
      gsap.killTweensOf([S, A, ...items.map((it) => it.st)]);
      visibility.disconnect();
      resizeObserver.disconnect();
      removeEventListener("keydown", onKeyDown);
      itemHandlers.forEach((off) => off());
      closeBtn.removeEventListener("click", onClose);
      backdrop.removeEventListener("click", closeByUser);
      section.removeEventListener("click", onSectionClick);
      kingImg.removeEventListener("animationend", onLanded);
      hide3d();
      staircase.current?.setKingHidden(false);
    };
  }, []);

  // The page cover turns dark once the outlined heading's top reaches the
  // middle of the screen (as the heading starts rising in), taking this
  // section and the levels above with it, and light again when scrolled back
  // above that. It stays dark further down: the heading stays above the
  // middle, and the sections there paint their own backgrounds. Kept apart
  // from the animation so it still happens without it.
  useEffect(() => {
    const section = sectionRef.current;
    const title = section?.querySelector(".why__title");
    const page = section?.closest(".main-cover");
    if (!title || !page) return;
    let dark: boolean | null = null;
    const update = () => {
      const past = title.getBoundingClientRect().top <= innerHeight / 2;
      if (past === dark) return;
      dark = past;
      setCoverDark(page, "why", past);
    };
    const offScroll = onScrollFrame(update);
    addEventListener("resize", update);
    update();
    return () => {
      offScroll();
      removeEventListener("resize", update);
      setCoverDark(page, "why", false);
    };
  }, []);

  return (
    <>
      <div ref={pinRef} className="why-pin">
        <section ref={sectionRef} className="why" aria-labelledby="why-title">
          <div className="why__guides" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="why__frame">
            <div className="why__floor" aria-hidden="true">
              <div className="why__floor-grid" />
            </div>
            <p className="why__eyebrow">
              <span className="why__box" aria-hidden="true" />
              Chess Research Insights
            </p>
            <h2 className="why__title" id="why-title">
              <span className="why__line">
                <span>Why Chess Is</span>
              </span>{" "}
              <span className="why__line">
                <span>Important</span>
              </span>
            </h2>
            <p className="why__headline" aria-hidden="true" />
            <div className="why__cubes" aria-hidden="true">
              {WHY_CUBES.map((c, i) => (
                <div key={i} className="why-cube">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.src} alt="" style={{ "--d": `${-i * 1.7}s` } as CSSProperties} />
                </div>
              ))}
            </div>
            <div className="why__hero">
              <div className="why__king" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={KING_SRC} alt="" />
              </div>
              <div className="why__ring" aria-hidden="true">
                <div className="why__ring-in">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={RING_SRC} alt="" />
                </div>
              </div>
              <div className="why__items" role="group" aria-label="Benefits of chess">
                {WHY_ITEMS.map((it, i) => (
                  <button
                    key={it.id}
                    type="button"
                    className="why-item"
                    data-id={it.id}
                    aria-label={`${it.title}: show details`}
                    style={{ "--i": i } as CSSProperties}
                  >
                    <span className="why-item__bob">
                      <span className="why-item__card">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img(it.id)} alt="" />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="why-card" role="dialog" aria-modal="false" aria-labelledby="why-card-title" inert>
              <button type="button" className="why-card__close" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="why-card__icon" alt="" />
              <div className="why-card__body">
                <p className="why-card__headline" />
                <h3 id="why-card-title" />
                <p className="why-card__desc" />
                <p className="why-card__highlight" />
              </div>
            </div>
          </div>
          <div className="why-acc">
            <ul className="why-acc__list">
              {WHY_ITEMS.map((it, i) => {
                const open = accOpen === i;
                return (
                  <li key={it.id} className={`why-acc__item${open ? " is-open" : ""}`}>
                    <h3 className="why-acc__heading">
                      <button
                        type="button"
                        className="why-acc__toggle"
                        id={`why-acc-${it.id}`}
                        aria-expanded={open}
                        aria-controls={`why-acc-panel-${it.id}`}
                        onClick={() => toggleAcc(i)}
                      >
                        <span className="why-acc__icon">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img(it.id)} alt="" />
                        </span>
                        <span className="why-acc__title">{it.title}</span>
                      </button>
                    </h3>
                    <div
                      className="why-acc__panel"
                      id={`why-acc-panel-${it.id}`}
                      role="region"
                      aria-labelledby={`why-acc-${it.id}`}
                      inert={!open}
                    >
                      <div className="why-acc__body">
                        <div className="why-acc__text">
                          <p className="why-acc__headline">
                            {it.headline[0]}
                            <em>{it.headline[1]}</em>
                            {it.headline[2]}
                          </p>
                          <p>{it.desc}</p>
                          <p className="why-acc__highlight">{it.highlight}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="why__backdrop" />
        </section>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={fallerRef} className="why-faller" src={KING_SRC} alt="" aria-hidden="true" />
    </>
  );
}
