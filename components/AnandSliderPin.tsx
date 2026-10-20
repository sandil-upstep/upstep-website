"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { setCoverDark } from "./coverTheme";
import { onScrollFrame } from "./SmoothScroll";

// Pins the Anand section while vertical scrolling drives its card slider
// sideways, releasing once the last card is fully in view. The section sticks
// with its bottom edge on the viewport's bottom (or its top on the viewport's
// top, if it fits), so the cards row stays visible the whole time. Does nothing
// when the cards already fit and the slider has nothing to scroll.
// `markers` draws ScrollTrigger-style debug lines: the pin starts when the
// green "start" line reaches the "scroller" line and ends at the red "end" line.
export default function AnandSliderPin({ children, markers = false }: { children: ReactNode; markers?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const section = wrap?.firstElementChild as HTMLElement | null;
    const slider = section?.querySelector<HTMLElement>(".anand__slider");
    if (!wrap || !section || !slider) return;

    let distance = 0;
    let stickTop = 0;
    const items = Array.from(slider.children) as HTMLElement[];
    // Mobile progress bar: its thumb is 28% of the track and travels to 72%,
    // i.e. 72 / 28 of its own width.
    const thumb = section.querySelector<HTMLElement>(".anand__progress span");
    const THUMB_TRAVEL = (72 / 28) * 100;

    // Slides the cards with a transform rather than slider.scrollLeft: the
    // slider is masked, so scrolling it repaints the whole strip every frame,
    // while a transform only moves the cards' composited layers.
    const sync = () => {
      if (distance <= 0) return;
      const progress = Math.min(1, Math.max(0, (stickTop - wrap.getBoundingClientRect().top) / distance));
      const x = `translate3d(${(-progress * distance).toFixed(2)}px, 0, 0)`;
      for (const item of items) item.style.transform = x;
      if (thumb) thumb.style.transform = `translate3d(${(progress * THUMB_TRAVEL).toFixed(2)}%, 0, 0)`;
    };

    const reset = () => {
      for (const item of items) item.style.transform = "";
      if (thumb) thumb.style.transform = "";
    };

    const measure = () => {
      // Measure the slider at rest, without the cards' offset.
      reset();
      slider.scrollLeft = 0;
      distance = Math.max(0, slider.scrollWidth - slider.clientWidth);
      const active = distance > 1;
      wrap.classList.toggle("anand-pin--active", active);
      if (!active) {
        distance = 0;
        wrap.style.height = "";
        return;
      }
      stickTop = Math.min(0, window.innerHeight - section.offsetHeight);
      wrap.style.setProperty("--pin-top", `${stickTop}px`);
      wrap.style.setProperty("--pin-distance", `${distance}px`);
      // Extra height gives the vertical scroll room to cover the slider's width.
      wrap.style.height = `${section.offsetHeight + distance}px`;
      sync();
    };

    // Mobile browsers resize the viewport's height as the address bar shows and
    // hides mid-scroll; re-measuring then changes the wrapper height and sticky
    // offset under the finger and the page jumps. Only a width change re-measures.
    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      measure();
    };

    // Watch the section only: the slider's size doesn't change on its own, and
    // the cards' transforms don't trigger it.
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    window.addEventListener("resize", onResize);
    const offScroll = onScrollFrame(sync);
    measure();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      offScroll();
      reset();
      wrap.classList.remove("anand-pin--active");
      wrap.style.height = "";
    };
  }, []);

  // Publishes how far the page has scrolled through the section as --anand-scroll
  // (0 = its top entering the viewport bottom, 1 = its wrapper leaving the top),
  // which the checkerboard uses to zoom and rotate. Measured on the wrapper so
  // it keeps moving while the section is pinned.
  useEffect(() => {
    const wrap = wrapRef.current;
    const checker = wrap?.querySelector<HTMLElement>(".anand__checker");
    if (!wrap || !checker) return;

    // Set on the checkerboard itself: on the section, the inherited property
    // would restyle every element inside it on each scroll frame.
    const update = () => {
      const rect = wrap.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      checker.style.setProperty("--anand-scroll", Math.min(1, Math.max(0, progress)).toFixed(4));
    };

    const offScroll = onScrollFrame(update);
    window.addEventListener("resize", update);
    update();

    return () => {
      offScroll();
      window.removeEventListener("resize", update);
    };
  }, []);

  // The page cover starts light and switches to its dark theme once the
  // section's top has scrolled 40% of the way up the viewport, then back to
  // light once the "What we offer" section (.wwo) reaches that same line.
  useEffect(() => {
    const section = wrapRef.current?.firstElementChild;
    const cover = section?.closest(".main-cover");
    if (!section || !cover) return;
    const offer = cover.querySelector(".wwo");

    const past = new Map<Element, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) past.set(entry.target, entry.isIntersecting);
        const dark = past.get(section) && !(offer && past.get(offer));
        setCoverDark(cover, "anand", Boolean(dark));
      },
      { rootMargin: "0px 0px -40% 0px" },
    );
    observer.observe(section);
    if (offer) observer.observe(offer);
    return () => {
      observer.disconnect();
      setCoverDark(cover, "anand", false);
    };
  }, []);

  return (
    <div ref={wrapRef} className="anand-pin0" data-cube-scope>
      {children}
      {markers && (
        <>
          <span className="anand-pin__marker anand-pin__marker--scroller">scroller</span>
          <span className="anand-pin__marker anand-pin__marker--start">start</span>
          <span className="anand-pin__marker anand-pin__marker--end">end</span>
        </>
      )}
    </div>
  );
}
