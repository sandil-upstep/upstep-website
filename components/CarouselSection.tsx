"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import RevealTitle from "./RevealTitle";
import "./carouselSection.scss";

type Video = {
  src: string;
  name: string;
};

// Everything in public/videos. Add new testimonials here.
const VIDEOS: Video[] = [
  { src: "/videos/Ishaan Agnihotri Testimonial (574x500).mp4", name: "Ishaan Agnihotri" },
  { src: "/videos/Terrance lee Testimonial (574x500).mp4", name: "Terrance Lee" },
  { src: "/videos/Nirvaan Shah Testimonial (574x500).mp4", name: "Nirvaan Shah" },
  { src: "/videos/Aaryamaan MOM_AUS New Edit (574x500).mp4", name: "Aaryamaan" },
];

// The strip shows the active card, one neighbour each side and a peek of the
// next pair, so it needs a hidden card beyond those to wrap round off screen.
// Short lists are repeated until there are enough cards.
const MIN_SLIDES = 7;
const SLIDES = Array.from({ length: Math.ceil(MIN_SLIDES / VIDEOS.length) * VIDEOS.length }, (_, i) => ({
  ...VIDEOS[i % VIDEOS.length],
  id: `slide-${i}`,
  num: (i % VIDEOS.length) + 1,
}));

// How long each slide stays in the centre before the carousel moves on.
const AUTOPLAY_MS = 5000;

// Swipe distance (px) needed to change slide on touch / drag.
const SWIPE_THRESHOLD = 40;

// Signed distance from the active slide, wrapped so the carousel loops:
// with 8 slides the offsets run -4..3, and only -2..2 are on screen.
function offsetOf(index: number, active: number, count: number) {
  let off = (index - active) % count;
  if (off < -Math.floor(count / 2)) off += count;
  if (off >= Math.ceil(count / 2)) off -= count;
  return off;
}

export default function CarouselSection() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const dragStart = useRef<number | null>(null);
  const prevActive = useRef(active);
  const count = SLIDES.length;

  const go = (steps: number) => setActive((a) => (((a + steps) % count) + count) % count);

  // How far every card moved on the last step. A card whose offset changed by
  // anything else wrapped round the loop and must jump, not slide across.
  const step = offsetOf(prevActive.current, active, count);
  useEffect(() => {
    prevActive.current = active;
  }, [active]);

  // Autoplay: the active video plays (muted, so browsers allow it) and the
  // carousel moves on every AUTOPLAY_MS, or sooner if the video ends. It holds
  // while hovered or unmuted, since someone is watching. Keyed on `active` so
  // a manual step restarts the countdown.
  useEffect(() => {
    if (!inView || !playing || !muted || hovered) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [active, inView, playing, muted, hovered, count]);

  // Only play while the section is on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Play the active video, pause the rest and rewind the ones that left the
  // centre so each starts from the top next time round.
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === active && inView && playing) {
        // An AbortError only means a pause or slide change cut this play()
        // short; give up on autoplay only if the browser actually blocked it.
        v.play().catch((err: DOMException) => err.name === "NotAllowedError" && setPlaying(false));
      } else {
        v.pause();
        if (i !== active) v.currentTime = 0;
      }
    });
  }, [active, inView, playing]);

  // React doesn't reliably reflect `muted` after the first render, so set the
  // property directly.
  useEffect(() => {
    videos.current.forEach((v) => v && (v.muted = muted));
  }, [muted]);

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
    <section ref={sectionRef} className="carousel" aria-labelledby="carousel-title">
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
          aria-label="Video testimonials"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (dragStart.current = null)}
          onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
          onPointerLeave={() => setHovered(false)}
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

          {/* Page-coloured arcs over the top and bottom edges: the row reads as
              the inside of a cylinder, with the middle cards cut shortest. */}
          {(["top", "bottom"] as const).map((edge) => (
            <svg
              key={edge}
              className={`carousel__wave carousel__wave--${edge}`}
              viewBox="0 0 804 50.167"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M804,0v16.671c0,0-204.974,33.496-401.995,33.496C204.974,50.167,0,16.671,0,16.671V0H804z" />
            </svg>
          ))}

          {SLIDES.map((slide, i) => {
            const off = offsetOf(i, active, count);
            const wrapped = off - offsetOf(i, prevActive.current, count) !== step;
            const visible = Math.abs(off) <= 2;
            const isActive = off === 0;
            return (
              <article
                key={slide.id}
                className={`carousel__card${isActive ? " is-active" : ""}`}
                style={{ "--off": off, transition: wrapped ? "none" : undefined } as CSSProperties}
                aria-roledescription="slide"
                aria-label={`${slide.name}, ${slide.num} of ${VIDEOS.length}`}
                aria-hidden={Math.abs(off) > 1}
                onClick={() => !isActive && visible && go(off)}
              >
                <video
                  ref={(el) => {
                    videos.current[i] = el;
                  }}
                  className="carousel__video"
                  src={encodeURI(slide.src)}
                  muted
                  playsInline
                  // Side cards only need their first frame; hidden ones nothing.
                  preload={isActive ? "auto" : visible ? "metadata" : "none"}
                  onEnded={() => isActive && go(1)}
                />

                {isActive && (
                  <div className="carousel__controls">
                    <button
                      type="button"
                      className="carousel__control"
                      aria-label={playing ? "Pause video" : "Play video"}
                      onClick={() => setPlaying((p) => !p)}
                    >
                      {playing ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <rect x="6" y="5" width="4" height="14" rx="1" />
                          <rect x="14" y="5" width="4" height="14" rx="1" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      className="carousel__control"
                      aria-label={muted ? "Unmute video" : "Mute video"}
                      onClick={() => setMuted((m) => !m)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
                        {muted ? (
                          <path d="M16 9.5l5 5M21 9.5l-5 5" />
                        ) : (
                          <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
                        )}
                      </svg>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="carousel__nav">
          <button type="button" className="carousel__arrow carousel__arrow--prev" aria-label="Previous video" onClick={() => go(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" className="carousel__arrow carousel__arrow--next" aria-label="Next video" onClick={() => go(1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
