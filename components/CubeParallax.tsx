"use client";

import { useEffect } from "react";
import { onFrame } from "./SmoothScroll";

// Every decorative cube drifts with the scroll at its own depth (parallax) and
// floats gently on its own. A cube opts in with `data-cube="<depth>"`, from 0
// (far: barely moves) to 1 (near: moves most). A cube drawn as an element's
// ::before opts in with `data-cube-before="<depth>"` on that element instead,
// and its CSS reads the motion from --cube-translate / --cube-rotate; elements
// whose ::before isn't drawn at the current breakpoint are skipped.
//
// The drift follows the cube's section through the viewport: its pass runs
// from 0 as the section's top enters at the bottom to 1 as its bottom leaves
// at the top, and the cube sits on its designed spot halfway. A pinned section
// marks its tall wrapper `data-cube-scope`, so its cubes keep drifting while it
// is pinned, and however long the pin, they stay within the same few dozen px.
//
// The motion goes on the standalone `translate` and `rotate` properties, which
// apply on top of `transform`: each cube keeps the tilt its stylesheet gives
// it, and transform tweens elsewhere (the hero's video fade) don't clash.

const DRIFT = 100; // px of scroll drift over a section's whole pass, at depth 1
const TURN = 10; // degrees of scroll turn over the pass, at depth 1
const FLOAT = 5; // px of idle float either way
const SWAY = 2; // degrees of idle sway either way
const PHONE = 0.5; // strength of all of it on phones

let phoneMQ: MediaQueryList | null = null;
const strength = () => ((phoneMQ ??= window.matchMedia("(max-width: 767.98px)")).matches ? PHONE : 1);

// The scroll part of a cube's motion at `pass` through its section: y in px
// (+ is down) and a turn in degrees, `spin` (±1) picking its direction. Shared
// with the 3D cubes in ScientificallyStructuredSection.
export const cubeScroll = (pass: number, depth: number, spin = 1) => {
  const k = (0.5 - Math.min(1, Math.max(0, pass))) * depth * strength();
  return { y: k * DRIFT, turn: k * TURN * spin };
};

type Cube = {
  el: HTMLElement;
  pseudo: boolean;
  scope: HTMLElement;
  depth: number;
  spin: number;
  phase: number;
  period: number; // s per idle float
  top: number; // the scope's page top and height, as last measured
  height: number;
  live: boolean; // rendered (for a pseudo cube: drawn) at this breakpoint
};

export default function CubeParallax() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = document.querySelectorAll<HTMLElement>("[data-cube], [data-cube-before]");
    const cubes: Cube[] = [...els].map((el, i) => {
      const pseudo = !el.hasAttribute("data-cube");
      return {
        el,
        pseudo,
        scope: el.closest<HTMLElement>("[data-cube-scope]") ?? el.closest("section") ?? el.parentElement ?? el,
        depth: Number(pseudo ? el.dataset.cubeBefore : el.dataset.cube) || 0.5,
        spin: i % 2 ? 1 : -1,
        // Spread out so no two cubes float in step.
        phase: i * 1.7,
        period: 6 + ((i * 0.618) % 1) * 3,
        top: 0,
        height: 0,
        live: false,
      };
    });
    if (!cubes.length) return;

    // Section spots are measured only when the layout changes, not per frame.
    let stale = true;
    const measure = () => {
      for (const c of cubes) {
        const box = c.scope.getBoundingClientRect();
        c.top = box.top + window.scrollY;
        c.height = box.height;
        c.live = c.pseudo
          ? getComputedStyle(c.el, "::before").content !== "none"
          : c.el.offsetParent !== null;
      }
    };
    // The body catches anything above a section growing (images, fonts, a pin
    // wrapper's height) and breakpoint switches; the scopes catch the rest.
    const observer = new ResizeObserver(() => (stale = true));
    observer.observe(document.body);
    for (const scope of new Set(cubes.map((c) => c.scope))) observer.observe(scope);

    for (const c of cubes) if (!c.pseudo) c.el.style.willChange = "translate, rotate";

    const frame = () => {
      if (stale) {
        stale = false;
        measure();
      }
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const t = performance.now() / 1000;
      const s = strength();
      for (const c of cubes) {
        // Leave cubes whose section is well off screen where they are.
        if (!c.live || scrollY + vh < c.top - vh / 2 || scrollY > c.top + c.height + vh / 2) continue;
        const { y, turn } = cubeScroll((scrollY + vh - c.top) / (c.height + vh), c.depth, c.spin);
        const w = (2 * Math.PI * t) / c.period + c.phase;
        const calm = s * (0.5 + c.depth / 2); // nearer cubes float a little more
        const translate = `${(Math.cos(w * 0.7) * FLOAT * 0.4 * calm).toFixed(2)}px ${(y + Math.sin(w) * FLOAT * calm).toFixed(2)}px`;
        const rotate = `${(turn + Math.sin(w * 0.8 + 1) * SWAY * calm).toFixed(2)}deg`;
        if (c.pseudo) {
          c.el.style.setProperty("--cube-translate", translate);
          c.el.style.setProperty("--cube-rotate", rotate);
        } else {
          c.el.style.translate = translate;
          c.el.style.rotate = rotate;
        }
      }
    };
    // On the shared ticker, right after Lenis moves the scroll.
    const offFrame = onFrame(frame);

    return () => {
      offFrame();
      observer.disconnect();
      for (const { el } of cubes) {
        el.style.removeProperty("translate");
        el.style.removeProperty("rotate");
        el.style.removeProperty("will-change");
        el.style.removeProperty("--cube-translate");
        el.style.removeProperty("--cube-rotate");
      }
    };
  }, []);

  return null;
}
