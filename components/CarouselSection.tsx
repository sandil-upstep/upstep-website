"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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

// One set of cards must be wider than the screen so the loop never shows a
// gap; short lists are repeated until there are enough cards.
const MIN_SET = 4;
const SET = Array.from({ length: Math.ceil(MIN_SET / VIDEOS.length) * VIDEOS.length }, (_, i) => ({
  ...VIDEOS[i % VIDEOS.length],
  num: (i % VIDEOS.length) + 1,
}));

// Two copies back to back: the track slides left by one copy, then loops.
const SLIDES = [...SET, ...SET].map((slide, i) => ({ ...slide, id: `slide-${i}`, copy: i >= SET.length }));

// Marquee speed: seconds for one card to travel its own width.
const SECONDS_PER_CARD = 6;

export default function CarouselSection() {
  const [inView, setInView] = useState(false);
  // The one card playing with sound, if any. It holds the marquee still.
  const [unmuted, setUnmuted] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  // Only run while the section is on screen; leaving it mutes again.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (!entry.isIntersecting) setUnmuted(null);
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Each card plays (muted, so browsers allow it) only while it's visible.
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        const v = target as HTMLVideoElement;
        if (isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    });
    videos.current.forEach((v) => v && io.observe(v));
    return () => io.disconnect();
  }, []);

  // React doesn't reliably reflect `muted` after the first render, so set the
  // property directly.
  useEffect(() => {
    videos.current.forEach((v, i) => v && (v.muted = SLIDES[i].id !== unmuted));
  }, [unmuted]);

  const toggleSound = (i: number) => {
    const id = SLIDES[i].id;
    setUnmuted((u) => (u === id ? null : id));
    videos.current[i]?.play().catch(() => {});
  };

  const paused = !inView || unmuted !== null;

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

        <div className="carousel__stage" role="region" aria-label="Video testimonials">
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

          <div className="carousel__viewport">
            <div
              className={`carousel__track${paused ? " is-paused" : ""}`}
              style={{ "--duration": `${SET.length * SECONDS_PER_CARD}s` } as CSSProperties}
            >
              {SLIDES.map((slide, i) => {
                const isUnmuted = unmuted === slide.id;
                return (
                  <article
                    key={slide.id}
                    className="carousel__card"
                    aria-label={`${slide.name}, ${slide.num} of ${VIDEOS.length}`}
                    // The second copy only fills the loop; keep it out of the a11y tree.
                    aria-hidden={slide.copy || undefined}
                  >
                    <video
                      ref={(el) => {
                        videos.current[i] = el;
                      }}
                      className="carousel__video"
                      src={encodeURI(slide.src)}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />

                    <div className="carousel__controls">
                      <button
                        type="button"
                        className="carousel__control"
                        tabIndex={slide.copy ? -1 : undefined}
                        aria-label={isUnmuted ? `Mute ${slide.name}` : `Unmute ${slide.name}`}
                        aria-pressed={isUnmuted}
                        onClick={() => toggleSound(i)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
                          {isUnmuted ? (
                            <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
                          ) : (
                            <path d="M16 9.5l5 5M21 9.5l-5 5" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
