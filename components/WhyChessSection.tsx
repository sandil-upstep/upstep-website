"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onFrame } from "./SmoothScroll";
import { staircase, type StaircaseHandle } from "./staircaseBridge";
import "./whyChessSection.scss";

gsap.registerPlugin(ScrollTrigger);

// Why Chess Is Important: the king falls in from the staircase above while
// the outlined heading rises out of its masks. On desktop the section then
// stays pinned while one scrubbed timeline sinks the heading back into its
// masks (the reveal in reverse), carries the king to the centre and
// the insight cards emerge from behind it onto an orbit around it. Clicking
// a card turns the orbit until that card reaches its top-right, flies it to
// the top-right of the screen, and only then opens its info window (phones:
// a bottom sheet). Phones play the same sequence, unpinned, when the section
// scrolls into view. Ported from the "Scientifically Structured improved"
// design reference.
//
// Every moving part is drawn by render() from the plain numbers in `S`;
// GSAP only ever tweens those numbers, so the scroll timeline and the click
// timelines can overlap and reverse without fighting over the same styles.

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
type CubeDef = { c: keyof typeof CUBE_FACES; r: number; closed: Spot3; open: Spot3 };
const CUBE_FACES = {
  beige: ["#f6ead3", "#dcc8a4", "#c4ad86"],
  light: ["#c4d8f4", "#93b3df", "#7499cb"],
  blue: ["#5486d8", "#2f5fb4", "#21478f"],
  duo: ["#f3f4f7", "#2f5fb4", "#21478f"],
} as const;
// Design-frame spots; they drift from `closed` to `open` as the king centres.
const WHY_CUBES: CubeDef[] = [
  { c: "beige", r: 14, closed: [1622, 88, 34], open: [1635, 132, 52] },
  { c: "light", r: -10, closed: [290, 198, 30], open: [290, 400, 52] },
  { c: "blue", r: 18, closed: [660, 793, 30], open: [510, 800, 30] },
  { c: "duo", r: -16, closed: [1707, 762, 48], open: [1707, 800, 48] },
];

const KING_BOX = { w: 486, h: 728, cx: 243, top: 14, bottom: 712, base: 659 }; // the image and where the piece sits in it (base: the middle of its footprint)
const KING_MID = (KING_BOX.top + KING_BOX.base) / 2; // the piece's middle, where the items emerge from
const KING_PIECE = KING_BOX.base - KING_BOX.top;
// Design-frame poses. Landed: where the king comes down from the staircase,
// its base on the section's bottom edge so it doesn't hang over the Earth in
// the reviews below. Centre: the large centred king the orbit is built around.
const KING_AT = { landed: { cx: 1412, top: 271, s: 0.94 }, centre: { cx: 912, top: 244, s: 0.984 } };
// The ring hangs around the king's chest: its centre `y` image px below the
// top of the king's box, `d` image px across, for each pose.
const RING_AT = { landed: { y: 220, d: 348 }, centre: { y: 275, d: 412 } };
const RING_IMG = { w: 446, h: 448 };
// The orbit around the centred king (design frame): the items sit on this
// ellipse, the first at its top-right and the rest evenly spaced clockwise.
const ORBIT = { cx: 912, cy: 480, rx: 420, ry: 250, item: 0.92 };
const ORBIT_START = -Math.PI / 3;
const DEFAULT_ITEM = 0; // opens on its own once the items are out (Problem-solving, already top-right)
const ITEM = { w: 152, h: 118 };
// Info window (design frame): position, and its icon's centre and size, where
// the chosen item lands.
const CARD = { right: 1750, top: 152, w: 662, iconX: 14 + 61, iconY: 12 + 61, icon: 122 };
const HEADLINE_TOP = 34;
const WHY_W = 1897;
const WHY_H = 940;

// The desktop pin's scrubbed timeline, as fractions of the pin: the king
// travels to the centre, then the items emerge one after another.
const MOVE_END = 0.4;
const TITLE_OUT_AT = 0.02;
const TITLE_OUT_DUR = 0.26;
const EMERGE_AT = 0.36;
const EMERGE_GAP = 0.045;
const EMERGE_DUR = 0.22;
const EMERGE_END = EMERGE_AT + (WHY_ITEMS.length - 1) * EMERGE_GAP + EMERGE_DUR;
const STEP = (Math.PI * 2) / WHY_ITEMS.length; // even spacing on the orbit, clockwise

