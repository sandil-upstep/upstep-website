"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Section eyebrow: the outlined accent box pops in, then the label slides out
// from behind it through a clipping mask once the eyebrow scrolls into view.
export default function Eyebrow({
  className,
  boxClassName,
  children,
}: {
  className: string;
  boxClassName: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ scrollTrigger: { trigger: root, start: "top 85%", once: true } })
        .from("[data-eyebrow-box]", { scale: 0, rotate: -90, duration: 0.6, ease: "back.out(2)" })
        .from("[data-eyebrow-text]", { xPercent: -105, duration: 0.9, ease: "power4.out" }, "-=0.2");
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <p ref={rootRef} className={className}>
      <span className={boxClassName} aria-hidden="true" data-eyebrow-box />
      <span style={{ position: "relative", zIndex: 1, display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
        <span style={{ display: "inline-block" }} data-eyebrow-text>
          {children}
        </span>
      </span>
    </p>
  );
}
