"use client";

import { useLayoutEffect, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReveal } from "../gap/GapParts";
import { Arrow, CoursesHead, CoursesLines, Cube } from "./CoursesParts";
import { COACH_PHOTOS, QUOTES, STATS } from "./coursesPageData";
import "./coursesCoaches.scss";

gsap.registerPlugin(ScrollTrigger);

// "Meet our coaches": stats that count up, a parent review slider, and a
// collage of coach photos that wipe in and drift at their own speeds.
export default function CoursesCoaches() {
  const ref = useReveal<HTMLElement>();
  const [quote, setQuote] = useState(0);
  const step = (d: number) => setQuote((q) => (q + d + QUOTES.length) % QUOTES.length);

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

        <div className="courses-coaches__collage">
          {COACH_PHOTOS.map((p, i) => (
            <figure key={i} className={`courses-coach courses-coach--p${i + 1}${p.light ? " courses-coach--light" : ""}`}>
              <Image src={p.src} alt="Chess coach" width={p.width} height={p.height} sizes="(min-width: 900px) 18vw, 45vw" />
              {p.caption && <figcaption>{p.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
      <Cube className="courses-coaches__cube courses-coaches__cube--a" depth={0.6} />
      <Cube className="courses-coaches__cube courses-coaches__cube--b" depth={0.4} />
      <Cube className="courses-coaches__cube courses-coaches__cube--c" depth={0.5} n={21} />
    </section>
  );
}
