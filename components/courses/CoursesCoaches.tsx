"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReveal } from "../gap/GapParts";
import { Arrow, CoursesHead, CoursesLines, Cube } from "./CoursesParts";
import { COACH_PHOTOS, QUOTES, STATS } from "./coursesPageData";
import "./coursesCoaches.scss";

gsap.registerPlugin(ScrollTrigger);

// The collage has four frames; with more coaches than that, one frame at a
// time wipes in the next coach not on show, in this order of frames.
const FRAMES = 4;
const SWAP_ORDER = [1, 3, 0, 2];
const SWAP_EVERY = 3000;

// "Meet our coaches": stats that count up, a parent review slider, and a
// collage of coach photos that wipe in, drift at their own speeds and take
// turns swapping to other coaches while the collage is on screen.
export default function CoursesCoaches() {
  const ref = useReveal<HTMLElement>();
  const [quote, setQuote] = useState(0);
  const step = (d: number) => setQuote((q) => (q + d + QUOTES.length) % QUOTES.length);
  const collageRef = useRef<HTMLDivElement>(null);
  // Each frame's coach, and the one it replaced, left underneath the wipe.
  const [frames, setFrames] = useState(() => Array.from({ length: FRAMES }, (_, i) => ({ cur: i, prev: -1 })));

  useEffect(() => {
    const collage = collageRef.current;
    const count = COACH_PHOTOS.length;
    if (!collage || count <= FRAMES || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const shown = Array.from({ length: FRAMES }, (_, i) => i);
    let next = FRAMES;
    let turn = 0;
    let timer: number | undefined;
    const swap = () => {
      const frame = SWAP_ORDER[turn++ % FRAMES];
      while (shown.includes(next % count)) next++;
      const prev = shown[frame];
      const cur = next++ % count;
      shown[frame] = cur;
      setFrames((f) => f.map((v, i) => (i === frame ? { cur, prev } : v)));
    };
    const io = new IntersectionObserver(([entry]) => {
      window.clearInterval(timer);
      timer = entry.isIntersecting ? window.setInterval(swap, SWAP_EVERY) : undefined;
    });
    io.observe(collage);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-count]", root).forEach((el) => {
        const end = Number(el.dataset.count);
        const suffix = el.dataset.suffix ?? "";
        const o = { v: 0 };
        gsap.to(o, {
          v: end,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(o.v) + suffix;
          },
        });
      });

      const photos = gsap.utils.toArray<HTMLElement>(".courses-coach", root);
      const trigger = { trigger: ".courses-coaches__collage", start: "top 75%", once: true };
      gsap.from(photos, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.1, ease: "power4.out", stagger: 0.14, scrollTrigger: trigger });
      gsap.from(
        photos.map((p) => p.querySelector("img")),
        { scale: 1.25, duration: 1.4, ease: "power3.out", stagger: 0.14, scrollTrigger: trigger },
      );
      gsap.matchMedia().add("(min-width: 900px)", () => {
        [-40, 50, -20, 30].forEach((y, i) =>
          gsap.to(photos[i], {
            y,
            ease: "none",
            scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
          }),
        );
      });
    }, root);
    return () => ctx.revert();
  }, [ref]);

  return (
    <section ref={ref} className="courses-coaches courses-section" aria-labelledby="courses-coaches-title">
      <CoursesLines dark />
      <div className="courses-inner courses-coaches__grid">
        <div>
          <CoursesHead dark eyebrow="Some title goes here" title={<>Meet our<br />coaches</>} id="courses-coaches-title" />
          <p className="courses-coaches__lead" data-reveal>
            Lorem ipsum dolor sit amet nous sommes deja gour. Lorem ipsum dolor sit amet nous sommes deja gour. Lorem
            ipsum dolor sit amet nous sommes deja gour.
          </p>

          <ul className="courses-stats" data-reveal-group>
            {STATS.map((s) => (
              <li key={s.label} className="courses-stat">
                <Image src={s.icon} alt="" width={96} height={96} className="courses-stat__icon" aria-hidden="true" />
                <b data-count={s.value} data-suffix={s.suffix}>
                  {s.value}
                  {s.suffix}
                </b>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>

          <figure className="courses-quote" aria-roledescription="carousel" aria-label="Parent reviews" data-reveal>
            <div className="courses-quote__slides" aria-live="polite">
              {QUOTES.map((q, i) => (
                <blockquote key={q.name} className={`courses-quote__slide${i === quote ? " is-active" : ""}`} aria-hidden={i !== quote}>
                  <p>{q.text}</p>
                  <footer className="courses-quote__meta">
                    <span>{q.name}</span>
                    <span className="courses-quote__stars" role="img" aria-label="5 out of 5 stars">
                      ★★★★★
                    </span>
                  </footer>
                </blockquote>
              ))}
            </div>
            <div className="courses-quote__nav">
              <button type="button" className="courses-round-btn" aria-label="Previous review" onClick={() => step(-1)}>
                <Arrow dir="prev" />
              </button>
              <button type="button" className="courses-round-btn" aria-label="Next review" onClick={() => step(1)}>
                <Arrow dir="next" />
              </button>
            </div>
          </figure>
        </div>

        <div ref={collageRef} className="courses-coaches__collage">
          {frames.map(({ cur, prev }, i) => {
            const p = COACH_PHOTOS[cur];
            const old = COACH_PHOTOS[prev];
            // Keyed by coach, so the outgoing photo stays mounted underneath.
            return (
              <figure key={i} className={`courses-coach courses-coach--p${i + 1}${p.light ? " courses-coach--light" : ""}`}>
                {old && (
                  <Image key={prev} src={old.src} alt="" width={old.width} height={old.height} sizes="(min-width: 900px) 18vw, 45vw" />
                )}
                <Image
                  key={cur}
                  src={p.src}
                  alt="Chess coach"
                  width={p.width}
                  height={p.height}
                  sizes="(min-width: 900px) 18vw, 45vw"
                  className={old ? "is-entering" : undefined}
                />
                {p.caption && <figcaption key={`caption-${cur}`}>{p.caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      </div>
      <Cube className="courses-coaches__cube courses-coaches__cube--a" depth={0.6} />
      <Cube className="courses-coaches__cube courses-coaches__cube--b" depth={0.4} />
      <Cube className="courses-coaches__cube courses-coaches__cube--c" depth={0.5} n={21} />
    </section>
  );
}
