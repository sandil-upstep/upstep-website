"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "./common/Button";
import Eyebrow from "./Eyebrow";
import RevealTitle from "./RevealTitle";
import "./bookDemoSection.scss";

gsap.registerPlugin(ScrollTrigger);

// TODO: clock, device, age, board and photo are cut straight out of the design
// screenshot as stand-ins. Swap in the exported originals when they're ready.
const NEEDS = [
  { icon: "/images/book-demo/clock.png", width: 82, height: 80, label: "20 minutes" },
  { icon: "/images/structured/books.webp", width: 218, height: 177, label: "Willingness to learn & play chess" },
  { icon: "/images/book-demo/device.png", width: 92, height: 74, label: "A Device" },
  { icon: "/images/book-demo/age.png", width: 64, height: 66, label: "Age 4 to 16" },
];

const STEPS: { title: string; body: ReactNode }[] = [
  {
    title: "Experience a Live Class",
    body: (
      <p>
        Your child interacts with an Upstep coach in a real online chess class environment. The <b>Zoom link</b> will be
        shared.
      </p>
    ),
  },
  {
    title: "Chess Level Assessment",
    body: <p>The coach assesses your child’s current chess level and learning needs.</p>,
  },
  {
    title: "Personalised Roadmap",
    body: (
      <>
        <p>After the demo, parents receive a clear view of their child’s:</p>
        <ul>
          <li>Strengths,</li>
          <li>Areas to Improve</li>
          <li>Assessed Starting Level in Chess</li>
          <li>Personalised Learning Journey</li>
        </ul>
      </>
    ),
  },
  {
    title: "Free 30-Minute Counselling Session",
    body: (
      <p>
        A senior counsellor walks you through the roadmap, explains the recommended class format, answers your questions
        and helps you get started.
      </p>
    ),
  },
];

// Mobile only: dashed connectors hanging off the bottom of cards 1–3 and
// curling into the next card, which sits on the opposite side of the zig-zag.
const LINKS = [
  { viewBox: "0 0 170 120", d: "M170 2 C 60 6, 0 40, 4 80 S 30 118, 60 118" },
  { viewBox: "0 0 90 120", d: "M10 2 C 60 20, 90 50, 80 80 S 50 112, 20 118" },
  { viewBox: "0 0 80 140", d: "M40 2 C 20 40, 15 90, 30 110 S 60 135, 80 138" },
];

export default function BookDemoSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from(".book-demo__item", {
        y: 20,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: ".book-demo__list", start: "top 85%", once: true },
      });
      gsap.from(".book-demo__photo", {
        clipPath: "inset(12% 12% 12% 12% round 28px)",
        scale: 1.06,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: { trigger: ".book-demo__photo", start: "top 80%", once: true },
      });
      // Cards rise one after another, then the dashed trail draws in behind them.
      gsap
        .timeline({ scrollTrigger: { trigger: ".book-demo__steps", start: "top 80%", once: true } })
        .from(".book-demo__step", { y: 40, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.15 })
        .from(".book-demo__trail path", { autoAlpha: 0, duration: 0.8, ease: "power2.out", stagger: 0.15 }, "-=0.5");
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="book-demo" aria-labelledby="book-demo-title">
      <div className="book-demo__lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <Image
        src="/images/book-demo/board.png"
        alt=""
        width={475}
        height={459}
        className="book-demo__board"
        aria-hidden="true"
      />
      <span className="book-demo__cube book-demo__cube--tan" aria-hidden="true" />
      <span className="book-demo__cube book-demo__cube--right" aria-hidden="true" />

      <div className="book-demo__inner">
        <Eyebrow className="book-demo__eyebrow" boxClassName="book-demo__eyebrow-box">
          Take The First Step
        </Eyebrow>
        <RevealTitle className="book-demo__title" id="book-demo-title">
          Book a
          <br />
          demo
        </RevealTitle>

        <ul className="book-demo__list" aria-label="All you need">
          {NEEDS.map((need) => (
            <li className="book-demo__item" key={need.label}>
              <span className="book-demo__icon">
                <Image src={need.icon} alt="" width={need.width} height={need.height} aria-hidden="true" />
              </span>
              {need.label}
            </li>
          ))}
        </ul>

        <div className="book-demo__photo">
          <Image
            src="/images/book-demo/photo.jpg"
            alt="A parent watching her daughter take an online chess class on a laptop"
            width={626}
            height={595}
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        </div>

        <div className="book-demo__steps">
          {/* Dashed trail weaving between the staggered cards, in design px
              measured from the first card's top-left corner. */}
          <svg className="book-demo__trail" viewBox="0 0 1352 640" fill="none" aria-hidden="true">
            <path d="M160 292 C 200 350, 290 375, 350 354" />
            <path d="M565 115 C 610 40, 760 20, 825 117" />
            <path d="M950 502 C 990 590, 1110 650, 1190 574" />
          </svg>
          <span className="book-demo__cube book-demo__cube--steps" aria-hidden="true" />

          <ol className="book-demo__cards">
            {STEPS.map((step, i) => (
              <li className="book-demo__step" key={step.title}>
                <span className="book-demo__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="book-demo__step-title">{step.title}</h3>
                <div className="book-demo__step-text">{step.body}</div>
                {LINKS[i] && (
                  <svg className={`book-demo__link book-demo__link--${i + 1}`} viewBox={LINKS[i].viewBox} fill="none" aria-hidden="true">
                    <path d={LINKS[i].d} />
                  </svg>
                )}
              </li>
            ))}
          </ol>
        </div>

        <p className="book-demo__note">
          Designed for assessment and class experience—not a 20-minute crash course in chess.
        </p>

        <div className="book-demo__cta">
          <span className="book-demo__cta-outline" aria-hidden="true" />
          <Button className="book-demo__cta-btn" href="/book-demo">
            Book a FREE demo today!
          </Button>
        </div>
      </div>
    </section>
  );
}