// The fall from the staircase.
const FALL_PAD = 24; // px kept clear around the falling king
const KING_W = 294; // the piece's widest part (its base) in the image
const FALL_SPINS = 2; // turns the king makes on its axis while it falls
const SPIN_END = 0.85; // fall progress where the spin ends
const MOVE_SPINS = 1; // turns the king makes while it moves to the centre

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function WhyChessSection() {
  const pinRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const fallerRef = useRef<HTMLImageElement>(null);

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
    const backdrop = q<HTMLDivElement>(".why__backdrop");
    // e: 0 = tucked behind the king, 1 = on the orbit. fly: 0 = on the orbit,
    // 1 = at the info window's icon spot.
    const items = WHY_ITEMS.map((data) => ({
      data,
      el: q<HTMLButtonElement>(`.why-item[data-id="${data.id}"]`),
      cardEl: q<HTMLSpanElement>(`.why-item[data-id="${data.id}"] .why-item__card`),
      st: { e: 0, fly: 0 },
    }));
    const cubes = WHY_CUBES.map((def, i) => ({ def, el: section.querySelectorAll<HTMLDivElement>(".why-cube")[i] }));

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const D = reduceMotion ? 0 : 1; // duration multiplier for the time-based tweens

    // ---- State ----
    const S = {
      title: 0, // heading reveal, 0 → 1
      titleOut: 0, // desktop: the heading leaving again once the king has landed, 0 → 1
      ring: 0, // ring spin-in, 0 → 1
      drop: 0, // phones: the king dropping into the hero box
      move: 0, // desktop: the king travelling from its landing spot to the centre
      rot: 0, // the orbit's turn, radians
      bg: 0, // the other items easing into the background while a window is open
      card: 0, // the info window opening
    };
    let mode: "desktop" | "mobile" = "desktop";
    let sel = -1; // index of the open item
    let lastFocus: HTMLElement | null = null;
    let clickTl: gsap.core.Timeline | null = null;
    let orbiting = false;
    itemsWrap.inert = true; // until every item is out on the orbit
    let dirty = true;
    const markDirty = () => (dirty = true);

    // ---- Layout: orbit and window geometry, in the coordinates the king and
    // items are drawn in (desktop: the design frame; phones: the hero box). ----
    type Geo = {
      cx: number; // the orbit
      cy: number;
      rx: number;
      ry: number;
      king: { cx: number; top: number; s: number }; // the centred king
      itemS: number;
      cardS: number;
      spot: { x: number; y: number; s: number };
      dropDist: number;
    };
    let geo: Geo | null = null;

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
        // (narrow tablets); the window stays right-aligned as it grows.
        const itemS = Math.max(ORBIT.item, 92 / (ITEM.w * k));
        const cardS = Math.max(1, 0.8 / k);
        const cardLeft = CARD.right - CARD.w * cardS;
        headline.style.top = `${HEADLINE_TOP}px`;
        card.style.left = `${cardLeft}px`;
        card.style.top = `${CARD.top}px`;
        geo = {
          cx: ORBIT.cx,
          cy: ORBIT.cy,
          rx: ORBIT.rx,
          ry: ORBIT.ry,
          king: KING_AT.centre,
          itemS,
          cardS,
          spot: { x: cardLeft + CARD.iconX * cardS, y: CARD.top + CARD.iconY * cardS, s: (CARD.icon * cardS) / ITEM.w },
          dropDist: 0,
        };
      } else {
        frame.style.transform = "";
        frame.style.removeProperty("--why-dy");
        headline.style.top = "";
        card.style.left = "";
        card.style.top = "";
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
          spot: { x: W - (ITEM.w * s) / 2 - 2, y: (ITEM.h * s) / 2 + 2, s },
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

      // Heading: each line rises out of its mask, the second a beat later.
      // Leaving plays the same reveal backwards (second line sinks first).
      const shown = Math.min(S.title, 1 - (desk ? S.titleOut : 0));
      titleLines.forEach((el, j) => {
        const p = clamp01((shown - j * 0.3) / 0.7);
        el.style.transform = `translateY(${(1 - titleEase(p)) * 140}%)`;
        el.style.opacity = String(clamp01(p * 2.5));
      });
      const away = desk ? S.bg : 0; // the heading steps back while a window is open
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

      // Items: out from behind the king (spiralling a little as they go) onto
      // the orbit; the open one flies to the window's icon spot.
      let allOut = true;
      items.forEach(({ el, cardEl, st }, i) => {
        const e = st.e;
        if (e < 0.98) allOut = false;
        const a = ORBIT_START + i * STEP + S.rot - (1 - Math.min(1, e)) * 0.7;
        const ox = g.cx + Math.cos(a) * g.rx;
        const oy = g.cy + Math.sin(a) * g.ry;
        const depth = 0.9 + 0.1 * Math.sin(a); // a touch smaller round the back (top) of the orbit
        let x = lerp(kcx, ox, e);
        let y = lerp(kcy, oy, e);
        let s = g.itemS * depth * (0.35 + 0.65 * e);
        let o = clamp01(e * 3);
        const b = S.bg * (1 - st.fly);
        s *= 1 - 0.06 * b;
        o *= 1 - 0.3 * b;
        x = lerp(x, g.spot.x, st.fly);
        y = lerp(y, g.spot.y, st.fly);
        s = lerp(s, g.spot.s, st.fly);
        o = lerp(o, 1, st.fly);
        at(el, x - (ITEM.w / 2) * s, y - (ITEM.h / 2) * s, s);
        el.style.opacity = String(o);
        // Out of focus while in the background, as in the design.
        cardEl.style.filter = b > 0.01 ? `blur(${(2.5 * b).toFixed(2)}px)` : "";
        // Behind the king while on the orbit; above the window once flying to it.
        el.style.zIndex = st.fly > 0.001 ? "7" : "1";
      });
      if (allOut !== orbiting) {
        orbiting = allOut;
        section!.classList.toggle("is-orbiting", orbiting);
        itemsWrap.inert = !orbiting;
      }

      if (desk) {
        cubes.forEach(({ def, el }) => {
          const s = lerp(def.closed[2], def.open[2], m);
          at(el, lerp(def.closed[0], def.open[0], m) - s / 2, lerp(def.closed[1], def.open[1], m) - s / 2, s / 100);
        });
        floor.style.opacity = String(m);
        headline.style.opacity = String(S.card);
        headline.style.transform = `translateY(${(1 - S.card) * 24}px)`;
        card.style.opacity = String(S.card);
        card.style.transform = `translateY(${(1 - S.card) * 22}px) scale(${g.cardS * (0.97 + 0.03 * S.card)})`;
      } else {
        card.style.opacity = "";
        card.style.transform = `translateY(${(1 - S.card) * 110}%)`;
      }
      card.style.visibility = S.card > 0.001 ? "visible" : "hidden";
      card.style.pointerEvents = S.card > 0.5 ? "auto" : "none";
    }

    // ---- Info window ----
    function fill(it: WhyItem) {
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
    fill(WHY_ITEMS[0]);

    // Turn the orbit so item i reaches the point nearest the window, fly it
    // there, and only once it has arrived open the window.
    // Once the items are all out, DEFAULT_ITEM opens on its own: once per
    // pass, so a visitor who closes it isn't overruled until the items have
    // been tucked away (scrolled back) and come out again.
    let autoOpened = false;
    const allOut = () => items.every((it) => it.st.e >= 0.98);
    function openDefault() {
      if (autoOpened || sel >= 0) return;
      autoOpened = true;
      select(DEFAULT_ITEM, null);
    }

    // fromEl null: opened by the page itself (the default item), so focus stays put.
    function select(i: number, fromEl: HTMLElement | null) {
      const g = geo;
      if (!allOut() || !g) return;
      if (sel === i) return close({ restoreFocus: true });
      if (sel < 0) lastFocus = fromEl;
      sel = i;
      clickTl?.kill();
      const target = Math.atan2((g.spot.y - g.cy) / g.ry, (g.spot.x - g.cx) / g.rx);
      const from = ORBIT_START + i * STEP + S.rot;
      const TAU = Math.PI * 2;
      const delta = ((((target - from) % TAU) + TAU * 1.5) % TAU) - Math.PI; // shortest way round
      const rotDur = (0.7 + Math.abs(delta) * 0.3) * D;
      const tl = gsap.timeline({ onUpdate: markDirty });
      // Switching items: the open window closes first, while it's still full.
      if (S.card > 0) tl.to(S, { card: 0, duration: 0.25 * D, ease: "power2.in" });
      const t0 = tl.duration();
      tl.to(S, { rot: S.rot + delta, duration: rotDur, ease: "power2.inOut" }, t0);
      tl.to(S, { bg: 1, duration: 0.6 * D, ease: "power2.out" }, t0);
      tl.to(items.filter((_, j) => j !== i).map((it) => it.st), { fly: 0, duration: 0.6 * D, ease: "power3.inOut" }, t0);
      tl.to(items[i].st, { fly: 1, duration: 0.75 * D, ease: "power3.inOut" }, t0 + rotDur * 0.5);
      tl.call(() => {
        fill(WHY_ITEMS[i]);
        section!.classList.add("is-open");
        card.inert = false;
      });
      tl.to(S, { card: 1, duration: 0.55 * D, ease: "power3.out" });
      if (fromEl) tl.call(() => closeBtn.focus({ preventScroll: true }));
      clickTl = tl;
    }

    function close({ instant = false, restoreFocus = false } = {}) {
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
        dirty = true;
      } else {
        clickTl = gsap
          .timeline({ onUpdate: markDirty })
          .to(S, { card: 0, duration: 0.3 * D, ease: "power2.in" })
          .to(sts, { fly: 0, duration: 0.7 * D, ease: "power3.inOut" }, ">-0.05")
          .to(S, { bg: 0, duration: 0.7 * D, ease: "power2.inOut" }, "<");
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
      if (sel >= 0 && !(e.target as HTMLElement).closest(".why-item, .why-card")) closeByUser();
    };
    section.addEventListener("click", onSectionClick);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sel >= 0) closeByUser();
    };
    addEventListener("keydown", onKeyDown);

    // ---- Landing: the ring spins up around the king ----
    let revealed = false;
    function reveal(landed: boolean) {
      if (revealed) return;
      revealed = true;
      gsap.to(S, { ring: 1, duration: 1 * D, delay: 0.15 * D, ease: "back.out(1.6)", onUpdate: markDirty });
      // Without the fall to follow, the heading rises on its own.
      if (!handoff()) gsap.to(S, { title: 1, duration: 1.4 * D, ease: "none", onUpdate: markDirty });
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
    }
    const onLanded = () => kingImg.classList.remove("is-landing");
    kingImg.addEventListener("animationend", onLanded);
    const setTitle = (v: number) => {
      if (S.title === v) return;
      gsap.killTweensOf(S, "title");
      S.title = v;
      dirty = true;
    };

    // ---- Per-breakpoint timelines ----
    const visibility = new IntersectionObserver(
      ([entry]) => {
        // Desktop without the staircase hand-off (reduced motion, or the 3D
        // board isn't ready): land when it scrolls into view.
        if (mode === "desktop" && !handoff() && entry.isIntersecting) reveal(false);
      },
      { threshold: 0.3 }
    );
    const resetState = () => {
      close({ instant: true });
      autoOpened = false;
      gsap.killTweensOf([S, ...items.map((it) => it.st)]);
      Object.assign(S, { title: 0, titleOut: 0, ring: 0, drop: 0, move: 0, rot: 0, bg: 0, card: 0 });
      items.forEach((it) => Object.assign(it.st, { e: 0, fly: 0 }));
      revealed = false;
    };

    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 820px)", mobile: "(max-width: 819.98px)" }, (ctx) => {
      mode = ctx.conditions!.desktop ? "desktop" : "mobile";
      resetState();
      layout();
      if (mode === "desktop") {
        // One scrubbed timeline across the pin: king to the centre, then the
        // items out onto the orbit. Scrolling back plays it backwards.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: markDirty,
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
              // Every item out: the default one opens (once per pass).
              if (self.progress >= EMERGE_END) openDefault();
              // Back above the orbit: the open window gives way to the scroll.
              else if (self.progress < EMERGE_END - 0.02) {
                close();
                autoOpened = false;
              }
              // Items fully tucked away: the orbit starts from its first turn again.
              if (self.progress < EMERGE_AT && sel < 0 && !clickTl?.isActive()) S.rot = 0;
            },
          },
        });
        // The heading leaves as the king sets off for the centre.
        tl.to(S, { titleOut: 1, duration: TITLE_OUT_DUR, ease: "none" }, TITLE_OUT_AT);
        tl.to(S, { move: 1, duration: MOVE_END, ease: "power2.inOut" }, 0);
        items.forEach(({ st }, i) =>
          tl.to(st, { e: 1, duration: EMERGE_DUR, ease: "back.out(1.4)" }, EMERGE_AT + i * EMERGE_GAP)
        );
        tl.set({}, {}, 1);
        // Re-observe so a visitor already here gets the landing straight away.
        visibility.unobserve(section);
        visibility.observe(section);
      } else {
        // Phones: unpinned (no scroll jitter); the same sequence plays when
        // the section scrolls into view and reverses when scrolled back above.
        const tl = gsap.timeline({
          onUpdate: markDirty,
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            toggleActions: "play none none reverse",
            onLeaveBack: () => {
              close({ instant: true });
              autoOpened = false;
            },
          },
        });
        tl.to(S, { title: 1, duration: 1.1, ease: "none" }, 0);
        tl.to(S, { drop: 1, duration: 0.9, ease: "bounce.out" }, 0.15);
        tl.to(S, { ring: 1, duration: 0.9, ease: "back.out(1.6)" }, 0.8);
        items.forEach(({ st }, i) => tl.to(st, { e: 1, duration: 0.7, ease: "back.out(1.4)" }, 0.95 + i * 0.07));
        tl.eventCallback("onComplete", openDefault);
        if (reduceMotion) tl.timeScale(50);
      }
      return () => close({ instant: true });
    });

    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(section);
    resizeObserver.observe(hero);

    // ---- The king: the staircase's 3D king, all the way down ----
    // The fall is tied to the scroll between the staircase's last level and
    // this section reaching the top of the screen; the heading rises with it.
    // After the landing the same 3D king stays: it is drawn over the (hidden)
    // image king's exact spot, so it rides the layout here — resting where it
    // landed, then spinning MOVE_SPINS turns on its axis as the pinned scroll
    // carries it to the centre. Scrolling back plays it all backwards. The
    // image only shows if the 3D king can't be drawn (no WebGL, phones,
    // reduced motion, or the 3D board isn't ready).
    const handoff = () => mode === "desktop" && !reduceMotion && !!staircase.current?.active();
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
    const showKing = (on: boolean) => {
      if (on !== kingShown) {
        kingShown = on;
        kingEl.style.visibility = on ? "" : "hidden";
      }
    };
    const draw3d = (stairs: StaircaseHandle, pose: Parameters<StaircaseHandle["fallKing"]>[0]) => {
      const key = pose ? `${pose.cx.toFixed(1)}|${pose.bottom.toFixed(1)}|${pose.h.toFixed(2)}|${pose.spin.toFixed(4)}` : "";
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
      return draw3d(stairs, {
        cx: r.left + r.width / 2,
        bottom: r.top + KING_BOX.base * es,
        h: KING_PIECE * es,
        spin: -MOVE_SPINS * 2 * Math.PI * p, // leftwards, the way it travels
        opacity: 1,
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
      // Where the pin starts: the section's resting top before it sticks.
      const top = scrollY + pin!.getBoundingClientRect().top;
      const y1 = stairs.pinEnd();
      // +2px: scroll positions can be fractional, so the last pixel still counts as landed.
      const t = top > y1 ? clamp01((scrollY - y1 + 2) / (top - y1)) : 1;
      setTitle(clamp01((t - 0.15) / 0.85));
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
      offFrame();
      mm.revert();
      clickTl?.kill();
      gsap.killTweensOf([S, ...items.map((it) => it.st)]);
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
              {WHY_CUBES.map((c, i) => {
                const [t, l, r] = CUBE_FACES[c.c];
                return (
                  <div key={i} className="why-cube">
                    <svg viewBox="0 0 100 100" style={{ "--d": `${-i * 1.7}s` } as CSSProperties}>
                      <g strokeLinejoin="round" strokeWidth="4" transform={`rotate(${c.r} 50 52)`}>
                        <polygon points="50,10 90,31 50,52 10,31" fill={t} stroke={t} />
                        <polygon points="10,31 50,52 50,94 10,73" fill={l} stroke={l} />
                        <polygon points="50,52 90,31 90,73 50,94" fill={r} stroke={r} />
                      </g>
                    </svg>
                  </div>
                );
              })}
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
          <div className="why__backdrop" />
        </section>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={fallerRef} className="why-faller" src={KING_SRC} alt="" aria-hidden="true" />
    </>
  );
}
