"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { Arrow, Cta } from "../DemoBookingParts";
import { onPreloaderDone } from "../preloaderState";
import { useGap } from "./GapContext";
import { RATING_GAIN, TOTAL_HOURS } from "./gapData";
import "./gapHero.scss";

// The GAP page's opening: the promise, the way in, and GM Anand, on the navy
// of the home page's dark sections (the header turns dark over it).

const STATS = [
  { value: `${TOTAL_HOURS} hrs`, label: "training a year" },
  { value: "4", label: "classes with GM Anand" },
  { value: `${RATING_GAIN}+`, label: "FIDE points targeted*" },
];

const JUMPS = [
  { label: "Program", href: "#program" },
  { label: "Outcomes", href: "#outcome" },
  { label: "Schedule", href: "#schedule" },
  { label: "Fees", href: "#fees" },
];

export default function GapHero() {
  const { goToRegister } = useGap();
  const rootRef = useRef<HTMLElement>(null);

  // The copy rises in line by line once the preloader has stepped aside, with
  // GM Anand coming up behind it.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stop = () => {};
    const ctx = gsap.context(() => {
      const intro = gsap
        .timeline({ paused: true })
        .from("[data-hero-in]", { y: 28, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 })
        .from(".gap-hero__photo", { y: 40, autoAlpha: 0, duration: 1.2, ease: "power3.out" }, 0.1)
        .from(".gap-hero__badge", { x: 24, autoAlpha: 0, duration: 0.8, ease: "power3.out" }, 0.7);
      stop = onPreloaderDone(() => intro.play());
    }, root);
    return () => {
      stop();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={rootRef} className="gap-hero" data-nav-theme="dark" aria-labelledby="gap-hero-title">
      <div className="gap-hero__deco" aria-hidden="true">
        <span className="gap-hero__line" />
        <span className="gap-hero__line" />
        <span className="gap-hero__line" />
        <span className="gap-hero__line" />
        <span className="gap-hero__checker" />
        <span className="gap-hero__glow" />
      </div>
      <Image
        src="/images/cubes/cube-1.png"
        width={200}
        height={200}
        alt=""
        aria-hidden="true"
        className="gap-hero__cube gap-hero__cube--1"
        data-cube="0.5"
      />
      <Image
        src="/images/cubes/cube-14.png"
        width={200}
        height={200}
        alt=""
        aria-hidden="true"
        className="gap-hero__cube gap-hero__cube--2"
        data-cube="0.85"
      />

      <div className="gap-hero__inner">
        <div className="gap-hero__copy">
          <p className="gap-hero__tags" data-hero-in>
            <span className="gap-hero__tag gap-hero__tag--hot">Limited seats</span>
            <span className="gap-hero__tag">Grandmaster Accelerator Program</span>
          </p>
          <h1 id="gap-hero-title" className="gap-hero__title" data-hero-in>
            Train with Grandmasters. <span className="gap-hero__gold">Play like a contender.</span>
          </h1>
          <p className="gap-hero__lead" data-hero-in>
            A year of live, GM-led training for competitive players rated 1400–1800, built to add 250+ FIDE points in 12
            months.
          </p>
          <div className="gap-hero__ctas" data-hero-in>
            <Cta onClick={goToRegister}>
              Register for GAP <Arrow />
            </Cta>
            <a href="#eligibility" className="gap-ghost gap-ghost--dark">
              Check if I qualify
            </a>
          </div>
          <ul className="gap-hero__stats" data-hero-in>
            {STATS.map((s) => (
              <li key={s.label}>
                <span className="gap-hero__stat">{s.value}</span>
                <span className="gap-hero__stat-label">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="gap-hero__photo">
        <Image
          src="/images/anand-video-thumb.png"
          width={612}
          height={502}
          alt="GM Viswanathan Anand"
          sizes="(max-width: 1199px) 80vw, 42vw"
          loading="eager"
          fetchPriority="high"
        />
        <p className="gap-hero__badge">
          <span className="gap-hero__badge-num" aria-hidden="true">
            4
          </span>
          <span>
            <b>GM Viswanathan Anand</b>
            <span>Live masterclasses, part of GAP</span>
          </span>
        </p>
      </div>

      <nav className="gap-hero__jump" aria-label="On this page" data-hero-in>
        <span className="gap-hero__jump-label">Jump to</span>
        <ul>
          {JUMPS.map((j) => (
            <li key={j.href}>
              <a href={j.href}>{j.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
