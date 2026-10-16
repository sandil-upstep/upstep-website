"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import { Open_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Eyebrow from "./Eyebrow";
import RevealTitle from "./RevealTitle";
import { getLenis, onScrollFrame } from "./SmoothScroll";
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
const CUBE_SRCS = ["/images/cubes/cube-4.png", "/images/cubes/cube-21.png"];

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

// Time each slide change gets before the next one starts; matches the slide
// transition ($dur in whatWeOfferSection.scss).
const STEP_MS = 750;

// Mobile has no scroll pin, so the slides advance on their own while the
// section is in view.
const AUTOPLAY_MS = 4000;

// Where a slide sits relative to the active one: "0" is the laptop screen,
// "-2".."3" are the faded cards around it, "out-l"/"out-r" wait off-stage.
// (Desktop shows -2..2, the mobile deck shows 1..3.)
function slotOf(index: number, active: number) {
  let o = (index - active + N) % N;
  if (o >= N - 3) o -= N;
  if (o < -2) return "out-l";
  return o <= 3 ? String(o) : "out-r";
}

const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const ytEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;

export default function WhatWeOfferSection() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const swipeX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  // Page scroll where the pin holds the section, while it's active.
  const rangeRef = useRef<{ start: number; end: number } | null>(null);
  // Scroll and clicks set the target; the shown slide walks to it one step
  // per STEP_MS, so a long scroll or rapid clicks never skip slides.
  const targetRef = useRef(0);
  const shownRef = useRef(0);
  const stepTimer = useRef<number | null>(null);
  // True while goTo's scroll to a slide's spot is still under way.
  const seekingRef = useRef(false);
  const seekTimer = useRef<number | null>(null);
  // The slide the page scroll is heading to; it runs ahead of the target
  // while goTo's scroll is still on its way to the slide's band.
  const headingRef = useRef(0);

  const setTarget = useCallback((i: number) => {
    targetRef.current = i;
    const chase = () => {
      const target = targetRef.current;
      if (shownRef.current === target) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      shownRef.current = reduced ? target : shownRef.current + Math.sign(target - shownRef.current);
      // Rapid scrolling: the more slides still waiting behind this step, the
      // faster it plays (up to ~2.8×), so the carousel keeps up with the page.
      // (The heading only tracks the scroll on desktop, where the pin runs.)
      const heading = rangeRef.current ? headingRef.current : target;
      const pending = Math.max(Math.abs(target - shownRef.current), Math.abs(heading - shownRef.current));
      const ms = Math.round(STEP_MS / (1 + Math.min(pending, 3) * 0.6));
      trackRef.current?.style.setProperty("--wwo-dur", `${ms}ms`);
      setActive(shownRef.current);
      setPlaying(false);
      stepTimer.current = window.setTimeout(() => {
        stepTimer.current = null;
        chase();
      }, reduced ? 0 : ms);
    };
    // A running chase picks up the new target on its next step.
    if (stepTimer.current === null) chase();
  }, []);

  useEffect(() => () => {
    if (stepTimer.current !== null) clearTimeout(stepTimer.current);
  }, []);

  // Pin the section and let window scroll pick the active slide. The pin is
  // split into N equal bands of SCROLL_PER_SLIDE viewports, one per slide, so
  // the last slide gets a full band on the laptop screen before the pin
  // releases. A section taller than the viewport pins by its bottom edge so
  // the whole carousel stays in view. Mobile skips the pin and is driven by
  // swipes and the arrows alone.
  // The pin is CSS `position: sticky` inside a taller wrapper (as in
  // AnandSliderPin), not a ScrollTrigger pin: switching a section this big
  // to `position: fixed` and back re-lays and repaints it on the very frame
  // it enters and leaves, which shows as a jolt. Sticky is held by the
  // browser's compositor, so there is no switch at all.
  useEffect(() => {
    const wrap = pinRef.current;
    const section = sectionRef.current;
    if (!wrap || !section) return;
    const desktop = window.matchMedia("(min-width: 768px)");

    let distance = 0;
    let stickTop = 0;

    const sync = () => {
      if (distance <= 0) return;
      const progress = Math.min(1, Math.max(0, (stickTop - wrap.getBoundingClientRect().top) / distance));
      const next = Math.min(N - 1, Math.floor(progress * N));
      // Scrollbar drags and the like move the page without a seek.
      if (!seekingRef.current) headingRef.current = next;
      if (next !== targetRef.current) setTarget(next);
    };

    const measure = () => {
      const active = desktop.matches;
      wrap.classList.toggle("wwo-pin--active", active);
      if (!active) {
        distance = 0;
        rangeRef.current = null;
        wrap.style.height = "";
        return;
      }
      distance = N * window.innerHeight * SCROLL_PER_SLIDE;
      stickTop = Math.min(0, window.innerHeight - section.offsetHeight);
      wrap.style.setProperty("--pin-top", `${stickTop}px`);
      // Extra height is the scroll the pin holds the section for.
      wrap.style.height = `${section.offsetHeight + distance}px`;
      const start = wrap.getBoundingClientRect().top + window.scrollY - stickTop;
      rangeRef.current = { start, end: start + distance };
      sync();
    };

    // The wrapper's new height moves every section below it, so let the other
    // ScrollTriggers (reveals further down) re-measure too. Sections above
    // (e.g. the Anand pin) also change height after mount, hence the body.
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
    observer.observe(document.body);
    window.addEventListener("resize", remeasure);
    desktop.addEventListener("change", remeasure);
    const offScroll = onScrollFrame(sync);
    measure();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", remeasure);
      desktop.removeEventListener("change", remeasure);
      offScroll();
      wrap.classList.remove("wwo-pin--active");
      wrap.style.height = "";
      rangeRef.current = null;
    };
  }, [setTarget]);

  // Autoplay on mobile (below the pin breakpoint) while the section is on
  // screen, unless the user prefers reduced motion.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const mobile = window.matchMedia("(max-width: 767.98px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const update = () => setAutoplay(inView && mobile.matches && !reduced.matches);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    }, { threshold: 0.4 });
    observer.observe(section);
    mobile.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      observer.disconnect();
      mobile.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  // Each slide change (auto or by the user) restarts the countdown; a playing
  // video holds it. After the last slide it wraps straight back to the first,
  // which the circular slots animate as a single step.
  useEffect(() => {
    if (!autoplay || playing) return;
    const timer = window.setTimeout(() => {
      if (shownRef.current < N - 1) {
        setTarget(shownRef.current + 1);
      } else {
        targetRef.current = shownRef.current = 0;
        setActive(0);
      }
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [autoplay, playing, active, setTarget]);

  // The screen's perspective matrix works in image pixels; expose the laptop's
  // rendered scale as --k (a plain number CSS can't derive from lengths).
  useEffect(() => {
    const track = trackRef.current;
    const laptop = track?.querySelector<HTMLElement>(".wwo__laptop");
    if (!track || !laptop) return;
    const observer = new ResizeObserver(() => {
      track.style.setProperty("--k", String(laptop.getBoundingClientRect().width / LAPTOP.width));
    });
    observer.observe(laptop);
    return () => observer.disconnect();
  }, []);

  // Buttons, keys, swipes and card clicks scroll the page to the slide's spot
  // inside the pin; the scroll handler then targets it.
  const goTo = useCallback((i: number) => {
    const index = Math.min(N - 1, Math.max(0, i));
    headingRef.current = index;
    const range = rangeRef.current;
    if (!range) {
      setTarget(index);
      return;
    }
    // Aim for the middle of the slide's band so rounding can't land in a neighbour.
    const top = Math.round(range.start + ((range.end - range.start) * (index + 0.5)) / N);
    // The timer also covers a Lenis scroll that's interrupted (e.g. by the
    // scrollbar) and never completes, so the wheel can't stay locked.
    seekingRef.current = true;
    if (seekTimer.current !== null) clearTimeout(seekTimer.current);
    seekTimer.current = window.setTimeout(() => (seekingRef.current = false), 1200);
    // Through Lenis when it's running: a native smooth scroll fights its
    // inertia, and the next wheel tick snaps back to where Lenis thought it was.
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(top, { duration: 0.9, force: true, onComplete: () => (seekingRef.current = false) });
    else window.scrollTo({ top, behavior: "smooth" });
  }, [setTarget]);

  // ---- Wheel: one gesture = one slide ----
  // Inside the pin the wheel never scrolls by its own amount: each gesture
  // moves exactly one slide, and the rest of it (a trackpad's momentum tail
  // included) is swallowed. A new gesture counts as soon as the wheel has
  // been quiet briefly, or a trackpad push rises out of the previous tail,
  // even while the last slide change is still playing: the steps queue up
  // and play faster (see setTarget), so rapid scrolling speeds the carousel
  // along instead of being ignored. A gesture that would carry the page into
  // the pin from above or below stops on the first/last slide instead of
  // skipping through. Past the last slide (or before the first) the page
  // scrolls on as usual. Runs in the capture phase on document, ahead of
  // Lenis's window listener. Desktop only: mobile has no pin.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const WHEEL_QUIET = 200;
    let wheelLock = false;
    let lastWheel = 0;
    let lastMag = 0;
    let lastStep = 0;

    const onWheel = (e: WheelEvent) => {
      const range = rangeRef.current;
      if (!range || e.ctrlKey || e.defaultPrevented) return;
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
          // snap and carry the page past the section.
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
  }, [goTo]);
  // Steps count from where the page is heading (desktop) or the target, so
  // each click queues exactly one more slide.
  const step = (dir: -1 | 1) => goTo((rangeRef.current ? headingRef.current : targetRef.current) + dir);

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
    <div ref={pinRef} className="wwo-pin">
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

        {CUBE_SRCS.map((src, i) => (
          <Image
            key={src}
            src={src}
            width={200}
            height={200}
            alt=""
            aria-hidden="true"
            className={`wwo__cube wwo__cube--${i + 1}`}
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
