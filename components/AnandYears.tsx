"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Crown + championship years. Each row slides up out of its own clipping mask
// once the list scrolls into view, staggered from the bottom row up to the crown.
export default function AnandYears({ years, crownSrc }: { years: string[]; crownSrc: string }) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from(".anand__years-reveal", {
        yPercent: 110,
        duration: 0.9,
        ease: "power4.out",
        stagger: { each: 0.1, from: "end" },
        scrollTrigger: { trigger: list, start: "top 80%", once: true },
      });
    }, list);

    return () => ctx.revert();
  }, []);

  return (
    <ul ref={listRef} className="anand__years" aria-label="World Championship titles">
      <li className="anand__crown" aria-hidden="true">
        <span className="anand__years-reveal">
          <Image src={crownSrc} width={48} height={36} alt="" />
        </span>
      </li>
      {years.map((year) => (
        <li key={year}>
          <span className="anand__years-reveal">{year}</span>
        </li>
      ))}
    </ul>
  );
}
