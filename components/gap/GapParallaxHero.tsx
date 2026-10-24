"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { Cinzel } from "next/font/google";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { lockPage, unlockPage } from "../pageLock";
import { onPreloaderDone } from "../preloaderState";
import "./gapParallaxHero.scss";

gsap.registerPlugin(Observer);

const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"] });

// The GAP page's opening: a sky over the title, and the first scroll plays the
// scene in. The sky slides up, the palace terrace, the masters and the board
// rise in front of it, and only then does the page scroll on. Scrolling back
// up at the top of the page rewinds it.

type HeroState = "start" | "playing" | "revealed";

const LANDSCAPE_HEIGHT = 1.35;
const LANDSCAPE_END_Y = -((LANDSCAPE_HEIGHT - 1) / LANDSCAPE_HEIGHT) * 100;

// Trackpad inertia keeps emitting wheel events for a while after a flick;
// the page stays locked until input has been quiet for this long.
const INPUT_QUIET_MS = 220;

// Mouse parallax, after Wagerfield's Parallax.js: layers glide away from the
// pointer, each by a share of the viewport set by its depth, so the nearer a
// layer the further it travels. The CSS gives the layers enough bleed that
// their edges never show. Vertical travel is a share of the viewport height.
const POINTER_DEPTH = {
  landscape: 0.012,
  copy: 0.018,
  architecture: 0.02,
  masters: 0.03,
  chessboard: 0.045,
} as const;
const POINTER_Y_SCALE = 0.5;
// The glide after the pointer, standing in for Parallax.js's friction.
const POINTER_FRICTION = { duration: 1.2, ease: "power2.out" };

const NEXT_KEYS = new Set(["ArrowDown", "PageDown", " "]);
const PREV_KEYS = new Set(["ArrowUp", "PageUp", "Home"]);

