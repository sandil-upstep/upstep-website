"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onFrame } from "./SmoothScroll";
import { finishPreloader, isPreloaderDone } from "./preloaderState";
import "./preloader.scss";

gsap.registerPlugin(ScrollTrigger);

// The bar fills from 0 to 100 over this long when everything has loaded,
// easing in and out.
const COUNT_MS = 3000;
const countCurve = gsap.parseEase("sine.inOut");
// The curve is baked into keyframes sampled this finely along it.
const COUNT_FRAMES = 300;
// Within this many of what has really loaded, the fill eases off, and it
// waits there until more comes in.
const SLOW_ZONE = 10;
// How long the full bar holds before the curtain opens, and how long that takes.
const HOLD_MS = 400;
const SPLIT_MS = 1200;
const SPLIT_EASE = "cubic-bezier(0.83, 0, 0.17, 1)"; // GSAP's power4.inOut
// Stop waiting on assets after this long. A stalled request, or a phone that
// won't buffer autoplay video, shouldn't keep the page hidden.
const MAX_WAIT_MS = 6000;

// Only what the first screen shows is worth waiting for: lazy images further
// down may never load until they're scrolled to. Hidden (display: none)
// variants have an empty box and drop out here too.
const isOnFirstScreen = (element: Element) => {
  const { top, bottom, width } = element.getBoundingClientRect();
  return width > 0 && top < window.innerHeight && bottom > 0;
};

// Settles once the image or video has something to show, or has failed — the
// bar only needs to know it's no longer pending.
function whenReady(media: HTMLImageElement | HTMLVideoElement) {
  const ready =
    media instanceof HTMLImageElement
      ? media.complete
      : media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
  if (ready) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const loadEvent = media instanceof HTMLImageElement ? "load" : "loadeddata";
    media.addEventListener(loadEvent, () => resolve(), { once: true });
    media.addEventListener("error", () => resolve(), { once: true });
  });
}

// Full-screen curtain with a thin progress bar, shown on a full page load
// until the fonts and the first screen's images and video are in. The bar
// fills, holds full, then the curtain opens from it: the top half slides up,
// the bottom half down. Scrolling stays locked meanwhile (preloader.scss, plus
// Lenis in SmoothScroll).
//
// Everything moves through the Web Animations API on transforms alone, which
// the browser runs off the main thread. GSAP tweens would stutter here, as
// the page behind is still hydrating and starting its own intros.
export default function Preloader() {
  const [visible, setVisible] = useState(() => !isPreloaderDone());
  const overlayRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const fill = fillRef.current;
    if (!overlay || !fill) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const halves = [...overlay.querySelectorAll<HTMLElement>(".preloader__half")];

    const media = [
      ...document.querySelectorAll<HTMLImageElement | HTMLVideoElement>("img, video"),
    ].filter(isOnFirstScreen);
    const pending = [...media.map(whenReady), document.fonts.ready];

    let loaded = 0;
    let target = 0;
    let cancelled = false;
    pending.forEach((asset) =>
      asset.then(() => {
        if (cancelled) return;
        loaded += 1;
        target = (loaded / pending.length) * 100;
      })
    );
    const giveUp = window.setTimeout(() => {
      target = 100;
    }, MAX_WAIT_MS);

    const values = Array.from({ length: COUNT_FRAMES + 1 }, (_, i) => 100 * countCurve(i / COUNT_FRAMES));
    const counting = fill.animate(
      values.map((value) => ({ transform: `scaleX(${value / 100})` })),
      { duration: COUNT_MS, fill: "forwards" }
    );

    // Keep the fill to what has really loaded: ease off nearing it and wait
    // there, then pick up speed again gently as more comes in. The rate moves
    // in steps of 0.05 so the animation isn't retimed every frame.
    let rate = 1;
    const stopPacing = onFrame(() => {
      const progress = Math.min(1, (Number(counting.currentTime) || 0) / COUNT_MS);
      const value = 100 * countCurve(progress);
      const wanted = target >= 100 ? 1 : gsap.utils.clamp(0, 1, (target - value) / SLOW_ZONE);
      const next = Math.round(Math.min(wanted, rate + 0.05) * 20) / 20;
      if (next === rate) return;
      rate = next;
      counting.updatePlaybackRate(rate);
    });

    // Hold on the full bar, then open the curtain from the bar.
    let opening: Animation[] = [];
    let reveal: number | undefined;
    const leave = () => {
      stopPacing();
      // Lift the scroll lock while the screen is still and fully covered: the
      // scrollbar comes back and ScrollTrigger re-measures out of sight.
      overlay.classList.add("is-leaving");
      ScrollTrigger.refresh();
      reveal = window.setTimeout(finishPreloader, HOLD_MS);
      opening = halves.map((half, index) =>
        reduceMotion
          ? half.animate({ opacity: [1, 0] }, { delay: HOLD_MS, duration: 600, easing: "ease-out", fill: "forwards" })
          : half.animate(
              { transform: ["translateY(0)", `translateY(${index === 0 ? -100 : 100}%)`] },
              { delay: HOLD_MS, duration: SPLIT_MS, easing: SPLIT_EASE, fill: "forwards" }
            )
      );
      // Cancelling (on unmount) rejects `finished`; nothing's left to do then.
      opening[0].finished.then(() => setVisible(false), () => {});
    };
    counting.finished.then(leave, () => {});

    return () => {
      cancelled = true;
      window.clearTimeout(giveUp);
      window.clearTimeout(reveal);
      stopPacing();
      [counting, ...opening].forEach((animation) => animation.cancel());
    };
  }, []);

  if (!visible) return null;

  return (
    <div ref={overlayRef} className="preloader" aria-hidden="true">
      <div className="preloader__half preloader__half--top">
        <span className="preloader__bar">
          <span ref={fillRef} className="preloader__bar-fill" />
        </span>
      </div>
      <div className="preloader__half preloader__half--bottom" />
    </div>
  );
}
