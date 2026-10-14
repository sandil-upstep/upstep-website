"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

// The live Lenis instance (null under reduced motion or before mount), for
// sections that need to drive the page scroll themselves.
let instance: Lenis | null = null;
export const getLenis = () => instance;

// Eases wheel and trackpad scrolling with inertia. Lenis still moves the native
// window scroll, so sticky pins and plain scroll listeners keep working; it is
// driven from GSAP's ticker so ScrollTrigger updates on the same frame. Touch
// keeps the platform's own momentum, and reduced-motion users get plain scroll.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: true });
    instance = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      if (instance === lenis) instance = null;
      lenis.destroy();
    };
  }, []);

  return null;
}
