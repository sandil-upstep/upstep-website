"use client";

import { useRef, useState } from "react";
import { useReveal } from "../gap/GapParts";
import { Arrow, CoursesLines } from "./CoursesParts";
import { SHOWCASE_CARDS } from "./coursesPageData";
import "./coursesShowcase.scss";

// "Title goes here": a coverflow of placeholder cards (the design's are blank)
// turning around the centre one. Arrows, a click on a side card or a swipe
// step through them, wrapping at either end.
export default function CoursesShowcase() {
  const ref = useReveal<HTMLElement>();
  const [current, setCurrent] = useState(1);
  const startX = useRef<number | null>(null);
  const n = SHOWCASE_CARDS.length;
  const step = (d: number) => setCurrent((c) => (c + d + n) % n);

  return (
    <section ref={ref} className="courses-showcase courses-section" aria-labelledby="courses-showcase-title">
      <CoursesLines />
      <div className="courses-inner">
        <h2 className="courses-showcase__title" id="courses-showcase-title">
          Title goes here
        </h2>
        <div
          className="courses-showcase__flow"
          aria-roledescription="carousel"
          aria-labelledby="courses-showcase-title"
          data-reveal
          onPointerDown={(e) => (startX.current = e.clientX)}
          onPointerUp={(e) => {
            if (startX.current === null) return;
            const dx = e.clientX - startX.current;
            startX.current = null;
            if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
          }}
        >
          {SHOWCASE_CARDS.map((card, i) => {
            // Offset from the current card, wrapped to the nearer side.
            let o = i - current;
            if (o > n / 2) o -= n;
            if (o < -n / 2) o += n;
            const a = Math.abs(o);
            return (
              <div
                key={card}
                className="courses-showcase__card"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}`}
                aria-hidden={a > 0}
                onClick={() => a > 0 && setCurrent(i)}
                style={{
                  transform: `translateX(${o * 108}%) translateZ(${-a * 120}px) rotateY(${-o * 22}deg)`,
                  opacity: a > 1.5 ? 0 : 1,
                  zIndex: 10 - a,
                  filter: a ? "saturate(.85)" : "none",
                }}
              >
                {card}
              </div>
            );
          })}
        </div>
        <div className="courses-showcase__nav">
          <button type="button" className="courses-round-btn" aria-label="Previous card" onClick={() => step(-1)}>
            <Arrow dir="prev" />
          </button>
          <button type="button" className="courses-round-btn courses-round-btn--next" aria-label="Next card" onClick={() => step(1)}>
            <Arrow dir="next" />
          </button>
        </div>
      </div>
    </section>
  );
}
