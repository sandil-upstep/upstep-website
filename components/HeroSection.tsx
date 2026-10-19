"use client";

import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import "./heroSection.scss";
import InteractivePersonalizedText from "./InteractivePersonalizedText";
import Button from "./common/Button";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, SplitText);

// CC0 sample clip and a local photo as stand-ins. Swap for the real hero clip
// and its poster frame (the girl at the laptop in the design) when ready.
const PLACEHOLDER_VIDEO_SRC =
  // "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
  "Child_learning_chess.mp4";
const PLACEHOLDER_POSTER = "/images/wwo-photo.png";

// The mask shape is measured off the 1072px-wide design frame: a big rounded
// rect tilted 15deg clockwise, pivoting on its bottom-left corner. Only that
// corner and the two edges meeting there are on screen — the rest overshoots
// the top and right of the section. Lengths stay in design px and the whole
// rect is scaled by (section width / DESIGN_WIDTH) at render time. That's
// done in userSpaceOnUse rather than objectBoundingBox because bounding-box
// units scale x and y separately, which skews a rotated shape on a wide box.
const DESIGN_WIDTH = 1072;
const CLIP_SHAPE_ROTATION = 15;
const CLIP_PIVOT = { x: 471, y: 444 };
const CLIP_RECT = {
  x: CLIP_PIVOT.x,
  y: CLIP_PIVOT.y - 900,
  width: 1200,
  height: 900,
  rx: 50,
};
// Play button sits over the laptop, in design px like the shape.
const PLAY_BUTTON_CENTER = { x: 858, y: 295 };
// Square box holding the 110px outline circle plus the label arcing round it.
const PLAY_BUTTON_SIZE = 160;
// How lazily the play button trails the cursor over the video.
const PLAY_CHASE_DURATION = 0.8;
const PLAY_CHASE_EASE = "power3.out";
// Outline frame around the photo (Figma: 940x833, rx 114.5, 14.48deg),
// fitted to the design frame in design px: its left edge runs through the
// cube's spot (~432, 290) and its bottom-right corner lands just under the
// photo at ~(905, 600). Positioned by its top-left corner, which it pivots on.
const FRAME_ROTATION = 14.48;
const FRAME_RECT = { x: 495, y: 46, width: 549, height: 446, rx: 67 };
// Thin orange guide line, in design px: drops from just under the header
// pill, sweeps left through the cube's spot (~432, 292) and lands on top of
// the "30k+" card. The viewBox matches the section's 16:9 box so one design
// px maps to the same screen px as the mask shape.
const GUIDE_LINE_VIEWBOX = `0 0 ${DESIGN_WIDTH} ${(DESIGN_WIDTH * 9) / 16}`;
const GUIDE_LINE_PATH = "M 578 60 C 530 66, 500 100, 482 160 S 445 260, 432 292 S 405 390, 396 437";
// Below lg the photo runs full-bleed on top of the stacked hero, and the mask
// is a big rounded rect tilted 10deg clockwise whose bottom-right corner sits
// just inside the box's bottom-right — so the bottom edge slopes down to the
// right and rounds up off the right edge. The rect is drawn with that corner
// at the origin and moved into place by its transform, so its attrs stay
// fixed while the box resizes (gsap animates them on play/close). Screen px.
const MOBILE_CLIP_ROTATION = 10;
const MOBILE_CLIP_INSET = { x: 12, y: 56 };
const MOBILE_CLIP_RECT = { x: -2000, y: -2000, width: 2000, height: 2000, rx: 40 };
// The outline frame is the same rect nudged out from under the photo, so only
// its bottom edge and corner show as a thin line below the slant.
const MOBILE_FRAME_OFFSET = { x: 10, y: 40 };
// Full-cover rect — grossly overshoots the section so that, even rotated
// around the pivot, it fully covers it. Clearing the mask (isMasked=false)
// right after drops the clip-path entirely.
const FULL_COVER_RECT = { x: -4000, y: -4000, width: 10000, height: 10000, rx: 0 };

