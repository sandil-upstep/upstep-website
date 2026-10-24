"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GapHead, GapLines, useReveal } from "./GapParts";
import { VIDEOS, ytEmbed, ytThumb } from "./gapData";
import "./gapPreview.scss";

// "Inside a session": a slider of GM classes with arrows, swipe and a strip
// of thumbnails under it. A slide's still shows until it's played, as in What
// We Offer; moving to another slide stops the one playing. Two slides either
// side of the active one peek out from behind it, smaller and fainter;
// clicking one brings it to the centre.
const SIDE_SLIDES = 2;

// Where slide i sits relative to the active one, wrapping around so the
// first and last videos are neighbours: 0 is centre, -1 just left, and so on.
function slideOffset(i: number, active: number, count: number) {
  let d = (i - active + count) % count;
  if (d > count / 2) d -= count;
  return d;
}

export default function GapPreview() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const ref = useReveal<HTMLElement>();
  const thumbsRef = useRef<HTMLOListElement>(null);
  const swipeX = useRef<number | null>(null);
  const count = VIDEOS.length;

  const go = (i: number) => {
    setActive((i + count) % count);
    setPlaying(false);
  };

  // Keep the active thumbnail in view, scrolling only the strip, not the page.
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const left = thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2;
    strip.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  return (
    <section ref={ref} id="preview" className="gap-section gap-preview" aria-labelledby="gap-preview-title">
      <GapLines />
      <div className="gap-inner">
        <GapHead
          eyebrow="Inside a session"
          id="gap-preview-title"
          title={
            <>
              See how
              <br />
              Grandmasters teach
            </>
          }
        />

        <div
          className="gap-preview__body"
          data-reveal
          role="region"
          aria-roledescription="carousel"
          aria-label="Session videos"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") go(active - 1);
            if (e.key === "ArrowRight") go(active + 1);
          }}
        >
          <div
            className="gap-preview__stage"
            onPointerDown={(e) => {
              if (e.pointerType !== "mouse") swipeX.current = e.clientX;
            }}
            onPointerUp={(e) => {
              if (swipeX.current === null) return;
              const dx = e.clientX - swipeX.current;
              swipeX.current = null;
              if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
            }}
            onPointerCancel={() => (swipeX.current = null)}
          >
            <div className="gap-preview__track">
              {VIDEOS.map((v, i) => {
                const offset = slideOffset(i, active, count);
                const isActive = offset === 0;
                const isSide = !isActive && Math.abs(offset) <= SIDE_SLIDES;
                return (
                  <div
                    key={v.title}
                    className="gap-preview__slide"
                    // Slides further out than the side ones park just beyond them, hidden.
                    data-offset={Math.max(-SIDE_SLIDES - 1, Math.min(SIDE_SLIDES + 1, offset))}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${i + 1} of ${count}`}
                    aria-hidden={!isActive}
                    inert={!isActive && !isSide}
                  >
                    {playing && isActive ? (
                      <iframe
                        src={ytEmbed(v.videoId)}
                        title={v.title}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
                    ) : (
                      <button
                        type="button"
                        className="gap-preview__poster"
                        aria-label={`Play video: ${v.title}`}
                        tabIndex={isActive ? undefined : -1}
                        onClick={() => (isActive ? setPlaying(true) : go(i))}
                      >
                        <Image src={ytThumb(v.videoId)} alt="" fill sizes="(max-width: 767px) 80vw, 60vw" />
                        <span className="gap-preview__play" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M8 5.5v13l11-6.5z" />
                          </svg>
                        </span>
                        <span className="gap-preview__caption">{v.title}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {!playing && (
              <>
                <button
                  type="button"
                  className="gap-preview__arrow gap-preview__arrow--prev"
                  aria-label="Previous video"
                  onClick={() => go(active - 1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 5l-7 7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="gap-preview__arrow gap-preview__arrow--next"
                  aria-label="Next video"
                  onClick={() => go(active + 1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <span className="gap-preview__count" aria-hidden="true">
                  {active + 1} / {count}
                </span>
              </>
            )}
          </div>

          <ol className="gap-preview__thumbs" ref={thumbsRef} aria-label="Choose a video" data-lenis-prevent>
            {VIDEOS.map((v, i) => (
              <li key={v.title}>
                <button
                  type="button"
                  className="gap-preview__thumb"
                  aria-pressed={i === active}
                  aria-label={`${i + 1}. ${v.title}`}
                  onClick={() => go(i)}
                >
                  <span className="gap-preview__thumb-img">
                    <Image src={ytThumb(v.videoId)} alt="" fill sizes="200px" />
                    <span className="gap-preview__num" aria-hidden="true">
                      {i + 1}
                    </span>
                  </span>
                  <span className="gap-preview__thumb-title">{v.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