export default function GapParallaxHero() {
  const rootRef = useRef<HTMLElement>(null);
  const playRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const foreground = q("[data-foreground]");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(q("[data-layer='landscape']"), { yPercent: LANDSCAPE_END_Y });
      gsap.set(foreground, { visibility: "visible" });
      gsap.set(q("[data-layer='copy']"), { top: "4%" });
      gsap.set(q("[data-layer='copy'] button"), { display: "none" });
      gsap.set(q("[data-layer='panelists']"), { autoAlpha: 1 });
      return;
    }

    let cleanup = () => {};
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.inOut" } });
      tl.to(q("[data-layer='copy']"), { yPercent: -60, autoAlpha: 0, duration: 0.7, ease: "power2.in" })
        .fromTo(
          q("[data-layer='landscape']"),
          { yPercent: 0, scale: 1.08 },
          { yPercent: LANDSCAPE_END_Y, scale: 1, duration: 1.7 },
          0,
        )
        .fromTo(q("[data-layer='architecture']"), { yPercent: 100 }, { yPercent: 0, duration: 1.5, ease: "power3.out" }, 0.1)
        .fromTo(q("[data-layer='masters']"), { yPercent: 100 }, { yPercent: 0, duration: 1.35, ease: "power3.out" }, 0.3)
        .fromTo(q("[data-layer='chessboard']"), { yPercent: 100 }, { yPercent: 0, duration: 1.15, ease: "power3.out" }, 0.5)
        .fromTo(q("[data-layer='panelists']"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, 1.1)
        .fromTo(
          q("[data-layer='panelists'] [data-title]"),
          { yPercent: 60 },
          { yPercent: 0, duration: 0.8, ease: "power3.out" },
          1.1,
        );

      gsap.set(foreground, { visibility: "visible" });

      let state: HeroState = "start";
      let lastInputAt = 0;
      let lastScrollAt = 0;

      // The hero holds one of pageLock's counted locks while the scene is
      // closed, so the register drawer opening over it can't let the page go.
      let held = false;
      const setLocked = (locked: boolean) => {
        if (locked === held) return;
        held = locked;
        if (locked) lockPage();
        else unlockPage();
      };

      const unlockWhenQuiet = () => {
        if (performance.now() - lastInputAt < INPUT_QUIET_MS) {
          gsap.delayedCall(0.08, unlockWhenQuiet);
          return;
        }
        state = "revealed";
        setLocked(false);
      };

      const play = () => {
        if (state !== "start") return;
        state = "playing";
        tl.eventCallback("onComplete", unlockWhenQuiet).play();
      };

      const rewind = () => {
        const settledAtTop = window.scrollY <= 0 && performance.now() - lastScrollAt > INPUT_QUIET_MS;
        if (state !== "revealed" || !settledAtTop) return;
        state = "playing";
        setLocked(true);
        tl.eventCallback("onReverseComplete", () => {
          state = "start";
        }).reverse();
      };

      const revealInstantly = () => {
        tl.progress(1);
        state = "revealed";
        setLocked(false);
      };

      playRef.current = play;

      // Users can't scroll while locked, so a scroll in the start state is the
      // browser restoring a position after a reload, or a link to a section.
      const onScroll = () => {
        lastScrollAt = performance.now();
        if (state === "start" && window.scrollY > 0) revealInstantly();
      };

      const onKeyDown = (event: KeyboardEvent) => {
        const target = event.target;
        if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [role='dialog']")))
          return;
        if (NEXT_KEYS.has(event.key) && !event.shiftKey && state !== "revealed") {
          event.preventDefault();
          play();
        } else if (PREV_KEYS.has(event.key) && window.scrollY <= 0) {
          if (state !== "revealed") event.preventDefault();
          rewind();
        }
      };

      // iOS Safari ignores overflow:hidden on the root for touch scrolling.
      const onTouchMove = (event: TouchEvent) => {
        if (state !== "revealed") event.preventDefault();
      };

      // Pixel x/y on the outer layers, separate from the timeline's yPercent and
      // scale, so the two effects stack instead of fighting.
      let onPointerMove: ((event: PointerEvent) => void) | null = null;
      let onPointerLeave: (() => void) | null = null;
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const movers = Object.entries(POINTER_DEPTH).map(([layer, depth]) => {
          const el = q(`[data-layer='${layer}']`);
          return { depth, x: gsap.quickTo(el, "x", POINTER_FRICTION), y: gsap.quickTo(el, "y", POINTER_FRICTION) };
        });
        // nx, ny run from -1 to 1 across the viewport, 0 at its centre.
        const moveTo = (nx: number, ny: number) => {
          const { innerWidth: w, innerHeight: h } = window;
          for (const m of movers) {
            m.x(-nx * m.depth * w);
            m.y(-ny * m.depth * POINTER_Y_SCALE * h);
          }
        };
        onPointerMove = (event) => {
          if (window.scrollY > window.innerHeight) return;
          moveTo((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
        };
        onPointerLeave = () => moveTo(0, 0);
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onPointerLeave);
      }

      let observer: Observer | null = null;

      // Starts listening once the preloader has stepped aside (it holds the
      // page still until then).
      const stopWaiting = onPreloaderDone(() => {
        if (window.scrollY > 0) revealInstantly();
        else setLocked(true);

        observer = Observer.create({
          target: window,
          type: "wheel,touch",
          wheelSpeed: -1,
          tolerance: 12,
          onChange: () => {
            lastInputAt = performance.now();
          },
          onUp: play,
          onDown: rewind,
        });
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("touchmove", onTouchMove, { passive: false });
      });

      cleanup = () => {
        stopWaiting();
        observer?.kill();
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("touchmove", onTouchMove);
        if (onPointerMove) window.removeEventListener("pointermove", onPointerMove);
        if (onPointerLeave) document.documentElement.removeEventListener("pointerleave", onPointerLeave);
        gsap.killTweensOf(unlockWhenQuiet);
        setLocked(false);
      };
    }, root);

    return () => {
      cleanup();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className={`gap-px-hero ${cinzel.variable}`}
      data-nav-theme="dark"
      aria-label="Grandmaster Accelerator Program"
    >
      <div data-layer="landscape" className="gap-px-hero__landscape">
        <Image
          src="/images/gap-hero/landscape.png"
          alt=""
          fill
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      <div data-layer="copy" className="gap-px-hero__copy">
        <p className="gap-px-hero__eyebrow">The Upstep Academy</p>
        <h1 className="gap-px-hero__title">Grandmaster Accelerator Program</h1>
        <p className="gap-px-hero__lead">Train with the legends who shaped modern chess, one move at a time.</p>
        <button type="button" className="gap-px-hero__explore" onClick={() => playRef.current()}>
          Explore
        </button>
      </div>

      <div data-layer="architecture" data-foreground className="gap-px-hero__layer gap-px-hero__layer--architecture">
        <div className="gap-px-hero__architecture-wide">
          <Image src="/images/gap-hero/architecture.png" alt="Gothic palace terrace" fill sizes="100vw" />
        </div>
        {/* Narrow screens show only the outer towers so they still frame the scene. */}
        <div className="gap-px-hero__architecture-narrow">
          <div>
            <Image src="/images/gap-hero/architecture.png" alt="Gothic palace terrace" fill sizes="280vw" />
          </div>
          <div>
            <Image src="/images/gap-hero/architecture.png" alt="" fill sizes="280vw" />
          </div>
        </div>
      </div>

      <div data-layer="masters" data-foreground className="gap-px-hero__layer gap-px-hero__layer--masters">
        <div className="gap-px-hero__masters">
          <Image
            src="/images/gap-hero/masters.png"
            alt="Five chess masters, GM Viswanathan Anand in front holding a white king"
            fill
            sizes="(min-width: 768px) 125vw, 190vw"
            loading="eager"
          />
        </div>
      </div>

      <div data-layer="chessboard" data-foreground className="gap-px-hero__layer gap-px-hero__layer--chessboard">
        <div className="gap-px-hero__chessboard">
          <Image
            src="/images/gap-hero/chessboard.png"
            alt="Chess pieces on a marble board"
            fill
            sizes="(min-width: 768px) 100vw, 230vw"
            loading="eager"
          />
        </div>
      </div>

      <div data-layer="panelists" className="gap-px-hero__panelists">
        <div className="gap-px-hero__panelists-inner">
          <h2 data-title className="gap-px-hero__panelists-title">
            <span aria-hidden="true" className="gap-px-hero__rule" />
            <span>
              Meet your
              <br />
              panelists
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
}
