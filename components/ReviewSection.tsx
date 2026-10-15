"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Open_Sans } from "next/font/google";
import Eyebrow from "./Eyebrow";
import RevealTitle from "./RevealTitle";
import "./reviewSection.scss";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type Review = {
  id: string;
  name: string;
  timeAgo: string;
  rating: number;
  verified: boolean;
  text: string;
  // Reviewer photo; falls back to coloured initials when missing.
  avatar?: string;
};

// TODO: swap in the studio's real, distinct Google reviews once they're
// pulled from the business profile — the design only had one example review
// to go on, so it's repeated here as a placeholder.
const REVIEW_TEXT =
  "Hi everyone, I strongly Recommend upstep academy and tutor Mr Prasad harendra . I'm grateful to the team especially RM mr Anthony , he is easily accessible on WhatsApp and flexible in changing the schedules as per our convenience .";

const REVIEWS: Review[] = Array.from({ length: 8 }, (_, i) => ({
  id: `review-${i}`,
  name: "Tenneti poornima",
  timeAgo: "1 month ago",
  rating: 4.5,
  verified: true,
  text: REVIEW_TEXT,
}));

// Countries the reviews come from, cycling in a vertical marquee.
const FLAGS = [
  { code: "sg", label: "Singapore" },
  { code: "gb", label: "United Kingdom" },
  { code: "ae", label: "United Arab Emirates" },
  { code: "ca", label: "Canada" },
  { code: "nz", label: "New Zealand" },
  { code: "de", label: "Germany" },
  { code: "nl", label: "Netherlands" },
  { code: "ch", label: "Switzerland" },
];

// One marquee group: the flag set repeated so a single group is taller than
// the section, otherwise the bottom of the strip shows empty space mid-loop.
const FLAG_LOOP = [...FLAGS, ...FLAGS, ...FLAGS];

const AVATAR_COLORS = ["#3d78de", "#f2875a", "#2c9e6b", "#a35fd0", "#e0a53c"];

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

type FlagProps = {
  country: string;
  label: string;
  type?: "svg" | "png" | "webp";
  width?: number | string;
};

function Flag(props: FlagProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      width={props.width ?? "100"}
      src={`https://flagcdn.com/${props.country.toLowerCase()}.${props.type ?? "svg"}`}
      alt={props.label}
      loading="lazy"
    />
  );
}

function GoogleMark() {
  return (
    <svg className="review__google" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.95a9 9 0 0 0 0 8.06l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <svg className="review__verified" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#3d78de" />
      <path d="M6 10.2l2.4 2.4L14 7" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  const pct = Math.max(0, Math.min(1, rating / 5)) * 100;
  const star = (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 1.3l2.55 5.17 5.7.83-4.13 4.02.97 5.68L10 14.1l-5.1 2.68.98-5.68L1.75 7.3l5.7-.83L10 1.3Z" />
    </svg>
  );
  return (
    <div className="review__stars" role="img" aria-label={`${rating} out of 5 stars`}>
      <div className="review__stars-track">{Array.from({ length: 5 }, (_, i) => <span key={i}>{star}</span>)}</div>
      <div className="review__stars-fill" style={{ width: `${pct}%` }}>
        {Array.from({ length: 5 }, (_, i) => <span key={i}>{star}</span>)}
      </div>
    </div>
  );
}

export default function ReviewSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = () => {
    const track = trackRef.current;
    if (!track) return;
    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft >= track.scrollWidth - track.clientWidth - 4);
  };

  useEffect(() => {
    updateEdges();
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => updateEdges();
    track.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const scrollByCard = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".review__card");
    const step = card ? card.getBoundingClientRect().width + 24 : track.clientWidth * 0.8;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className={`review ${openSans.variable}`} aria-labelledby="review-title">
      <div className="review__lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="review__inner">
        <div className="review__head">
          <Eyebrow className="review__eyebrow" boxClassName="review__eyebrow-box">
            True testimonials
          </Eyebrow>
          <RevealTitle className="review__title" id="review-title">
            L
            <span className="review__heart" aria-hidden="true">
              <Image src="/images/reviews/heart.svg" alt="" width={48} height={48} />
            </span>
            ve from
            <br />
            around the world
          </RevealTitle>
          <span className="review__earth" aria-hidden="true">
            <Image src="/images/earth-full.png" alt="" width={447} height={447} className="review__earth-img" />
          </span>
          <Image
            src="/images/cubes/cube-21.png"
            alt=""
            width={200}
            height={200}
            className="review__cube"
            aria-hidden="true"
          />
          <span className="review__diamond" aria-hidden="true" />
        </div>

        {/* Mobile only: the flags run as a horizontal strip under the title. */}
        <div className="review__flags-row" aria-hidden="true">
          <div className="review__flags-row-track">
            {[0, 1].map((group) => (
              <div className="review__flags-row-group" key={group}>
                {FLAG_LOOP.map((flag, i) => (
                  <span className="review__flag" key={`${flag.code}-${i}`}>
                    <Flag country={flag.code} label={flag.label} width={90} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className={`review__carousel${atEnd ? " is-end" : ""}`}>
          <div ref={trackRef} className="review__track" tabIndex={0} aria-label="Reviews">
            {REVIEWS.map((review) => {
              const initials = initialsOf(review.name);
              const color = AVATAR_COLORS[review.id.length % AVATAR_COLORS.length];
              return (
                <article className="review__card" key={review.id}>
                  <div className="review__card-head">
                    {review.avatar ? (
                      <Image src={review.avatar} alt="" width={88} height={88} className="review__avatar" aria-hidden="true" />
                    ) : (
                      <span className="review__avatar" style={{ background: color }} aria-hidden="true">
                        {initials}
                      </span>
                    )}
                    <div className="review__who">
                      <p className="review__name">{review.name}</p>
                      <p className="review__time">{review.timeAgo}</p>
                    </div>
                    <GoogleMark />
                  </div>
                  <div className="review__rating">
                    <Stars rating={review.rating} />
                    {review.verified && <VerifiedBadge />}
                  </div>
                  <p className="review__text">{review.text}</p>
                </article>
              );
            })}
          </div>

          <div className="review__nav">
            <button type="button" className="review__arrow review__arrow--prev" aria-label="Previous reviews" disabled={atStart} onClick={() => scrollByCard(-1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button type="button" className="review__arrow review__arrow--next" aria-label="Next reviews" disabled={atEnd} onClick={() => scrollByCard(1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="review__flags" aria-hidden="true">
        <div className="review__flags-track">
          {[0, 1].map((group) => (
            <div className="review__flags-group" key={group}>
              {FLAG_LOOP.map((flag, i) => (
                <span className="review__flag" key={`${flag.code}-${i}`}>
                  <Flag country={flag.code} label={flag.label} width={36} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
