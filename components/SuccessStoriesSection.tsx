"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type TouchEvent,
} from "react";
import { flushSync } from "react-dom";
import { Open_Sans, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import gsap from "gsap";
import Eyebrow from "./Eyebrow";
import RevealTitle from "./RevealTitle";
import StoryPhotoMorph, { type StoryPhotoMorphHandle } from "./StoryPhotoMorph";
import "./successStoriesSection.scss";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

type Story = {
  id: string;
  firstName: string;
  lastName: string;
  location: string;
  // Transparent cut-out of the student; its head pops out above the card.
  photo: string;
  // Base colour of the tilted card behind the photo.
  card: string;
  title: string;
  lead: string;
  highlights: string[];
};

// Placeholder photo path — drop the real cut-out PNG into public/images.
const VEDANT_PHOTO = "/images/player.png";

// Stories 2 and 3 are placeholders until their copy and photos are ready.
const STORIES: Story[] = [
  {
    id: "vedant",
    firstName: "Vedant",
    lastName: "Nayudu",
    location: "Singapore",
    photo: VEDANT_PHOTO,
    card: "#f3bb4f",
    title: "Placeholder headline for the second success story",
    lead: "A one or two sentence summary of this student's achievement goes here.",
    highlights: [
      "First highlight, such as a tournament result or rating gain.",
      "Second highlight with a notable win or milestone.",
      "Third highlight describing the level of competition.",
    ],
  },
  {
    id: "placeholder-2",
    firstName: "Student",
    lastName: "Two",
    location: "City",
    photo: "/images/player2.png",
    card: "#8fbcf2",
    title: "Placeholder headline for the second success story",
    lead: "A one or two sentence summary of this student's achievement goes here.",
    highlights: [
      "First highlight, such as a tournament result or rating gain.",
      "Second highlight with a notable win or milestone.",
      "Third highlight describing the level of competition.",
    ],
  },
  {
    id: "placeholder-3",
    firstName: "Student",
    lastName: "Three",
    location: "City",
    photo: VEDANT_PHOTO,
    card: "#f2875a",
    title: "Placeholder headline for the third success story",
    lead: "A one or two sentence summary of this student's achievement goes here.",
    highlights: [
      "First highlight, such as a tournament result or rating gain.",
      "Second highlight with a notable win or milestone.",
      "Third highlight describing the level of competition.",
    ],
  },
];

const LOOP = true; // false = stop at the first / last story
const DURATION = 350; // must match the slide transition in the stylesheet
const REDUCED_DURATION = 200; // must match the reduced-motion fade
const SWIPE_MIN = 50; // px of horizontal travel that counts as a swipe
const AUTOPLAY_DELAY = 6000; // ms each story stays up before advancing
const PHOTOS = STORIES.map((s) => s.photo);
// Card swing on slide change: resting tilt and how far it swings / drifts.
const CARD_TILT = 20; // deg, must match --tilt in the stylesheet
const CARD_SWING = 8; // deg
const CARD_DRIFT = 3; // cqw of the visual box

type Dir = "next" | "prev";
// "out": current story slides away; "in": new story jumps to the opposite
// side with transitions off, then is released to slide back into place.
type Phase = { kind: "idle" } | { kind: "out" | "in"; dir: Dir };

export default function SuccessStoriesSection() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const sectionRef = useRef<HTMLElement>(null);
  const busyRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const photoRef = useRef<StoryPhotoMorphHandle>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const goRef = useRef<(step: -1 | 1) => void>(() => {});
  // Autoplay pauses while hovered, keyboard-focused, off-screen or in a
  // hidden tab, and is off entirely for reduced-motion users.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const story = STORIES[index];

  useEffect(() => {
    const clip = clipRef.current;
    return () => {
      window.clearTimeout(timerRef.current);
      gsap.killTweensOf(clip);
    };
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.3,
    });
    io.observe(el);

    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReduceMotion(mq.matches);
    onMotion();
    mq.addEventListener("change", onMotion);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      mq.removeEventListener("change", onMotion);
    };
  }, []);

  // Restarts on every index change, so manual navigation resets the countdown.
  useEffect(() => {
    if (hovered || focused || !inView || !pageVisible || reduceMotion) return;
    if (!LOOP && index === STORIES.length - 1) return;
    const id = window.setTimeout(() => goRef.current(1), AUTOPLAY_DELAY);
    return () => window.clearTimeout(id);
  }, [index, hovered, focused, inView, pageVisible, reduceMotion]);

  // Preload every photo so swaps don't flash.
  useEffect(() => {
    new Set(STORIES.map((s) => s.photo)).forEach((src) => {
      new window.Image().src = src;
    });
  }, []);

  // The card recolours over the whole transition while it swings away in
  // the slide direction (counter-clockwise and left for "next") and springs
  // back to rest. The photo inside is counter-rotated, so only the card moves.
  const swingCard = (target: number, dir: Dir, seconds: number, reduce: boolean) => {
    const clip = clipRef.current;
    if (!clip) return;
    gsap.killTweensOf(clip);
    gsap.to(clip, { "--card": STORIES[target].card, duration: seconds, ease: "power2.inOut" });
    if (reduce) {
      gsap.set(clip, { "--tilt": CARD_TILT, "--drift": 0 });
      return;
    }
    const s = dir === "next" ? -1 : 1;
    gsap
      .timeline()
      .to(clip, {
        "--tilt": CARD_TILT + CARD_SWING * s,
        "--drift": CARD_DRIFT * s,
        duration: seconds / 2,
        ease: "power2.inOut",
      })
      .to(clip, { "--tilt": CARD_TILT, "--drift": 0, duration: seconds * 0.8, ease: "back.out(1.8)" });
  };

  const go = (step: -1 | 1) => {
    if (busyRef.current || STORIES.length < 2) return;
    let target = index + step;
    if (LOOP) target = (target + STORIES.length) % STORIES.length;
    if (target < 0 || target >= STORIES.length) return;

    busyRef.current = true;
    const dir: Dir = step > 0 ? "next" : "prev";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = reduce ? REDUCED_DURATION : DURATION;

    // The WebGL photo morphs across both halves while the text slides.
    photoRef.current?.morphTo(target, (wait * 2) / 1000, reduce);
    swingCard(target, dir, (wait * 2) / 1000, reduce);
    setPhase({ kind: "out", dir });
    timerRef.current = window.setTimeout(() => {
      // Park the new story off to the side and force a reflow so that
      // position is committed, then drop the class to let it slide in.
      flushSync(() => {
        setIndex(target);
        setPhase({ kind: "in", dir });
      });
      void sectionRef.current?.offsetWidth;
      setPhase({ kind: "idle" });
      timerRef.current = window.setTimeout(() => {
        busyRef.current = false;
      }, wait);
    }, wait);
  };
  useEffect(() => {
    goRef.current = go;
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  };

  const onTouchStart = (e: TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e: TouchEvent) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  const phaseClass = phase.kind === "idle" ? "" : ` stories--${phase.kind}-${phase.dir}`;

  return (
    <section
      ref={sectionRef}
      className={`stories ${openSans.variable} ${plusJakartaSans.variable} ${poppins.variable}${phaseClass}`}
      aria-labelledby="stories-title"
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      // Mouse only: touch taps emulate pointerenter without a matching leave.
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
      // Keyboard focus only, so a mouse click on an arrow doesn't stall autoplay.
      onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="stories__lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="stories__inner">
        <span className="stories__cube stories__cube--blue stories__cube--1" aria-hidden="true" data-cube="0.9" />
        <span className="stories__cube stories__cube--duo stories__cube--2" aria-hidden="true" data-cube="0.5" />

        <button
          type="button"
          className="stories__arrow stories__arrow--prev"
          aria-label="Previous story"
          disabled={!LOOP && index === 0}
          onClick={() => go(-1)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M16 3 7 12l9 9" />
          </svg>
        </button>

        <div className="stories__content">
          <Eyebrow className="stories__eyebrow" boxClassName="stories__eyebrow-box">
            Success Stories
          </Eyebrow>
          <RevealTitle className="stories__title" id="stories-title">
            Our{" "}
            <br />
            Champs
          </RevealTitle>

          <div className="stories__story" aria-live="polite">
            <h3 className="stories__story-title">{story.title}</h3>
            <p className="stories__lead">{story.lead}</p>
            <ul className="stories__list">
              {story.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="stories__visual">
          <div className="stories__visual-box">
            {/* GSAP owns --card after mount; React only sets the first one. */}
            <div
              ref={clipRef}
              className="stories__clip"
              style={{ "--card": STORIES[0].card } as CSSProperties}
            >
              <div className="stories__card" />
              <div className="stories__photo-wrap">
                <div className="stories__photo">
                  <StoryPhotoMorph
                    ref={photoRef}
                    photos={PHOTOS}
                    index={index}
                    sizes="(min-width: 1025px) 40vw, (min-width: 641px) 560px, 100vw"
                    alt={`${story.firstName} ${story.lastName}`}
                  />
                </div>
              </div>
            </div>

            <p className="stories__name">
              <span>{story.firstName}</span>
              <span>{story.lastName}</span>
            </p>
            <p className="stories__location">
              <svg viewBox="0 0 16 22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M8 21s7-7.2 7-12.5A7 7 0 0 0 1 8.5C1 13.8 8 21 8 21Z" />
                <circle cx="8" cy="8.5" r="2.4" />
              </svg>
              <span>{story.location}</span>
            </p>

            <span className="stories__cube stories__cube--blue stories__cube--3" aria-hidden="true" data-cube="0.4" />
            <span className="stories__cube stories__cube--beige stories__cube--4" aria-hidden="true" data-cube="0.6" />
          </div>
        </div>

        <button
          type="button"
          className="stories__arrow stories__arrow--next"
          aria-label="Next story"
          disabled={!LOOP && index === STORIES.length - 1}
          onClick={() => go(1)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="m8 3 9 9-9 9" />
          </svg>
        </button>
      </div>
    </section>
  );
}
