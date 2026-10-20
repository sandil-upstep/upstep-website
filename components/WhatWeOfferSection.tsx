"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import { Open_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Eyebrow from "./Eyebrow";
import RevealTitle from "./RevealTitle";
import { getLenis, onFrame } from "./SmoothScroll";
import "./whatWeOfferSection.scss";

gsap.registerPlugin(ScrollTrigger);

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

// Transparent cut-outs sharing one frame (same width, top-left aligned). The
// laptop's screen is see-through, so the active slide sits behind it and the
// bezel frames it; the boy is layered over the whole slider.
const LAPTOP = { src: "/images/laptop-3d.png", width: 1120, height: 838 };
const BOY = { src: "/images/boy-3d.png", width: 1120, height: 838 };
const SCENE_SIZES = "(min-width: 1200px) 59vw, 106vw";
// depth: how far each drifts with the scroll (see CubeParallax).
const CUBES = [
  { src: "/images/cubes/cube-4.png", depth: 0.5 },
  { src: "/images/cubes/cube-21.png", depth: 0.8 },
];

// A slide is either a local/remote image or a YouTube video. YouTube slides
// show the video's thumbnail (or `poster`) until played.
type Slide =
  | { kind: "image"; src: string; title: string }
  | { kind: "youtube"; videoId: string; title: string; poster?: string };

// TODO: replace the placeholder images / video IDs with real UpStep content.
const SLIDES: Slide[] = [
  { kind: "youtube", videoId: "aqz-KE-bpKQ", title: "Interactive live classes with a coach" },
  { kind: "image", src: "/images/anand-video-thumb.png", title: "Learn from the 5-time World Chess Champion" },
  { kind: "youtube", videoId: "eRsGyueVLvQ", title: "Structured level-based curriculum" },
  { kind: "image", src: "/images/anand-cards-img.png", title: "Puzzles and practice cards" },
  { kind: "youtube", videoId: "R6MlUcmOul8", title: "Weekly tournaments" },
  { kind: "image", src: "/images/player2.png", title: "Personalised progress tracking" },
  // { kind: "youtube", videoId: "WhWc3b3KhnY", title: "Game analysis sessions" },
  // { kind: "image", src: "/images/player.png", title: "Small batches, personal attention" },
  // { kind: "youtube", videoId: "YE7VzlLtp-4", title: "Parent progress reports" },
  // { kind: "image", src: "/images/certificate.png", title: "Level completion certificates" },
];

const N = SLIDES.length;

// Vertical scroll spent on each slide while the section is pinned, as a
// fraction of the viewport height.
const SCROLL_PER_SLIDE = 0.5;

// Share of each slide's stretch of scroll, either side of its middle, where
// the carousel holds still; it slides across the rest, in step with the scroll.
const HOLD = 0.08;

// Seconds the page takes to glide to a slide's spot (buttons, wheel, keys).
const SEEK_S = 1.1;

// Slots in order of a slide's offset from the active one, -3..3. While pinned,
// each slide is placed by blending the two slots its offset falls between.
const SCRUB_SLOTS = ["out-l", "-2", "-1", "0", "1", "2", "out-r"];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

// A slide's offset from the (fractional) position s, wrapped into [-3, 3) so
// the carousel runs in a circle: a slide wraps from out-l to out-r, both hidden.
function offsetOf(index: number, s: number) {
  const o = (((index - s) % N) + N) % N;
  return o >= 3 ? o - N : o;
}

// Where a slide sits relative to the active one: "0" is the laptop screen,
// "-1".."3" are the faded cards around it, "out-r" waits off-stage. Only the
// previous slide is kept behind, so even a short list fills the mobile deck
// (1..3). (Desktop shows -1..2; while pinned the scroll places the slides.)
function slotOf(index: number, active: number) {
  const o = (index - active + N) % N;
  if (o === N - 1) return "-1";
  return o <= 3 ? String(o) : "out-r";
}

const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const ytEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;