const STAR_PATH =
  "M12 1.5 15.1 8l7 .9-5.1 4.9 1.3 7L12 17.4 5.7 20.8 7 13.8 1.9 8.9l7-.9L12 1.5Z";
const STAR_COLOR = "#f5a524";

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="rating-stars" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <svg key={i} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <clipPath id={`star-fill-${i}`}>
                <rect x="0" y="0" width={24 * fill} height="24" />
              </clipPath>
            </defs>
            <path d={STAR_PATH} fill="none" stroke={STAR_COLOR} strokeWidth="1.2" strokeLinejoin="round" />
            <path d={STAR_PATH} fill={STAR_COLOR} clipPath={`url(#star-fill-${i})`} />
          </svg>
        );
      })}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="rating-card-google-logo" aria-label="Google">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.05 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.05 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

// Each card's soft colored haze, painted behind the glass wash.
type RatingCard =
  | { kind: "google"; id: string; rating: number; reviews: string; glow: string }
  | {
      kind: "stat";
      id: string;
      value: string;
      label: string;
      illustration: { src: string; width: number; height: number };
      glow: string;
    };

const RATING_CARDS: RatingCard[] = [
  {
    kind: "google",
    id: "google-rating",
    rating: 4.8,
    reviews: "3500 reviews",
    glow: "radial-gradient(60% 70% at 95% 0%, rgba(180, 180, 180, 0.35) 0%, transparent 70%)",
  },
  {
    kind: "stat",
    id: "students",
    value: "30k+",
    label: "Chess Students Trained",
    illustration: { src: "/images/rc-icon2.svg", width: 83, height: 107 },
    glow: "radial-gradient(60% 70% at 15% 10%, rgba(220, 215, 200, 0.3) 0%, transparent 70%)",
  },
  {
    kind: "stat",
    id: "classes",
    value: "517k+",
    label: "Chess Classes Delivered",
    illustration: { src: "/images/rc-icon3.svg", width: 125, height: 104 },
    glow: "radial-gradient(55% 55% at 40% 5%, rgba(160, 130, 100, 0.45) 0%, transparent 70%)",
  },
  {
    kind: "stat",
    id: "countries",
    value: "20+",
    label: "Countries Trust Us",
    illustration: { src: "/images/rc-icon4.svg", width: 115, height: 98 },
    glow: "radial-gradient(70% 80% at 20% 15%, rgba(200, 190, 110, 0.5) 0%, transparent 70%)",
  },
];

// Matches Tailwind's lg breakpoint — below it the hero stacks, video on top.
const DESKTOP_QUERY = "(min-width: 1024px)";

const EXPAND_DURATION = 1.6;
const EXPAND_EASE = "power3.inOut";
// The surrounding hero slides out sideways while the video grows, clearing
// well before the expand finishes so nothing is left half-covered by its edge.
const SURROUNDINGS_FADE_DURATION = 0.9;
// How far each element slides sideways as it fades out.
const SURROUNDINGS_DRIFT = 160;
// Pause after the surroundings start moving before the video starts growing.
const EXPAND_LAG = 0.15;

// Freeze page scroll while the video is fullscreen. scrollbar-gutter keeps
// the scrollbar's space reserved so the page doesn't shift sideways as it
// disappears.
function setScrollLocked(locked: boolean) {
  const root = document.documentElement;
  root.style.overflow = locked ? "hidden" : "";
  root.style.scrollbarGutter = locked ? "stable" : "";
}

