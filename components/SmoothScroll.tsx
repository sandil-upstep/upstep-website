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

// Runs `callback` on every scroll. Under Lenis it fires inside Lenis' own frame,
// right after the scroll position moves, so scroll-linked styles land on the
// same frame as the scroll (a window "scroll" listener only hears about it a
// frame later, which shows as a shudder at the edges of a pin). Without Lenis
// it falls back to the window event. Returns an unsubscribe function.
export const onScrollFrame = (callback: () => void) => {
  const lenis = instance;
  if (lenis) return lenis.on("scroll", callback);
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
};

// Runs `callback` once per animation frame on GSAP's ticker, after Lenis has
// moved the scroll for that frame (Lenis' tick is added with priority), so
// anything drawn from the scroll position (a WebGL scene, a fixed overlay)
// never disagrees with the page by a frame. Returns an unsubscribe function.
export const onFrame = (callback: () => void) => {
  gsap.ticker.add(callback);
  return () => gsap.ticker.remove(callback);
};

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
    gsap.ticker.add(tick, false, true);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      if (instance === lenis) instance = null;
      lenis.destroy();
    };
  }, []);

  return null;
}
