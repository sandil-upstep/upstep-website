"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CoursesHead, CoursesLines } from "./CoursesParts";
import { COUNTRIES } from "./coursesPageData";
import "./coursesPresence.scss";

gsap.registerPlugin(ScrollTrigger);

// Two copies back to back: the strip slides left by one copy, then loops.
const LOOP = [...COUNTRIES, ...COUNTRIES];

// "Presence in": the countries we teach in, as a strip of flags that drifts
// left beside the Earth, which turns clockwise as the section scrolls by.
export default function CoursesPresence() {
  const globeRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.to(globeRef.current, {
      rotation: 20,
      ease: "none",
      scrollTrigger: { trigger: globeRef.current, start: "top bottom", end: "bottom top", scrub: 1 },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section className="courses-presence courses-section" aria-labelledby="courses-presence-title">
      <CoursesLines />
      <div className="courses-inner">
        <div className="courses-presence__head">
          <CoursesHead eyebrow="Global Footprint" title="Presence in" id="courses-presence-title" />
          <span className="courses-presence__globe" aria-hidden="true">
            <Image ref={globeRef} src="/images/earth-full.png" alt="" width={447} height={447} className="courses-presence__globe-img" />
          </span>
        </div>
        <ul className="sr-only">
          {COUNTRIES.map((c) => (
            <li key={c.code}>{c.label}</li>
          ))}
        </ul>
        <div className="courses-presence__marquee" aria-hidden="true">
          <div className="courses-presence__track">
            {LOOP.map((c, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={`https://flagcdn.com/${c.code}.svg`} alt="" className="courses-presence__flag" loading="lazy" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