// iOS Safari's video-only fullscreen API, missing from the DOM typings.
type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const surroundingsFadeRef = useRef<gsap.core.Timeline | null>(null);
  const videoSlotRef = useRef<HTMLDivElement>(null);
  const videoLayerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const clipRectRef = useRef<SVGRectElement>(null);
  const mobileClipRectRef = useRef<SVGRectElement>(null);
  const textRingRef = useRef<SVGGElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const guideLineRef = useRef<SVGPathElement>(null);
  const ratingRowRef = useRef<HTMLDivElement>(null);
  const cardWrapperRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [isMasked, setIsMasked] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  // The video box's size in screen px. Desktop shapes scale with its width
  // (design px -> screen px); the mobile mask is pinned to its bottom-right.
  const [boxSize, setBoxSize] = useState({ width: DESIGN_WIDTH, height: (DESIGN_WIDTH * 10) / 16 });
  const shapeScale = boxSize.width / DESIGN_WIDTH;
  const mobileClipPivot = `translate(${boxSize.width - MOBILE_CLIP_INSET.x} ${boxSize.height - MOBILE_CLIP_INSET.y}) rotate(${MOBILE_CLIP_ROTATION})`;

  // Measure before the first paint, so the slide-in below never reveals the
  // mask and play button at the placeholder design size, then track resizes.
  useLayoutEffect(() => {
    const container = videoContainerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    setBoxSize({ width, height });
    const observer = new ResizeObserver(([entry]) => {
      setBoxSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Draw the guide line down from the header once the page has settled.
  useEffect(() => {
    const line = guideLineRef.current;
    if (!line) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.from(line, { drawSVG: 0, duration: 1.6, ease: "power2.inOut", delay: 0.6 });
    return () => {
      tween.revert();
    };
  }, []);

  // Reveal the title line by line on intro: each line slides up out of its
  // own clipping mask. autoSplit re-splits once fonts load or the column
  // resizes, and returning the tween from onSplit lets SplitText carry its
  // progress over to the fresh lines. The title is server-rendered hidden so
  // the unsplit text never flashes before this runs.
  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(title, { autoAlpha: 1 });
      return;
    }
    const split = SplitText.create(title, {
      type: "lines",
      mask: "lines",
      linesClass: "hero-title-line",
      autoSplit: true,
      onSplit: (self) => {
        gsap.set(title, { autoAlpha: 1 });
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 1,
          ease: "power4.out",
          stagger: 0.12,
          delay: 0.2,
        });
      },
    });
    return () => {
      split.revert();
    };
  }, []);

  // Never leave the page scroll-locked if we unmount mid-playback.
  useEffect(() => () => setScrollLocked(false), []);

  // Set the mask straight to its final size on mount — no reveal animation.
  useEffect(() => {
    if (!clipRectRef.current) return;
    gsap.set(clipRectRef.current, { attr: CLIP_RECT });
  }, []);

  // Slide the video panel in from the right on mount. It's server-rendered
  // hidden: its mask is sized from the measured box, so before hydration it
  // would show at the design size and visibly snap into place.
  useEffect(() => {
    if (!videoContainerRef.current) return;
    gsap.fromTo(
      videoContainerRef.current,
      { xPercent: 20, autoAlpha: 0, delay: 0.2 },
      { xPercent: 0, autoAlpha: 1, duration: 1, ease: "power3.out" }
    );
  }, []);

  // Spin the ring text around the circle path forever. Rotating the whole
  // group by exactly 360deg (rather than animating textPath's startOffset)
  // loops seamlessly — no jump back to the start. The label only covers
  // part of the circle, so its bounding box is off-center: pivot on the
  // circle's center in SVG units instead. The button unmounts while playing,
  // so the spin restarts on the fresh ring each time it comes back.
  useEffect(() => {
    if (isPlaying || !textRingRef.current) return;
    const center = PLAY_BUTTON_SIZE / 2;
    const tween = gsap.to(textRingRef.current, {
      rotation: 360,
      svgOrigin: `${center} ${center}`,
      duration: 12,
      repeat: -1,
      ease: "none",
    });
    return () => {
      tween.kill();
    };
  }, [isPlaying]);

  // The play button eases after the cursor while it's over the visible video,
  // and drifts back to its resting spot once the cursor leaves. The clip-path
  // also clips hit-testing, so a move only counts when it lands on the video
  // itself (or the button) — not the masked-off parts of the container. Mouse
  // only: touch devices just tap the button where it sits.
  useEffect(() => {
    const container = videoContainerRef.current;
    const button = playButtonRef.current;
    if (isPlaying || !container || !button) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const moveX = gsap.quickTo(button, "x", { duration: PLAY_CHASE_DURATION, ease: PLAY_CHASE_EASE });
    const moveY = gsap.quickTo(button, "y", { duration: PLAY_CHASE_DURATION, ease: PLAY_CHASE_EASE });
    const goHome = () => {
      moveX(0);
      moveY(0);
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target as Node;
      if (target !== videoRef.current && !button.contains(target)) {
        goHome();
        return;
      }
      // Resting center = where the button is now, minus how far it's chased.
      const box = button.getBoundingClientRect();
      const restX = box.left + box.width / 2 - Number(gsap.getProperty(button, "x"));
      const restY = box.top + box.height / 2 - Number(gsap.getProperty(button, "y"));
      moveX(event.clientX - restX);
      moveY(event.clientY - restY);
    };

    container.addEventListener("pointermove", handleMove);
    container.addEventListener("pointerleave", goHome);
    return () => {
      container.removeEventListener("pointermove", handleMove);
      container.removeEventListener("pointerleave", goHome);
      gsap.killTweensOf(button);
      gsap.set(button, { clearProps: "x,y" });
    };
  }, [isPlaying]);

  // Stagger the rating cards in on mount, then straighten the staggered row
  // once its top reaches the middle of the viewport (and undo it on the way
  // back up). The straightening plays on its own clock rather than being tied
  // to the scroll, and the row isn't pinned, so it scrolls like the rest of
  // the page. The stagger-in moves the inner card while the straightening
  // moves its outer wrapper, so the two tweens never fight over the same
  // transform. Straightening is desktop-only: below lg the cards sit in
  // normal flow under the stacked hero.
  useEffect(() => {
    const row = ratingRowRef.current;
    const wrappers = cardWrapperRefs.current.filter((el): el is HTMLDivElement => el !== null);
    const cards = cardRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (!row || cards.length === 0) return;

    const mm = gsap.matchMedia(row);
    mm.add(DESKTOP_QUERY, () => {
      // Drop each card down to the last one's level so the row settles into
      // one straight line — the first card travels furthest, the last not at
      // all. Measured from the live layout (the stagger is a vw clamp), and
      // re-measured on refresh so resizes stay aligned.
      const lastWrapper = wrappers[wrappers.length - 1];
      gsap.to(wrappers, {
        y: (_index: number, wrapper: HTMLDivElement) =>
          lastWrapper.offsetTop - wrapper.offsetTop,
        duration: 0.9,
        ease: "power2.inOut",
        force3D: true,
        scrollTrigger: {
          trigger: row,
          start: "top 50%",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
        },
      });
    });

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.15,
          delay: 0.4,
          force3D: true,
        }
      );
    }, row);

    return () => {
      ctx.revert();
      mm.revert();
    };
  }, []);

  // Desktop and stacked layouts each mask with their own rect.
  const getActiveClip = () =>
    window.matchMedia(DESKTOP_QUERY).matches
      ? { rect: clipRectRef.current, attrs: CLIP_RECT }
      : { rect: mobileClipRectRef.current, attrs: MOBILE_CLIP_RECT };

  // Below lg, play in the browser's own fullscreen player instead of the
  // expand animation. iOS Safari only supports fullscreen on the video itself,
  // via webkitEnterFullscreen. Resolves false if fullscreen isn't available.
  const enterNativeFullscreen = async (video: FullscreenVideo) => {
    video.muted = false;
    video.controls = true;
    try {
      if (video.requestFullscreen) await video.requestFullscreen({ navigationUI: "hide" });
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      else throw new Error("Fullscreen unsupported");
      await video.play();
      return true;
    } catch {
      video.muted = true;
      video.controls = false;
      return false;
    }
  };

  const handlePlayClick = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!window.matchMedia(DESKTOP_QUERY).matches && (await enterNativeFullscreen(video))) return;

    const clipRect = getActiveClip().rect;
    const layer = videoLayerRef.current;
    if (!clipRect || !layer) return;

    setIsPlaying(true);
    setScrollLocked(true);
    video.muted = false;
    video.play();

    // Fade everything else on screen out as the video grows, each part sliding
    // sideways out of its way: whatever sits in the left half of the viewport
    // goes left, the rest goes right, so the cards part like doors. Frame
    // lines just fade, since they ride along inside the growing layer. Kept
    // as one timeline so closing can reverse it back to each element's own
    // opacity and transform (the cubes are rotated and some dimmed in CSS).
    const section = sectionRef.current;
    const header = document.querySelector<HTMLElement>("body > header");
    const copy = copyRef.current;
    const cards = cardRefs.current.filter((el): el is HTMLDivElement => el !== null);
    const cubes = [...(section?.querySelectorAll<HTMLElement>(".hero-cube") ?? [])];
    const frames = [...(section?.querySelectorAll<HTMLElement>(".hero-frame") ?? [])];
    const sideways = (_index: number, el: HTMLElement) => {
      const box = el.getBoundingClientRect();
      const fromCenter = box.left + box.width / 2 - window.innerWidth / 2;
      return fromCenter > 1 ? SURROUNDINGS_DRIFT : -SURROUNDINGS_DRIFT;
    };

    const fade = { opacity: 0, x: sideways, duration: SURROUNDINGS_FADE_DURATION, ease: "power2.inOut" };
    const animated = [header, copy, ...cards, ...cubes, ...frames].filter(
      (el): el is HTMLElement => el !== null
    );
    surroundingsFadeRef.current?.kill();
    const timeline = gsap.timeline({
      onReverseComplete: () => {
        gsap.set(animated, { clearProps: "opacity,transform,transition" });
      },
    });
    // The header's own CSS transform transition would drag behind every frame.
    if (header) timeline.set(header, { transition: "none" }, 0).to(header, fade, 0);
    if (copy) timeline.to(copy, fade, 0);
    timeline
      .to(cards, { ...fade, stagger: 0.06 }, 0)
      .to(cubes, fade, 0)
      .to(frames, { opacity: 0, duration: SURROUNDINGS_FADE_DURATION, ease: "power2.inOut" }, 0);
    surroundingsFadeRef.current = timeline;

    // Pin the layer to the viewport exactly where it sits now, so the switch
    // to position:fixed is invisible — then grow it to fill the viewport
    // while the mask opens up, just behind the surroundings sliding away.
    const expandDelay = EXPAND_LAG;
    const { top, left, width, height } = layer.getBoundingClientRect();
    gsap.set(layer, { position: "fixed", top, left, width, height });
    gsap.to(layer, {
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      duration: EXPAND_DURATION,
      delay: expandDelay,
      ease: EXPAND_EASE,
    });
    gsap.to(clipRect, {
      attr: FULL_COVER_RECT,
      duration: EXPAND_DURATION,
      delay: expandDelay,
      ease: EXPAND_EASE,
      onComplete: () => setIsMasked(false),
    });
  };

  const handleCloseClick = () => {
    const video = videoRef.current;
    const { rect: clipRect, attrs: clipAttrs } = getActiveClip();
    const layer = videoLayerRef.current;
    const section = sectionRef.current;
    const slot = videoSlotRef.current;
    if (!video || !clipRect || !layer || !section || !slot) return;

    // Re-apply the clip-path first, at its current (full-cover) size, so
    // nothing visibly jumps — then shrink it back down to the mask shape.
    setIsMasked(true);
    video.muted = true;

    // Mirror of opening: the surroundings slide back in from the sides,
    // landing as the video settles into place.
    const fadeBack = surroundingsFadeRef.current;
    if (fadeBack) {
      gsap.delayedCall(Math.max(0, EXPAND_DURATION - fadeBack.duration()), () => {
        fadeBack.reverse();
      });
    }

    // Shrink back onto its resting spot — the whole section on desktop, the
    // in-flow slot when stacked — then hand positioning back to the stylesheet.
    const home = window.matchMedia(DESKTOP_QUERY).matches ? section : slot;
    const { top, left, width, height } = home.getBoundingClientRect();
    gsap.to(layer, {
      top,
      left,
      width,
      height,
      duration: EXPAND_DURATION,
      ease: EXPAND_EASE,
      // Cancels a still-pending expand if closed during the fade-out.
      overwrite: true,
    });
    gsap.to(clipRect, {
      attr: clipAttrs,
      duration: EXPAND_DURATION,
      ease: EXPAND_EASE,
      overwrite: true,
      onComplete: () => {
        gsap.set(layer, { clearProps: "position,top,left,width,height" });
        setScrollLocked(false);
        setIsPlaying(false);
      },
    });
  };

  // Leaving native fullscreen drops back to the muted, masked hero loop.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onExit = () => {
      if (document.fullscreenElement === video) return;
      video.muted = true;
      video.controls = false;
      video.play().catch(() => {});
    };
    document.addEventListener("fullscreenchange", onExit);
    video.addEventListener("webkitendfullscreen", onExit);
    return () => {
      document.removeEventListener("fullscreenchange", onExit);
      video.removeEventListener("webkitendfullscreen", onExit);
    };
  }, []);

  // Escape closes the expanded video, same as the close button.
  const onEscape = useEffectEvent(handleCloseClick);
  useEffect(() => {
    if (!isPlaying) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.repeat) onEscape();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPlaying]);

  return (
    <>
    {/* While playing, the section is lifted above the fixed header (z-50) —
        its own stacking context would otherwise cap the video beneath it. */}
    <section
      ref={sectionRef}
      className={`relative overflow-x-clip lg:aspect-16/10 ${isPlaying ? "z-100" : "z-10"}`}
    >
      {/* The copy column runs a little wider than half on desktop: the title
          is meant to reach in past the frame line, as in the design. */}
      <div className="min-h-[780px] mx-auto grid w-full max-w-full grid-cols-1 items-center sm:gap-1 px-4 pt-24 pb-12 sm:px-10 sm:pt-32 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:px-[clamp(2.5rem,4vw,5rem)] lg:pt-[clamp(8rem,10vw,12rem)] lg:pb-24">
        {/* Left: copy */}
        {/* Desktop gaps shrink with the viewport, like the rest of the
            design, so the copy clears the card row on 1280-1440 laptops. */}
        <div ref={copyRef} className="@container relative z-10 h-full flex flex-col items-start gap-8 lg:gap-[clamp(1.5rem,2.5vw,3rem)]">
          <Image src="/images/cubes/cube-1.png" width={200} height={200} alt="" aria-hidden="true" className="hero-cube hero-cube--title" />

          <h1 ref={titleRef} className="hero-title" style={{ visibility: "hidden" }}>
            Interactive Chess<br/> Learning, Personalized<br/> for Every Child
          </h1>
          
          <div className="relative flex flex-col gap-3 text-base font-medium sm:flex-row">
            {/* <Link
              href="/courses"
              className="flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-background transition-colors hover:bg-[#383838]"
            >
              Browse courses
            </Link> */}
            {/* <Button className="relative z-10 before:rounded-[inherit] before:border before:border-white/60 ring-1 ring-amber-500 ring-offset-2" href="/book-demo">
              Book a FREE demo today!
            </Button> */}
            <div className="relative inline-flex self-start mx-3">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-2.5 translate-y-2.5 rounded-[10px] border border-[#B4511D]"
              />
              <Button className="relative z-10" href="/book-demo">
                Book a FREE demo today!
              </Button>
            </div>
          </div>

          {/* Desktop only — the stacked design goes straight to the cards. */}
          <div className="hidden lg:block">
            <Image src="/images/scroll-down.svg" width={30} height={67} alt="scroll down" className="h-[clamp(2.75rem,3.5vw,4.25rem)] w-auto" />
          </div> 
        </div>
        {/* Right: video. Below lg the slot is an in-flow portrait box stacked
            above the copy, bleeding past the side padding and up behind the
            header, and holds its height while the layer goes fixed for
            fullscreen playback. From lg up it turns static, so the layer
            spans the whole section as before. */}
        <div
          ref={videoSlotRef}
          className="relative order-first -mx-4 -mt-24 aspect-3/4 w-[calc(100%+2rem)] sm:-mx-10 sm:-mt-32 sm:aspect-4/3 sm:w-[calc(100%+5rem)] lg:static lg:order-none lg:mx-0 lg:mt-0 lg:aspect-auto lg:w-full"
        >
        <Image src="/images/cubes/cube-4.png" width={200} height={200} alt="" aria-hidden="true" className="hero-cube hero-cube--photo" />
        {/* z-20 while playing keeps the rating cards from painting over it. */}
        <div
          ref={videoLayerRef}
          className={`absolute inset-0 ${isPlaying ? "z-20" : "z-0"}`}
        >
          <div
            ref={videoContainerRef}
            className="video-container relative h-full w-full"
            style={{ visibility: "hidden" }}
          >
            {/* Stacked layout's frame: just the line under the slanted
                bottom edge of the photo. */}
            <svg aria-hidden="true" className="hero-frame pointer-events-none absolute inset-0 h-full w-full overflow-visible lg:hidden">
              <defs>
                <linearGradient id="video-frame-gradient-mobile" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#5E3929" />
                  <stop offset="1" stopColor="#B4511D" />
                </linearGradient>
              </defs>
              <rect
                {...MOBILE_CLIP_RECT}
                transform={`${mobileClipPivot} translate(${MOBILE_FRAME_OFFSET.x} ${MOBILE_FRAME_OFFSET.y})`}
                fill="none"
                stroke="url(#video-frame-gradient-mobile)"
                strokeWidth="1"
              />
            </svg>
            {/* Frame sits behind the video: only the stretches outside the
                mask show — the orange top-left corner curving out from under
                the header, the left edge down past the cube, and the dark
                bottom edge running behind the cards. */}
            <svg aria-hidden="true" className="hero-frame video-frame pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible lg:block">
              <defs>
                <linearGradient id="video-frame-gradient" x1="0.35" y1="0" x2="0.65" y2="1">
                  <stop offset="0.15" stopColor="#F56318" />
                  <stop offset="1" stopColor="#5E3929" />
                </linearGradient>
              </defs>
              <rect
                x={FRAME_RECT.x}
                y={FRAME_RECT.y}
                width={FRAME_RECT.width}
                height={FRAME_RECT.height}
                rx={FRAME_RECT.rx}
                transform={`scale(${shapeScale}) rotate(${FRAME_ROTATION} ${FRAME_RECT.x} ${FRAME_RECT.y})`}
                fill="none"
                stroke="url(#video-frame-gradient)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {/* `relative` so it paints over the (positioned) frame above. */}
            <video
              ref={videoRef}
              className={`masked-video relative ${isMasked ? "is-masked" : ""}`}
              autoPlay
              muted
              loop
              playsInline
              poster={PLACEHOLDER_POSTER}
              src={PLACEHOLDER_VIDEO_SRC}
            ></video>

            <svg width="0" height="0">
              <clipPath id="videoClip" clipPathUnits="userSpaceOnUse">
                <rect
                  ref={clipRectRef}
                  x={CLIP_RECT.x}
                  y={CLIP_RECT.y}
                  width={CLIP_RECT.width}
                  height={CLIP_RECT.height}
                  rx={CLIP_RECT.rx}
                  transform={`scale(${shapeScale}) rotate(${CLIP_SHAPE_ROTATION} ${CLIP_PIVOT.x} ${CLIP_PIVOT.y})`}
                />
              </clipPath>
              <clipPath id="videoClipMobile" clipPathUnits="userSpaceOnUse">
                <rect ref={mobileClipRectRef} {...MOBILE_CLIP_RECT} transform={mobileClipPivot} />
              </clipPath>
            </svg>
            
            {!isPlaying && (
              <button
                ref={playButtonRef}
                type="button"
                onClick={handlePlayClick}
                aria-label="Play video"
                // Over the laptop on desktop (design px); below lg, centered
                // a little high to clear the slanted bottom edge.
                style={
                  {
                    "--play-top": `${PLAY_BUTTON_CENTER.y * shapeScale}px`,
                    "--play-left": `${PLAY_BUTTON_CENTER.x * shapeScale}px`,
                    "--play-size": `${PLAY_BUTTON_SIZE * shapeScale}px`,
                  } as CSSProperties
                }
                className="absolute top-[45%] left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full text-white transition-[scale] drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)] hover:scale-105 lg:top-(--play-top) lg:left-(--play-left) lg:size-(--play-size)"
              >
                {/* viewBox units are design px, so the ring scales with the shape. */}
                <svg viewBox={`0 0 ${PLAY_BUTTON_SIZE} ${PLAY_BUTTON_SIZE}`} className="h-full w-full overflow-visible">
                  <path
                    id="play-ring-path"
                    fill="none"
                    d="M 14,80 a 66,66 0 1,1 132,0 a 66,66 0 1,1 -132,0"
                  />
                  <g ref={textRingRef}>
                    {/* The path starts at 9 o'clock; tilt it back so the
                        label runs from ~8 o'clock over the top to ~4. */}
                    <text
                      fill="currentColor"
                      fontSize="17"
                      fontWeight="600"
                      transform="rotate(-30 80 80)"
                    >
                      <textPath
                        xlinkHref="#play-ring-path"
                        startOffset="0"
                        textLength="280"
                        lengthAdjust="spacing"
                      >
                        #1 Online Chess Academy
                      </textPath>
                    </text>
                  </g>
                  <circle cx="80" cy="80" r="55" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M70 62v36l28-18z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            {isPlaying && (
              <button
                type="button"
                onClick={handleCloseClick}
                aria-label="Close video"
                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-transform hover:scale-105"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            )}
          </div>
        </div>
        </div>

      </div>
      {/* <svg
        viewBox={GUIDE_LINE_VIEWBOX}
        preserveAspectRatio="xMinYMin meet"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible lg:block"
      >
        <path
          ref={guideLineRef}
          d={GUIDE_LINE_PATH}
          fill="none"
          stroke="#f8661a"
          strokeOpacity="0.7"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg> */}
      {/* Desktop cubes: one sitting on the frame line beside the title, one
          blurred down between the first two cards. */}
      <Image src="/images/cubes/cube-11.png" width={200} height={200} alt="" aria-hidden="true" className="hero-cube hero-cube--frame" />
      <Image src="/images/cubes/cube-4.png" width={200} height={200} alt="" aria-hidden="true" className="hero-cube hero-cube--cards" />
      <div ref={ratingRowRef} className="rating-card-row">
        {RATING_CARDS.map((card, index) => (
          <div
            key={card.id}
            ref={(el) => {
              cardWrapperRefs.current[index] = el;
            }}
            className="rating-card-wrapper"
          >
          <div
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            style={{ visibility: "hidden", "--card-glow": card.glow } as CSSProperties}
            className="hero-glass-card rating-card"
          >
            {card.kind === "google" ? (
              <div className="rating-card-google">
                <RatingStars rating={card.rating} />
                <div className="rating-card-google-score">
                  <GoogleLogo />
                  <span className="rating-card-google-rating">{card.rating} stars</span>
                </div>
                <p className="rating-card-google-reviews">
                  with <span>{card.reviews}</span>
                </p>
              </div>
            ) : (
              <>
                <Image
                  src={card.illustration.src}
                  width={card.illustration.width}
                  height={card.illustration.height}
                  alt=""
                  aria-hidden="true"
                  className="rating-card-illustration"
                />
                <span className="hero-gold-text rating-card-value">{card.value}</span>
                <span className="rating-card-label">{card.label}</span>
              </>
            )}
          </div>
          </div>
        ))}
        {/* Stacked grid's cubes, either side of the cards. After the cards
            so the nth-child stagger still counts only cards. */}
        <Image src="/images/cubes/cube-4.png" width={200} height={200} alt="" aria-hidden="true" className="hero-cube hero-cube--grid-left" />
        <Image src="/images/cubes/cube-21.png" width={200} height={200} alt="" aria-hidden="true" className="hero-cube hero-cube--grid-right" />
      </div>

      
    </section>
    <div className="flex flex-1 flex-col font-sans py-5 sm:pt-20 sm:pb-10">
      <div className="w-full py-5 sm:py-0">
        <InteractivePersonalizedText />
      </div> 
    </div>     
    </>
  );
}