export default function WhatWeOfferSection() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const swipeX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  // True while the scroll pin runs (once mounted, at every width); the scroll
  // then drives the slides.
  const pinnedRef = useRef(false);
  // The slide the scroll last showed.
  const shownRef = useRef(0);
  // True while goTo's scroll to a slide's spot is still under way.
  const seekingRef = useRef(false);
  const seekTimer = useRef<number | null>(null);
  // The slide the page scroll is heading to; it runs ahead of the shown slide
  // while goTo's scroll is still on its way to the slide's band.
  const headingRef = useRef(0);

  // Page scroll where the pin holds the section, measured live so a section
  // above changing height can never leave it stale.
  const getRange = useCallback(() => {
    const wrap = pinRef.current;
    const section = sectionRef.current;
    if (!pinnedRef.current || !wrap || !section) return null;
    const stickTop = Math.min(0, window.innerHeight - section.offsetHeight);
    const distance = wrap.offsetHeight - section.offsetHeight;
    if (distance <= 0) return null;
    const start = wrap.getBoundingClientRect().top + window.scrollY - stickTop;
    return { start, end: start + distance };
  }, []);

  // Buttons, keys, swipes, wheel and card clicks scroll the page to the
  // slide's spot inside the pin; the scrub then follows the scroll there.
  const goTo = useCallback((i: number) => {
    const index = Math.min(N - 1, Math.max(0, i));
    headingRef.current = index;
    const range = getRange();
    if (!range) return;
    // The middle of the slide's band, where the carousel rests on it.
    const top = Math.round(range.start + ((range.end - range.start) * (index + 0.5)) / N);
    const lenis = getLenis();
    // The timer also covers a Lenis scroll that's interrupted (e.g. by the
    // scrollbar) and never completes, so the wheel can't stay locked.
    seekingRef.current = true;
    if (seekTimer.current !== null) clearTimeout(seekTimer.current);
    seekTimer.current = window.setTimeout(() => (seekingRef.current = false), lenis ? SEEK_S * 1000 + 400 : 1300);
    // Through Lenis when it's running: a native smooth scroll fights its
    // inertia. Eased in and out so each slide gathers pace and settles.
    if (lenis) {
      lenis.scrollTo(top, {
        duration: SEEK_S,
        easing: easeInOutSine,
        force: true,
        onComplete: () => (seekingRef.current = false),
      });
    } else {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    }
  }, [getRange]);

  // ---- Scroll pin + scrub ----
  // The section sticks inside a taller wrapper (CSS `position: sticky`, as in
  // AnandSliderPin; a ScrollTrigger pin would jolt a section this big as it
  // switches to `position: fixed`). The extra height is split into N equal
  // bands of SCROLL_PER_SLIDE viewports, one per slide. A section taller than
  // the viewport pins by its bottom edge so the whole carousel stays in view.
  //
  // As in ScientificallyStructuredSection, the page scroll is the single
  // source of truth: every frame it gives a fractional position (2.0 = slide 3
  // on the laptop, 2.5 = halfway to slide 4) and each slide is drawn from it,
  // so nothing queues or lags: scroll back and the move plays backwards.
  // Each slide carries one paused animation through all the slots (read from
  // the stylesheet with a probe, so the CSS stays the source of every layout),
  // and the scroll sets how far along it is. Phones pin the same way, scrubbed
  // by touch scrolling.
  useEffect(() => {
    const wrap = pinRef.current;
    const section = sectionRef.current;
    const track = trackRef.current;
    const laptop = track?.querySelector<HTMLElement>(".wwo__laptop");
    if (!wrap || !section || !track || !laptop) return;
    const wideMQ = window.matchMedia("(min-width: 1200px)");
    const reducedMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const slides = Array.from(track.querySelectorAll<HTMLElement>(".wwo__slide"));

    type SlotStyle = { opacity: number; fade: number };
    let anims: Animation[] = [];
    let slotStyles: SlotStyle[] = [];
    let dirty = true;
    let lastS = NaN;
    let lastY = NaN;

    // Read each slot's resolved geometry from the stylesheet.
    const build = () => {
      dirty = false;
      anims.forEach((a) => a.cancel());
      const probe = document.createElement("div");
      probe.className = "wwo__slide";
      probe.setAttribute("aria-hidden", "true");
      probe.style.transition = "none";
      probe.style.visibility = "hidden";
      track.appendChild(probe);
      const frames: Keyframe[] = [];
      slotStyles = SCRUB_SLOTS.map((slot) => {
        probe.dataset.slot = slot;
        const cs = getComputedStyle(probe);
        frames.push({ left: cs.left, top: cs.top, width: cs.width, height: cs.height, transform: cs.transform });
        return { opacity: parseFloat(cs.opacity) || 0, fade: parseFloat(cs.getPropertyValue("--fade")) || 0 };
      });
      probe.remove();
      anims = slides.map((el) => {
        const a = el.animate(frames, { duration: 1000, fill: "both", easing: "linear" });
        a.pause();
        return a;
      });
      lastS = NaN;
    };

    const clear = () => {
      anims.forEach((a) => a.cancel());
      anims = [];
      slides.forEach((el) => {
        el.style.removeProperty("opacity");
        el.style.removeProperty("--fade");
        el.style.removeProperty("z-index");
      });
    };

    // Stacking while a slide moves. Desktop: between the screen and either
    // neighbouring card a slide stays under the laptop (it's passing behind
    // the bezel) and rises over it only once it has slid clear. Tablet: the
    // deck order, with the leaving slide sinking under the floor.
    const zOf = (o: number) => {
      if (wideMQ.matches) return Math.abs(o) < 1 ? 2 : 4;
      if (o < 0) return 4;
      if (o < 1) return 6;
      return o < 2 ? 3 : 2;
    };

    const draw = (s: number) => {
      slides.forEach((el, i) => {
        const o = offsetOf(i, s);
        const x = o + 3; // 0..6 along SCRUB_SLOTS
        const k = Math.min(SCRUB_SLOTS.length - 2, Math.floor(x));
        const t = x - k;
        const a = slotStyles[k];
        const b = slotStyles[k + 1];
        anims[i].currentTime = (x / (SCRUB_SLOTS.length - 1)) * 1000;
        el.style.opacity = String(a.opacity + (b.opacity - a.opacity) * t);
        el.style.setProperty("--fade", String(a.fade + (b.fade - a.fade) * t));
        el.style.zIndex = String(zOf(o));
      });
    };

    const scrollPos = (range: { start: number; end: number }) => {
      const p = clamp01((window.scrollY - range.start) / (range.end - range.start));
      const x = p * N - 0.5;
      if (x <= 0) return 0;
      if (x >= N - 1) return N - 1;
      const k = Math.floor(x);
      return k + clamp01((x - k - HOLD) / (1 - 2 * HOLD));
    };

    // When keys or the scrollbar leave the page resting between two slides,
    // finish the move to the nearest one.
    let snapTimer: number | null = null;
    let touching = false;
    const scheduleSnap = () => {
      if (snapTimer !== null) clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        snapTimer = null;
        const range = getRange();
        if (!range || seekingRef.current || touching) return;
        if (window.scrollY < range.start - 1 || window.scrollY > range.end + 1) return;
        const s = scrollPos(range);
        const frac = s - Math.floor(s);
        if (frac > 0.002 && frac < 0.998) goTo(Math.round(s));
      }, 180);
    };

    const tick = () => {
      if (!pinnedRef.current) return;
      if (dirty) build();
      const range = getRange();
      if (!range) return;
      const y = window.scrollY;
      if (y !== lastY) {
        lastY = y;
        const p = clamp01((y - range.start) / (range.end - range.start));
        // Scrollbar drags and the like move the page without a seek.
        if (!seekingRef.current) headingRef.current = Math.min(N - 1, Math.floor(p * N));
        scheduleSnap();
      }
      const raw = scrollPos(range);
      const s = reducedMQ.matches ? Math.round(raw) : raw;
      if (s === lastS) return;
      lastS = s;
      draw(s);
      const shown = Math.round(s);
      if (shown !== shownRef.current) {
        shownRef.current = shown;
        setActive(shown);
        setPlaying(false);
      }
    };

    const setPinTop = () =>
      wrap.style.setProperty("--pin-top", `${Math.min(0, window.innerHeight - section.offsetHeight)}px`);

    const measure = () => {
      track.style.setProperty("--k", String(laptop.getBoundingClientRect().width / LAPTOP.width));
      setPinTop();
      // Extra height is the scroll the pin holds the section for.
      wrap.style.height = `${section.offsetHeight + N * window.innerHeight * SCROLL_PER_SLIDE}px`;
      dirty = true;
      lastY = NaN;
    };

    // The wrapper's new height moves every section below it, so let the other
    // ScrollTriggers (reveals further down) re-measure too.
    let frame = 0;
    const remeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        measure();
        ScrollTrigger.refresh();
      });
    };
    const observer = new ResizeObserver(remeasure);
    observer.observe(section);
    observer.observe(laptop);

    // Mobile browsers resize the viewport's height as the address bar shows
    // and hides mid-scroll; resizing the wrapper then would shift the page
    // under the finger. A height-only change just keeps a section taller than
    // the viewport pinned by its bottom edge.
    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastWidth) {
        setPinTop();
        return;
      }
      lastWidth = window.innerWidth;
      remeasure();
    };
    window.addEventListener("resize", onResize);
    wideMQ.addEventListener("change", remeasure);

    // A finger on the screen holds off the snap and stops a glide that's
    // still under way, so the two don't fight.
    const onTouchStart = () => {
      touching = true;
      if (!seekingRef.current) return;
      seekingRef.current = false;
      if (seekTimer.current !== null) clearTimeout(seekTimer.current);
      getLenis()?.scrollTo(window.scrollY, { immediate: true, force: true });
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length) return;
      touching = false;
      if (pinnedRef.current) scheduleSnap();
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    pinnedRef.current = true;
    wrap.classList.add("wwo-pin--active");
    // Every frame on the shared ticker, right after Lenis moves the scroll.
    const offFrame = onFrame(tick);
    measure();

    return () => {
      cancelAnimationFrame(frame);
      if (snapTimer !== null) clearTimeout(snapTimer);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      wideMQ.removeEventListener("change", remeasure);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      offFrame();
      clear();
      pinnedRef.current = false;
      wrap.classList.remove("wwo-pin--active");
      wrap.style.height = "";
    };
  }, [getRange, goTo]);

  // ---- Wheel: one gesture = one slide ----
  // Inside the pin the wheel never scrolls by its own amount: each gesture
  // moves exactly one slide, and the rest of it (a trackpad's momentum tail
  // included) is swallowed. A new gesture counts as soon as the wheel has
  // been quiet briefly, or a trackpad push rises out of the previous tail,
  // even while the last move is still playing: the scroll target simply moves
  // on and the slides follow the scroll. A gesture that would carry the page
  // into the pin from above or below stops on the first/last slide instead of
  // skipping through. Past the last slide (or before the first) the page
  // scrolls on as usual. Runs in the capture phase on document, ahead of
  // Lenis's window listener.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const WHEEL_QUIET = 200;
    let wheelLock = false;
    let lastWheel = 0;
    let lastMag = 0;
    let lastStep = 0;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.defaultPrevented) return;
      const range = getRange();
      if (!range) return;
      const now = performance.now();
      const mag = Math.abs(e.deltaY);
      const rising = mag >= 20 && mag > lastMag * 1.5;
      lastMag = mag;
      const swallow = () => {
        e.preventDefault();
        e.stopPropagation();
        lastWheel = now;
      };
      if (wheelLock) {
        // A lock must never outlive the section being on screen.
        const r = section.getBoundingClientRect();
        const offScreen = r.bottom < 0 || r.top > window.innerHeight;
        const fresh = now - lastWheel > WHEEL_QUIET || (rising && now - lastStep > 250);
        if (offScreen || fresh) wheelLock = false;
        else {
          // Swallow the rest of the gesture wherever the page is: a fast
          // gesture entering the pin would otherwise reach Lenis, cancel the
          // glide and carry the page past the section.
          swallow();
          return;
        }
      }
      if (!e.deltaY) return;
      // Where the page is heading, counting Lenis's pending inertia.
      const from = getLenis()?.targetScroll ?? window.scrollY;
      const inside = from >= range.start - 1 && from <= range.end + 1;
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) {
        // A sideways-leaning swipe would otherwise nudge the page a few
        // pixels inside the pin without changing slide.
        if (inside) swallow();
        return;
      }
      const dir = e.deltaY > 0 ? 1 : -1;
      const to = from + e.deltaY;
      let slide: number | null = null;
      if (from < range.start - 1) {
        if (to >= range.start) slide = 0;
      } else if (from > range.end + 1) {
        if (to <= range.end) slide = N - 1;
      } else {
        // From the slide the page is heading to, so quick gestures add up.
        const next = headingRef.current + dir;
        if (next >= 0 && next < N) slide = next;
      }
      if (slide === null) return;
      swallow();
      wheelLock = true;
      lastStep = now;
      goTo(slide);
    };

    document.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => {
      document.removeEventListener("wheel", onWheel, { capture: true });
      if (seekTimer.current !== null) clearTimeout(seekTimer.current);
    };
  }, [getRange, goTo]);
  // Steps count from where the page is heading, so each click queues exactly
  // one more slide.
  const step = (dir: -1 | 1) => goTo(headingRef.current + dir);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  };

  // Horizontal swipe on touch / pen. Mouse users have the buttons.
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") swipeX.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (swipeX.current === null) return;
    const dx = e.clientX - swipeX.current;
    swipeX.current = null;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  };

  return (
    <div ref={pinRef} className="wwo-pin" data-cube-scope>
    <section
      ref={sectionRef}
      className={`wwo ${openSans.variable}`}
      aria-labelledby="wwo-title"
      aria-roledescription="carousel"
    >
      <div className="wwo__stage">
        <span className="wwo__gl wwo__gl--1" aria-hidden="true" />
        <span className="wwo__gl wwo__gl--2" aria-hidden="true" />
        <span className="wwo__gl wwo__gl--3" aria-hidden="true" />
        <span className="wwo__gl wwo__gl--4" aria-hidden="true" />
        <div className="wwo__floor" aria-hidden="true" />

        {CUBES.map(({ src, depth }, i) => (
          <Image
            key={src}
            src={src}
            width={200}
            height={200}
            alt=""
            aria-hidden="true"
            className={`wwo__cube wwo__cube--${i + 1}`}
            data-cube={depth}
          />
        ))}

        <Eyebrow className="wwo__eyebrow" boxClassName="wwo__box">
          Where Learning Meets Growth
        </Eyebrow>
        <RevealTitle className="wwo__title" id="wwo-title">
          What we
          <br />
          offer
        </RevealTitle>

        <div
          ref={trackRef}
          className="wwo__track"
          id="wwo-track"
          tabIndex={0}
          aria-label="What we offer slides"
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (swipeX.current = null)}
        >
          {/* The scene lives in the track so the screen slot can be placed relative to it.
              Laptop and boy are separate layers so slides can stack between them. */}
          <Image
            src={LAPTOP.src}
            width={LAPTOP.width}
            height={LAPTOP.height}
            sizes={SCENE_SIZES}
            alt=""
            className="wwo__laptop"
          />
          <Image
            src={BOY.src}
            width={BOY.width}
            height={BOY.height}
            sizes={SCENE_SIZES}
            alt="A child watching an interactive live class on a laptop"
            className="wwo__boy"
          />

          {SLIDES.map((slide, i) => {
            const slot = slotOf(i, active);
            const isActive = slot === "0";
            const isPeek = !isActive && !slot.startsWith("out");
            const isPlaying = isActive && playing && slide.kind === "youtube";
            const label = `${i + 1} of ${N}: ${slide.title}`;

            return (
              <div
                key={i}
                className="wwo__slide"
                data-slot={slot}
                role="group"
                aria-roledescription="slide"
                aria-label={label}
                aria-hidden={!isActive}
                inert={!isActive && !isPeek}
              >
                <div className="wwo__clip">
                  {isPlaying ? (
                    <iframe
                      src={ytEmbed(slide.videoId)}
                      title={slide.title}
                      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  ) : (
                    <Image
                      src={slide.kind === "image" ? slide.src : slide.poster ?? ytThumb(slide.videoId)}
                      fill
                      sizes="(min-width: 1200px) 25vw, 60vw"
                      alt={isActive ? slide.title : ""}
                      className={slide.kind === "youtube" && !slide.poster ? "wwo__yt-thumb" : undefined}
                    />
                  )}

                  {isActive && !isPlaying && <p className="wwo__caption">{slide.title}</p>}

                  {isActive && slide.kind === "youtube" && !isPlaying && (
                    <button
                      type="button"
                      className="wwo__play"
                      aria-label={`Play video: ${slide.title}`}
                      onClick={() => setPlaying(true)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5.5v13l11-6.5z" />
                      </svg>
                    </button>
                  )}

                  {isPeek && (
                    <button
                      type="button"
                      className="wwo__peek"
                      tabIndex={-1}
                      aria-label={`Go to slide ${label}`}
                      onClick={() => goTo(i)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="wwo__sr" aria-live="polite">
          Slide {active + 1} of {N}: {SLIDES[active].title}
        </p>

        <div className="wwo__nav">
          <button type="button" className="wwo__prev" aria-label="Previous slide" aria-controls="wwo-track" disabled={active === 0} onClick={() => step(-1)}>
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <polyline points="22,4 8,16 22,28" />
            </svg>
          </button>
          <button type="button" className="wwo__next" aria-label="Next slide" aria-controls="wwo-track" disabled={active === N - 1} onClick={() => step(1)}>
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <polyline points="10,4 24,16 10,28" />
            </svg>
          </button>
        </div>
      </div>
    </section>
    </div>
  );
}
