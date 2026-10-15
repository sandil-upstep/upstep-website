"use client";

import { useEffect, useState } from "react";
import { getLenis } from "./SmoothScroll";
import "./scrollToTop.scss";

// Floating "back to top" button. While the page glides up, a blur/dim veil
// covers the whole viewport so the sections racing past read as one soft
// transition rather than a flicker of content.
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    if (scrolling) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    setScrolling(true);
    const done = () => setScrolling(false);
    // Longer pages take a little longer, capped so it never drags.
    const duration = Math.min(2, 0.8 + window.scrollY / 8000);

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { duration, force: true, lock: true, onComplete: done });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.setTimeout(done, duration * 1000);
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        className={`scroll-top-veil${scrolling ? " scroll-top-veil--active" : ""}`}
      />
      <button
        type="button"
        aria-label="Scroll to top"
        onClick={scrollToTop}
        tabIndex={visible ? 0 : -1}
        className={`scroll-top-btn${visible ? " scroll-top-btn--visible" : ""}`}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
          <path
            d="M12 19V5M5 12l7-7 7 7"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  );
}
