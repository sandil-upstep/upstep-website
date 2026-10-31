"use client";

import { useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReveal } from "../gap/GapParts";
import { CoursesHead, CoursesLines, Cube } from "./CoursesParts";
import { BENEFIT_ROWS } from "./coursesPageData";
import "./coursesBenefits.scss";

gsap.registerPlugin(ScrollTrigger);

// "Key Benefits": pill cards in three staggered rows that rise in one by one
// with the scroll, over a checkerboard floor sliding toward the viewer while
// the section scrolls by.
export default function CoursesBenefits() {
  const ref = useReveal<HTMLElement>();

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".courses-benefits__plane",
        { backgroundPosition: "0px 0px" },
        {
          backgroundPosition: "0px 384px",
          ease: "none",
          scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
      // Each card rises from below the window in turn, tied to the scroll.
      gsap.from(".courses-benefit", {
        y: () => window.innerHeight * 0.45,
        rotateX: 25,
        autoAlpha: 0,
        transformOrigin: "50% 100%",
        ease: "power2.out",
        stagger: 0.18,
        scrollTrigger: {
          trigger: ".courses-benefits__grid",
          start: "top bottom",
          end: "top 30%",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, root);
    return () => ctx.revert();
  }, [ref]);

  return (
    <section ref={ref} className="courses-benefits courses-section" aria-labelledby="courses-benefits-title">
      <CoursesLines dark />
      <div className="courses-benefits__floor" aria-hidden="true">
        <div className="courses-benefits__plane" />
      </div>
      <div className="courses-inner">
        <CoursesHead dark eyebrow="Some title goes here" title="Key Benefits" id="courses-benefits-title" />
        <ul className="courses-benefits__grid">
          {BENEFIT_ROWS.map((row, r) => (
            <li key={r} className={`courses-benefits__row courses-benefits__row--${r + 1}`}>
              {row.map((b) => (
                <div key={b.label.join(" ")} className={`courses-benefit${b.icon ? "" : " courses-benefit--plain"}`}>
                  {b.icon && <Image src={b.icon} alt="" width={96} height={96} aria-hidden="true" />}
                  <span>
                    {b.label[0]}
                    <br />
                    {b.label[1]}
                  </span>
                </div>
              ))}
            </li>
          ))}
        </ul>
      </div>
      <Cube className="courses-benefits__cube courses-benefits__cube--a" depth={0.6} />
      <Cube className="courses-benefits__cube courses-benefits__cube--b" depth={0.4} />
    </section>
  );
}
