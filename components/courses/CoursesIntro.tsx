"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReveal } from "../gap/GapParts";
import { CoursesHead, CoursesLines, Cube } from "./CoursesParts";
import { COMPARE_FOOTNOTE, COMPARE_ROWS, FORMATS } from "./coursesPageData";
import "./coursesIntro.scss";

gsap.registerPlugin(ScrollTrigger);

// The page's opening: "The Chess Coaching Levels" beside a big laptop, then the
// session format comparison. On desktop the laptop is stuck to the window's
// bottom-right across both sections and shrinks as the comparison scrolls up,
// ending beside the table. Phones show it once, under the hero copy.
export default function CoursesIntro() {
  const sceneRef = useReveal<HTMLDivElement>();
  const trackRef = useRef<HTMLDivElement>(null);
  const laptopRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scene = sceneRef.current;
    if (!scene || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".courses-hero__line > span", { yPercent: 110, duration: 1, ease: "power3.out", stagger: 0.12 });
      gsap.from([".courses-hero__intro", ".courses-hero__lead", ".courses-hero__mouse"], {
        y: 16,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.1,
        delay: 0.25,
      });

      gsap.matchMedia().add("(min-width: 900px)", () => {
        // The track ends at the table's foot, so the sticky stage lets go of
        // the laptop there and it scrolls away with its stand on the columns'
        // bottom edge, as in the design. Measured before each refresh.
        const track = trackRef.current!;
        const table = scene.querySelector<HTMLElement>(".courses-table")!;
        const fit = () => {
          track.style.bottom = `${scene.getBoundingClientRect().bottom - table.getBoundingClientRect().bottom}px`;
        };
        fit();
        ScrollTrigger.addEventListener("refreshInit", fit);

        gsap.from(laptopRef.current, { autoAlpha: 0, y: 40, duration: 1.1, ease: "power3.out", delay: 0.15 });
        gsap.to(".courses-hero__copy", {
          y: -120,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: { trigger: ".courses-hero", start: "top top", end: "60% top", scrub: true },
        });
        // Shrinks toward its bottom-right corner, where the sticky stage holds
        // it, to the design's 73% beside the table, sliding part way off the
        // window's right edge as it goes. Done as the table's foot reaches the
        // window's, where the stage lets go. The hero holds it 5vw further
        // left than here (coursesIntro.scss), hence 13vw rather than 8vw.
        gsap.to(laptopRef.current, {
          scale: 0.73,
          x: () => window.innerWidth * 0.13,
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: ".courses-hero",
            start: "top top",
            endTrigger: ".courses-table",
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        return () => {
          ScrollTrigger.removeEventListener("refreshInit", fit);
          track.style.bottom = "";
        };
      });

      // The table's rows sweep in, then its coloured columns rise behind them.
      gsap
        .timeline({ scrollTrigger: { trigger: ".courses-table", start: "top 75%", once: true } })
        .from(".courses-table__bar", { scaleX: 0, duration: 0.7, ease: "power3.out", stagger: 0.06 })
        .from(".courses-table__col", { y: 80, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.12 }, "-=0.6")
        .from(".courses-table__cell", { y: 10, autoAlpha: 0, duration: 0.4, ease: "power2.out", stagger: 0.012 }, "-=0.5");
    }, scene);
    return () => ctx.revert();
  }, [sceneRef]);

  const laptop = (
    <Image src="/images/courses/laptop.png" alt="" width={1147} height={757} priority sizes="(min-width: 900px) 60vw, 100vw" />
  );

  return (
    <div ref={sceneRef} className="courses-scene">
      <div ref={trackRef} className="courses-laptop-track" aria-hidden="true">
        <div className="courses-laptop-stage">
          <div ref={laptopRef} className="courses-laptop">
            {laptop}
          </div>
        </div>
      </div>

      <section className="courses-hero" aria-labelledby="courses-hero-title">
        <CoursesLines />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/courses/hero-curve.svg" alt="" aria-hidden="true" className="courses-hero__curve" />
        <div className="courses-inner">
          <div className="courses-hero__copy">
            <p className="courses-hero__intro">Introducing</p>
            <h1 className="courses-hero__title" id="courses-hero-title">
              <span className="courses-hero__line">
                <span>The Chess</span>
              </span>
              <span className="courses-hero__line">
                <span>Coaching Levels</span>
              </span>
            </h1>
            <p className="courses-hero__lead">
              Upstep Academy offers structured online chess coaching for kids aged 4 to 15 — from absolute beginners
              learning how the pieces move to advanced players training for FIDE-rated tournaments. Our 6-level chess
              training program is{" "}
              <strong>
                designed by certified coaches, International Masters (IMs), and Grand Masters (GMs) to build skills
                progressively.
              </strong>
            </p>
            <span className="courses-hero__mouse" aria-hidden="true" />
          </div>
          <div className="courses-hero__laptop" aria-hidden="true">
            {laptop}
          </div>
        </div>
        <Cube className="courses-hero__cube courses-hero__cube--a" depth={0.6} />
        <Cube className="courses-hero__cube courses-hero__cube--b" depth={0.4} />
      </section>

      <section className="courses-compare courses-section" aria-labelledby="courses-compare-title">
        <CoursesLines />
        <div className="courses-inner">
          <CoursesHead eyebrow="Choose a session format" title="Compare" id="courses-compare-title" />

          <div className="courses-table-scroll" tabIndex={0} aria-label="Session format comparison">
            {/* A grid, not a <table>: each format's colour runs down its whole
                column behind the rows' grey bars. The roles keep it a table to
                screen readers; the bars and columns are only paint. */}
            <div className="courses-table" role="table" aria-label="Session format comparison">
              {COMPARE_ROWS.map((row, r) => (
                <span key={row} className="courses-table__bar" style={{ gridRow: r + 2 }} aria-hidden="true" />
              ))}
              {FORMATS.map((f, c) => (
                <span
                  key={f.name}
                  className={`courses-table__col courses-table__col--${f.tone}`}
                  style={{ gridColumn: c + 2 }}
                  aria-hidden="true"
                />
              ))}

              <div className="courses-table__row" role="row">
                <span role="cell" style={{ gridArea: "1 / 1" }} />
                {FORMATS.map((f, c) => (
                  <span
                    key={f.name}
                    role="columnheader"
                    className="courses-table__cell courses-table__cell--head"
                    style={{ gridArea: `1 / ${c + 2}` }}
                  >
                    {f.name}
                  </span>
                ))}
              </div>
              {COMPARE_ROWS.map((row, r) => (
                <div key={row} className="courses-table__row" role="row">
                  <span role="rowheader" className="courses-table__cell courses-table__cell--label" style={{ gridArea: `${r + 2} / 1` }}>
                    {row}
                  </span>
                  {FORMATS.map((f, c) => (
                    <span key={f.name} role="cell" className="courses-table__cell" style={{ gridArea: `${r + 2} / ${c + 2}` }}>
                      {f.values[r]}
                    </span>
                  ))}
                </div>
              ))}
              <div className="courses-table__row" role="row">
                <span role="cell" style={{ gridArea: `${COMPARE_ROWS.length + 2} / 1` }} />
                {FORMATS.map((f, c) => (
                  <span
                    key={f.name}
                    role="cell"
                    className="courses-table__cell courses-table__cell--note"
                    style={{ gridArea: `${COMPARE_ROWS.length + 2} / ${c + 2}` }}
                  >
                    {f.note}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="courses-compare__footnote" data-reveal>
            {COMPARE_FOOTNOTE}
          </p>
        </div>
        <Cube className="courses-compare__cube" depth={0.5} />
      </section>
    </div>
  );
}
