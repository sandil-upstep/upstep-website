"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import RevealTitle from "./RevealTitle";
import "./carouselSection.scss";

type Slide = {
  id: string;
  label: string;
};

// TODO: replace with the real slide content once the design for the card
// interiors lands — the design only shows empty blue panels.
const SLIDES: Slide[] = Array.from({ length: 6 }, (_, i) => ({
  id: `slide-${i}`,
  label: `Slide ${i + 1}`,
}));

// Swipe distance (px) needed to change slide on touch / drag.
const SWIPE_THRESHOLD = 40;

// Time (ms) each slide stays up before autoplay advances.
const AUTOPLAY_DELAY = 4000;

// Signed distance from the active slide, wrapped so the carousel loops:
// with 6 slides the offsets run -3..2, and only -1/0/1 are on screen.
function offsetOf(index: number, active: number, count: number) {
  let off = (index - active) % count;
  if (off < -Math.floor(count / 2)) off += count;
  if (off >= Math.ceil(count / 2)) off -= count;
  return off;
}

export default function CarouselSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragStart = useRef<number | null>(null);
  const count = SLIDES.length;

  const go = (dir: 1 | -1) => setActive((a) => (a + dir + count) % count);

  // Autoplay. Keyed on `active` so any manual navigation restarts the full
  // delay; paused while hovered / focused and skipped for reduced motion.
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % count), AUTOPLAY_DELAY);
    return () => window.clearTimeout(id);
  }, [active, paused, count]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
  };

  const onPointerDown = (e: PointerEvent) => {
    dragStart.current = e.clientX;
  };

  const onPointerUp = (e: PointerEvent) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
  };

  return (
    <section className="carousel" aria-labelledby="carousel-title">
      <div className="carousel__lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="carousel__inner">
        <RevealTitle className="carousel__title" id="carousel-title">
          Title goes here
        </RevealTitle>

        <div
          className="carousel__stage"
          role="region"
          aria-roledescription="carousel"
          aria-label="Highlights"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (dragStart.current = null)}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          // Only keyboard focus pauses — a click/tap also focuses the stage,
          // and that shouldn't stop autoplay until the user clicks elsewhere.
          onFocus={(e) => e.currentTarget.matches(":focus-visible") && setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <Image
            src="/images/cubes/cube-21.png"
            alt=""
            width={200}
            height={200}
            className="carousel__cube carousel__cube--right"
            aria-hidden="true"
          />
          <Image
            src="/images/cubes/cube-4.png"
            alt=""
            width={200}
            height={200}
            className="carousel__cube carousel__cube--left"
            aria-hidden="true"
          />

          {SLIDES.map((slide, i) => {
            const off = offsetOf(i, active, count);
            const visible = Math.abs(off) <= 1;
            return (
              <article
                key={slide.id}
                className={`carousel__card${off === 0 ? " is-active" : ""}`}
                style={{ "--off": off, "--side": Math.sign(off), "--dist": Math.min(Math.abs(off), 2) } as CSSProperties}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={!visible}
                onClick={() => off !== 0 && visible && go(off as 1 | -1)}
              >
                <span className="carousel__card-label">{slide.label}</span>
              </article>
            );
          })}
        </div>

        <div className="carousel__nav">
          <button type="button" className="carousel__arrow carousel__arrow--prev" aria-label="Previous slide" onClick={() => go(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" className="carousel__arrow carousel__arrow--next" aria-label="Next slide" onClick={() => go(1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
