"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { onFrame } from "./SmoothScroll";
import { staircase } from "./staircaseBridge";
import "./whyChessSection.scss";

// Why Chess Is Important: the king falls in from the staircase above, the
// ring spins up around it, then the insight cards stagger in. On desktop the
// section then stays pinned while further scrolling carries the king to the
// centre and opens the first card's window. Clicking a card opens its info
// window (desktop: the king moves to centre and the window opens beside it;
// phones: a bottom sheet). Ported from the "Scientifically
// Structured improved" design reference.

type WhyItem = {
  id: string;
  label: string;
  headline: [string, string, string]; // before, highlighted, after
  title: string;
  desc: string;
  highlight: string;
};

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
    id: "creativity",
    label: "Creativity",
    headline: ["Spark ", "Creative", " Thinking"],
    title: "Builds Creativity & Imagination",
    desc: "Every game asks for new ideas: an unusual plan, a surprising sacrifice, a fresh way to use each piece.",
    highlight: "Children learn there is more than one route to a goal, and to look for the best one.",
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
    id: "memory",
    label: "Memory and focus",
    headline: ["Train a ", "Sharper", " Memory"],
    title: "Improves Memory & Concentration",
    desc: "Players keep openings, patterns and plans in mind while staying focused for a whole game.",
    highlight: "Long, calm focus becomes a habit that carries over to homework and exams.",
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
    id: "fitness",
    label: "Brain fitness",
    headline: ["A ", "Workout", " for the Mind"],
    title: "Keeps the Brain Active",
    desc: "Like exercise for the body, regular challenging play keeps the mind working at any age.",
    highlight: "Research has linked board games like chess to healthier thinking skills later in life.",
  },
  {
    id: "speed",
    label: "Quick decisions",
    headline: ["Decide ", "Faster", " Under Pressure"],
    title: "Sharpens Quick Decision-Making",
    desc: "Timed games train players to spot the key idea quickly and commit to a move with confidence.",
    highlight: "Calm, quick decisions under the clock are a skill for life.",
  },
  {
    id: "planning",
    label: "Planning and time management",
    headline: ["Plan ", "Ahead", " with Purpose"],
    title: "Teaches Planning & Time Management",
    desc: "Players set long-term plans, manage their clock and adjust when the position changes.",
    highlight: "Thinking several moves ahead turns into planning the week ahead.",
  },
];

const img = (id: string) => `/images/why/${id}.webp`;
const KING_SRC = img("king");
const RING_SRC = img("ring");

type Spot = readonly [number, number, number, number]; // centre x, centre y, card width, blur px

// Design-frame positions (1897 × 940).
const WHY_CLOSED: Record<string, Spot> = {
  problem: [1623, 263, 152, 0],
  creativity: [1103, 462, 113, 3],
  logic: [722, 613, 125, 0],
  memory: [338, 761, 153, 0],
  hemispheres: [1158, 775, 145, 0],
  fitness: [1797, 650, 111, 0],
  speed: [470, 560, 96, 3.5],
  planning: [905, 815, 98, 3],
};
// Open state: the other cards take these spots around the centred king.
const WHY_OPEN_SLOTS: Spot[] = [
  [765, 262, 140, 0],
  [512, 455, 140, 1.5],
  [1340, 500, 112, 0],
  [636, 680, 140, 3],
  [1174, 683, 140, 1],
  [300, 640, 96, 4],
  [1560, 700, 96, 4],
];
const WHY_SELECTED_SPOT: Spot = [1163, 212, 118, 0]; // the window's icon, where the chosen item flies to

type CubeDef = { c: keyof typeof CUBE_FACES; r: number; closed: Spot3; open: Spot3 };
type Spot3 = readonly [number, number, number]; // centre x, centre y, size
const CUBE_FACES = {
  beige: ["#f6ead3", "#dcc8a4", "#c4ad86"],
  light: ["#c4d8f4", "#93b3df", "#7499cb"],
  blue: ["#5486d8", "#2f5fb4", "#21478f"],
  duo: ["#f3f4f7", "#2f5fb4", "#21478f"],
} as const;
const WHY_CUBES: CubeDef[] = [
  { c: "beige", r: 14, closed: [1622, 88, 34], open: [1635, 132, 52] },
  { c: "light", r: -10, closed: [290, 198, 30], open: [290, 400, 52] },
  { c: "blue", r: 18, closed: [660, 793, 30], open: [510, 800, 30] },
  { c: "duo", r: -16, closed: [1707, 762, 48], open: [1707, 800, 48] },
];

