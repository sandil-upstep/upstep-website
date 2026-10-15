"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import { Open_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Eyebrow from "./Eyebrow";
import RevealTitle from "./RevealTitle";
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
  { kind: "youtube", videoId: "WhWc3b3KhnY", title: "Game analysis sessions" },
  { kind: "image", src: "/images/player.png", title: "Small batches, personal attention" },
  { kind: "youtube", videoId: "YE7VzlLtp-4", title: "Parent progress reports" },
  { kind: "image", src: "/images/certificate.png", title: "Level completion certificates" },
];

const N = SLIDES.length;

// Vertical scroll spent on each slide while the section is pinned, as a
// fraction of the viewport height.
const SCROLL_PER_SLIDE = 0.5;

// Time each slide change gets before the next one starts; matches the slide
// transition ($dur in whatWeOfferSection.scss).
const STEP_MS = 750;

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
  const swipeX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  // Scroll and clicks set the target; the shown slide walks to it one step
  // per STEP_MS, so a long scroll or rapid clicks never skip slides.
  const targetRef = useRef(0);
  const shownRef = useRef(0);
  const stepTimer = useRef<number | null>(null);

  const setTarget = useCallback((i: number) => {
    targetRef.current = i;
    const chase = () => {
      const target = targetRef.current;
      if (shownRef.current === target) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      shownRef.current = reduced ? target : shownRef.current + Math.sign(target - shownRef.current);
      setActive(shownRef.current);
      setPlaying(false);
      stepTimer.current = window.setTimeout(() => {
        stepTimer.current = null;
        chase();
      }, reduced ? 0 : STEP_MS);
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
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const fitsViewport = () => section.offsetHeight <= window.innerHeight;
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: () => (fitsViewport() ? "top top" : "bottom bottom"),
        end: () => `+=${N * window.innerHeight * SCROLL_PER_SLIDE}`,
        pin: true,
        // Transform pinning on touch-only devices (phones, tablets), fixed elsewhere.
        pinType: ScrollTrigger.isTouch === 1 ? "transform" : "fixed",
        // ScrollTrigger skips pin spacing when the parent is flex (the page
        // column is), which would let the next section scroll up over this one.
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const next = Math.min(N - 1, Math.floor(self.progress * N));
          if (next !== targetRef.current) setTarget(next);
        },
      });
      triggerRef.current = trigger;

      // Sections above (e.g. the Anand pin) change height after mount; re-measure
      // so the pin starts in the right place.
      let frame = 0;
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => ScrollTrigger.refresh());
      });
      observer.observe(document.body);

      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        trigger.kill();
        triggerRef.current = null;
      };
    });

    return () => mm.revert();
  }, [setTarget]);

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
  const goTo = (i: number) => {
    const index = Math.min(N - 1, Math.max(0, i));
    const trigger = triggerRef.current;
    if (!trigger) {
      setTarget(index);
      return;
    }
    // Aim for the middle of the slide's band so rounding can't land in a neighbour.
    const top = trigger.start + ((trigger.end - trigger.start) * (index + 0.5)) / N;
    window.scrollTo({ top: Math.round(top), behavior: "smooth" });
  };
  // Steps count from the target, so each click queues exactly one more slide.
  const step = (dir: -1 | 1) => goTo(targetRef.current + dir);

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
  );
}
