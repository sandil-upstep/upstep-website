"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onFrame } from "./SmoothScroll";
import { finishPreloader, isPreloaderDone } from "./preloaderState";
import "./preloader.scss";

gsap.registerPlugin(ScrollTrigger);

// The count from 0 to 100 takes this long when everything has loaded, easing
// in and out so the first and last few numbers visibly roll into place.
const COUNT_MS = 3000;
const countCurve = gsap.parseEase("sine.inOut");
// The curve is baked into keyframes sampled this finely along it.
const COUNT_FRAMES = 300;
// Within this many of what has really loaded, the count eases off, and it
// waits there until more comes in.
const SLOW_ZONE = 10;
// How long "100%" holds before the curtain opens, and how long that takes.
const HOLD_MS = 400;
const SPLIT_MS = 1200;
const SPLIT_EASE = "cubic-bezier(0.83, 0, 0.17, 1)"; // GSAP's power4.inOut
// Stop waiting on assets after this long. A stalled request, or a phone that
// won't buffer autoplay video, shouldn't keep the page hidden.
const MAX_WAIT_MS = 6000;

// The counter's reels: hundreds, tens, ones. A leading blank stands for "no
// digit yet". The ones reel runs through 0–9 ten times, so the count only
// ever rolls it forwards.
const DIGITS = "0123456789".split("");
const REELS = [
  ["", "1"],
  ["", ...DIGITS.slice(1), "0"],
  [...Array.from({ length: 10 }, () => DIGITS).flat(), "0"],
];

// How far each reel has rolled, in cells, at a count of `value` (fractional
// mid-roll). As on an odometer, the tens and hundreds only turn while the
// digit to their right rolls over from 9 to 0.
const reelPositions = (value: number) => {
  const tens = Math.floor(value / 10) + Math.max(0, (value % 10) - 9);
  const hundreds = Math.max(0, value - 99);
  return [hundreds, tens, value];
};

// Every slot is a fixed 1ch wide, so the counter shifts left by half of each
// still-blank leading slot to keep the digits on show centred.
const centringShift = (value: number) => {
  const [hundreds, tens] = reelPositions(value);
  return -(2 - Math.min(1, hundreds) - Math.min(1, tens)) / 2;
};

// Only what the first screen shows is worth waiting for: lazy images further
// down may never load until they're scrolled to. Hidden (display: none)
// variants have an empty box and drop out here too.
const isOnFirstScreen = (element: Element) => {
  const { top, bottom, width } = element.getBoundingClientRect();
  return width > 0 && top < window.innerHeight && bottom > 0;
};

// Settles once the image or video has something to show, or has failed — the
// counter only needs to know it's no longer pending.
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

// Full-screen curtain with a rolling percentage counter over a thin progress
// bar, shown on a full page load until the fonts and the first screen's
// images and video are in. The count rolls through every number, holds on
// 100%, then the curtain opens from the bar: the top half slides up, the
// bottom half down. Scrolling stays locked meanwhile (preloader.scss, plus
// Lenis in SmoothScroll).
//
// Everything moves through the Web Animations API on transforms alone, which
// the browser runs off the main thread. GSAP tweens would stutter here, as
// the page behind is still hydrating and starting its own intros.
export default function Preloader() {
  const [visible, setVisible] = useState(() => !isPreloaderDone());
  const overlayRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const counter = counterRef.current;
    const fill = fillRef.current;
    if (!overlay || !counter || !fill) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const halves = [...overlay.querySelectorAll<HTMLElement>(".preloader__half")];
    const reels = [...overlay.querySelectorAll<HTMLElement>(".preloader__reel")];

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
    const count = (element: Element, transformAt: (value: number) => string) =>
      element.animate(
        values.map((value) => ({ transform: transformAt(value) })),
        { duration: COUNT_MS, fill: "forwards" }
      );
    const counting = [
      ...reels.map((reel, i) => count(reel, (value) => `translateY(${-reelPositions(value)[i]}em)`)),
      count(counter, (value) => `translateX(${centringShift(value)}ch)`),
      count(fill, (value) => `scaleX(${value / 100})`),
    ];

    // Keep the count to what has really loaded: ease off nearing it and wait
    // there, then pick up speed again gently as more comes in. The rate moves
    // in steps of 0.05 so the animations aren't retimed every frame.
    let rate = 1;
    const stopPacing = onFrame(() => {
      const progress = Math.min(1, (Number(counting[0].currentTime) || 0) / COUNT_MS);
      const value = 100 * countCurve(progress);
      const wanted = target >= 100 ? 1 : gsap.utils.clamp(0, 1, (target - value) / SLOW_ZONE);
      const next = Math.round(Math.min(wanted, rate + 0.05) * 20) / 20;
      if (next === rate) return;
      rate = next;
      counting.forEach((animation) => animation.updatePlaybackRate(rate));
    });

    // Hold on 100%, then open the curtain from the bar.
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
    counting[0].finished.then(leave, () => {});

    return () => {
      cancelled = true;
      window.clearTimeout(giveUp);
      window.clearTimeout(reveal);
      stopPacing();
      [...counting, ...opening].forEach((animation) => animation.cancel());
    };
  }, []);

  if (!visible) return null;

  return (
    <div ref={overlayRef} className="preloader" aria-hidden="true">
      <div className="preloader__half preloader__half--top">
        <span ref={counterRef} className="preloader__counter" style={{ transform: "translateX(-1ch)" }}>
          {REELS.map((cells, slot) => (
            <span key={slot} className="preloader__slot">
              <span className="preloader__reel">
                {cells.map((glyph, i) => (
                  <span key={i} className="preloader__cell">
                    {glyph}
                  </span>
                ))}
              </span>
            </span>
          ))}
          <span>%</span>
        </span>
        <span className="preloader__bar">
          <span ref={fillRef} className="preloader__bar-fill" />
        </span>
      </div>
      <div className="preloader__half preloader__half--bottom" />
    </div>
  );
}