const KING_BOX = { w: 486, h: 728, cx: 243, top: 14, bottom: 712 }; // the image and where the piece sits in it
// Closed: the king's base sits on the section's bottom edge so it doesn't hang
// over the Earth at the top of the reviews section below.
const KING_AT = { closed: { cx: 1412, top: 101, s: 1.179 }, open: { cx: 910, top: 244, s: 0.984 } };
const RING_AT = { closed: { cx: 1410, cy: 360, d: 410 }, open: { cx: 912, cy: 515, d: 405 } };
// Desktop: after the landing the section stays pinned while the king travels
// to the centre and SCROLL_ITEM's window opens, all following the scroll.
const SCROLL_ITEM = "problem";
const SCROLL_OPEN_AT = 0.6; // progress at which the window opens
const WHY_W = 1897;
const WHY_H = 940;

// Cards stagger in outward from the king.
const REVEAL_ORDER = WHY_ITEMS.map((it) => it.id).sort((a, b) => {
  const d = (id: string) => Math.hypot(WHY_CLOSED[id][0] - 1412, WHY_CLOSED[id][1] - 360);
  return d(a) - d(b);
});

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
    const kingEl = q<HTMLDivElement>(".why__king");
    const kingImg = kingEl.querySelector("img")!;
    const ringEl = q<HTMLDivElement>(".why__ring");
    const headline = q<HTMLParagraphElement>(".why__headline");
    const card = q<HTMLDivElement>(".why-card");
    const cardIcon = q<HTMLImageElement>(".why-card__icon");
    const cardHeadline = q<HTMLParagraphElement>(".why-card__headline");
    const cardTitle = q<HTMLHeadingElement>(".why-card h3");
    const cardDesc = q<HTMLParagraphElement>(".why-card__desc");
    const cardHi = q<HTMLParagraphElement>(".why-card__highlight");
    const closeBtn = q<HTMLButtonElement>(".why-card__close");
    const backdrop = q<HTMLDivElement>(".why__backdrop");
    const items = WHY_ITEMS.map((data) => ({ data, el: q<HTMLButtonElement>(`.why-item[data-id="${data.id}"]`) }));
    const cubes = WHY_CUBES.map((def, i) => ({ def, el: section.querySelectorAll<HTMLDivElement>(".why-cube")[i] }));

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileMQ = matchMedia("(max-width: 819.98px)");

    // ---- Layout ----
    let mobile = mobileMQ.matches;
    let openId: string | null = null;
    let lastFocus: HTMLElement | null = null;
    let scrollMode = true; // false once the visitor opens/closes an item themselves
    let progress = 0; // 0 → 1 through the pin after the landing
    const at = (el: HTMLElement, x: number, y: number, s: number) =>
      (el.style.transform = `translate(${x}px, ${y}px) scale(${s})`);

    // Every moving part's [x, y, scale(, blur)] for the closed layout (sel
    // null) or the layout with `sel`'s window open.
    type Pose = { king: number[]; ring: number[]; items: number[][]; cubes: number[][] };
    function pose(sel: string | null): Pose {
      const st = sel ? "open" : "closed";
      const k = KING_AT[st];
      const r = RING_AT[st];
      const rs = r.d / 446;
      let slot = 0;
      return {
        king: [k.cx - KING_BOX.cx * k.s, k.top, k.s],
        ring: [r.cx - 223 * rs, r.cy - 224 * rs, rs],
        items: items.map(({ data }) => {
          const p = !sel ? WHY_CLOSED[data.id] : data.id === sel ? WHY_SELECTED_SPOT : WHY_OPEN_SLOTS[slot++];
          const s = p[2] / 152;
          return [p[0] - 76 * s, p[1] - 59 * s, s, p[3] / s];
        }),
        cubes: cubes.map(({ def }) => {
          const p = def[st];
          return [p[0] - p[2] / 2, p[1] - p[2] / 2, p[2] / 100];
        }),
      };
    }
    const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

    function place() {
      if (mobile) return;
      if (!scrollMode) section!.classList.remove("is-scrubbing");
      // Scroll mode: the layout follows the pin's progress towards SCROLL_ITEM
      // being open. Once the visitor clicks, it's theirs (manual).
      const sel = scrollMode ? SCROLL_ITEM : openId;
      const to = pose(sel);
      const P = scrollMode ? mixPoses(pose(null), to, progress) : to;
      at(kingEl, P.king[0], P.king[1], P.king[2]);
      at(ringEl, P.ring[0], P.ring[1], P.ring[2]);
      items.forEach(({ data, el }, i) => {
        const p = P.items[i];
        at(el, p[0], p[1], p[2]);
        el.style.setProperty("--blur", `${p[3]}px`);
        el.classList.toggle("is-selected", data.id === sel);
      });
      cubes.forEach(({ el }, i) => at(el, P.cubes[i][0], P.cubes[i][1], P.cubes[i][2]));
    }
    const mixPoses = (a: Pose, b: Pose, t: number): Pose => ({
      king: mix(a.king, b.king, t),
      ring: mix(a.ring, b.ring, t),
      items: a.items.map((v, i) => mix(v, b.items[i], t)),
      cubes: a.cubes.map((v, i) => mix(v, b.cubes[i], t)),
    });

    function layout() {
      mobile = mobileMQ.matches;
      if (mobile) {
        [frame, kingEl, ringEl, ...items.map((i) => i.el), ...cubes.map((c) => c.el)].forEach((el) => (el.style.transform = ""));
        return;
      }
      const k = section!.clientWidth / WHY_W;
      frame.style.transform = `translate(0px, ${section!.clientHeight - WHY_H * k}px) scale(${k})`;
      place();
    }
    addEventListener("resize", layout);
    mobileMQ.addEventListener("change", layout);
    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(section);
    layout();

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

    let swapTimer: number | undefined;
    function open(id: string, fromEl?: HTMLElement, auto?: boolean) {
      if (!revealed) return;
      const it = WHY_ITEMS.find((x) => x.id === id)!;
      if (openId && openId !== id && !mobile && !reduceMotion) {
        card.classList.add("is-swapping");
        headline.classList.add("is-swapping");
        clearTimeout(swapTimer);
        swapTimer = window.setTimeout(() => {
          fill(it);
          card.classList.remove("is-swapping");
          headline.classList.remove("is-swapping");
        }, 200);
      } else fill(it);
      if (!openId) lastFocus = fromEl || null;
      openId = id;
      section!.classList.add("is-open");
      card.inert = false;
      place();
      if (!auto) closeBtn.focus({ preventScroll: true });
    }

    function close(silent?: boolean) {
      if (!openId) return;
      openId = null;
      section!.classList.remove("is-open");
      card.inert = true;
      place();
      if (!silent && lastFocus) lastFocus.focus({ preventScroll: true });
      lastFocus = null;
    }

    const itemHandlers = items.map(({ data, el }) => {
      const h = (e: MouseEvent) => {
        e.stopPropagation();
        scrollMode = false;
        open(data.id, el);
      };
      el.addEventListener("click", h);
      return () => el.removeEventListener("click", h);
    });
    const closeByUser = () => {
      scrollMode = false;
      close();
    };
    const onClose = (e: MouseEvent) => {
      e.stopPropagation();
      closeByUser();
    };
    closeBtn.addEventListener("click", onClose);
    backdrop.addEventListener("click", closeByUser);
    // Clicking empty space around the open window closes it.
    const onSectionClick = (e: MouseEvent) => {
      if (openId && !(e.target as HTMLElement).closest(".why-item, .why-card")) closeByUser();
    };
    section.addEventListener("click", onSectionClick);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openId) closeByUser();
    };
    addEventListener("keydown", onKeyDown);

    // ---- Reveal: ring first, then the cards ----
    let revealed = false;
    function reveal(landed: boolean) {
      if (revealed) return;
      revealed = true;
      section!.classList.add("is-revealed");
      if (landed && !reduceMotion) {
        kingImg.classList.remove("is-landing");
        void kingImg.offsetWidth;
        kingImg.classList.add("is-landing");
      }
    }
    function unreveal() {
      if (!revealed) return;
      revealed = false;
      close(true);
      section!.classList.remove("is-revealed");
      resetScrollMode();
    }
    // Back at the start of the pin, scrolling drives the layout again.
    function resetScrollMode() {
      if (scrollMode) return;
      scrollMode = true;
      close(true);
      place();
    }

    // ---- After the landing: the pinned scroll carries the king to the centre
    // and opens SCROLL_ITEM's window. Positions follow the scroll exactly
    // (transitions off); the window and texts fade in on their own. ----
    function scrub(p: number) {
      const was = progress;
      progress = revealed ? p : 0;
      if (progress <= 0 && was > 0) resetScrollMode();
      if (!scrollMode || mobile || progress === was) return;
      section!.classList.toggle("is-scrubbing", progress > 0 && progress < 1);
      if (progress >= SCROLL_OPEN_AT) {
        if (openId !== SCROLL_ITEM) open(SCROLL_ITEM, undefined, true);
      } else close(true);
      place();
    }
    const onLanded = () => kingImg.classList.remove("is-landing");
    kingImg.addEventListener("animationend", onLanded);

    // ---- The fall: tied to the scroll between the staircase's last level
    // and this section reaching the top of the screen. The 3D king is
    // swapped for the same king as an image at its exact screen spot, which
    // then drops into its place here. Scrolling back lifts it back up. ----
    const handoff = () => !mobile && !reduceMotion && !!staircase.current?.active();
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
    let fallerOn = false;
    let kingShown = true;
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
    const offFrame = onFrame(() => {
      // Where the pin starts: the section's resting top before it sticks.
      const top = scrollY + pin.getBoundingClientRect().top;
      const travel = pin.offsetHeight - section.offsetHeight;
      scrub(travel > 0 ? clamp01((scrollY - top) / travel) : 0);

      const stairs = staircase.current;
      if (!stairs || !handoff()) {
        showFaller(false);
        showKing(true);
        stairs?.setKingHidden(false);
        return;
      }
      const y1 = stairs.pinEnd();
      // +2px: scroll positions can be fractional, so the last pixel still counts as landed.
      const t = top > y1 ? clamp01((scrollY - y1 + 2) / (top - y1)) : 1;
      if (t <= 0) {
        showFaller(false);
        showKing(true);
        stairs.setKingHidden(false);
        unreveal();
        return;
      }
      if (t >= 1) {
        showFaller(false);
        showKing(true);
        stairs.setKingHidden(true);
        reveal(true);
        return;
      }
      const S = stairs.kingRect();
      if (!S) {
        showFaller(false);
        showKing(true);
        return;
      }
      if (t < 0.96) unreveal();
      // Target: the king's place in this section, read live (it moves with the page).
      const r = kingEl.getBoundingClientRect();
      const es = r.width / KING_BOX.w;
      const E = { cx: r.left + r.width / 2, bottom: r.top + KING_BOX.bottom * es, h: (KING_BOX.bottom - KING_BOX.top) * es };
      // A small hop off the step, then an accelerating drop.
      const fall = t < 0.22 ? -0.07 * Math.sin((t / 0.22) * Math.PI) : Math.pow((t - 0.22) / 0.78, 2);
      const e = t * t * (3 - 2 * t);
      const cx = S.cx + (E.cx - S.cx) * e;
      const bottom = S.bottom + (E.bottom - S.bottom) * fall;
      const h = S.h + (E.h - S.h) * e;
      const s = h / (KING_BOX.bottom - KING_BOX.top);
      const rot = -9 * Math.sin(Math.PI * t);
      faller.style.transform = `translate(${cx}px, ${bottom}px) rotate(${rot}deg) scale(${s}) translate(${-KING_BOX.cx}px, ${-KING_BOX.bottom}px)`;
      showFaller(true);
      showKing(false);
      stairs.setKingHidden(true);
    });

    // Phones, reduced motion, or no pinned staircase: reveal when it scrolls into view.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (!handoff() && entry.isIntersecting) reveal(false);
      },
      { threshold: 0.3 }
    );
    visibility.observe(section);

    return () => {
      offFrame();
      visibility.disconnect();
      resizeObserver.disconnect();
      clearTimeout(swapTimer);
      removeEventListener("resize", layout);
      mobileMQ.removeEventListener("change", layout);
      removeEventListener("keydown", onKeyDown);
      itemHandlers.forEach((off) => off());
      closeBtn.removeEventListener("click", onClose);
      backdrop.removeEventListener("click", closeByUser);
      section.removeEventListener("click", onSectionClick);
      kingImg.removeEventListener("animationend", onLanded);
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
              <span>Why Chess Is</span> <span>Important</span>
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
            <div className="why__hero" aria-hidden="true">
              <div className="why__king">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={KING_SRC} alt="" />
              </div>
              <div className="why__ring">
                <div className="why__ring-in">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={RING_SRC} alt="" />
                </div>
              </div>
            </div>
            <div className="why__items" role="group" aria-label="Benefits of chess">
              {WHY_ITEMS.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className="why-item"
                  data-id={it.id}
                  aria-label={`${it.title}: show details`}
                  style={{ "--i": REVEAL_ORDER.indexOf(it.id) } as CSSProperties}
                >
                  <span className="why-item__reveal">
                    <span className="why-item__bob">
                      <span className="why-item__card">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img(it.id)} alt="" />
                      </span>
                    </span>
                  </span>
                </button>
              ))}
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
