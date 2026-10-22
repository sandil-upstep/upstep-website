"use client";

import { useState, type CSSProperties } from "react";
import { Check, GapHead, GapLines, useReveal } from "./GapParts";
import { RATING_GAIN, RATING_MAX, RATING_MIN, gainPct, trackPct } from "./gapData";
import "./gapOutcome.scss";

// "Where could you be in 12 months?": the player's rating and the two
// commitments GAP's 250-point target assumes, against the projection. With
// either commitment dropped there's no projection to make.

const COMMITMENTS = [
  { id: "study", label: "1 hour of self-study every day" },
  { id: "tournaments", label: "8 FIDE classical tournaments a year" },
] as const;

export default function GapOutcome() {
  const [rating, setRating] = useState(1550);
  const [kept, setKept] = useState({ study: true, tournaments: true });
  const both = kept.study && kept.tournaments;
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} id="outcome" className="gap-section gap-outcome" aria-labelledby="gap-outcome-title">
      <GapLines />
      <div className="gap-inner">
        <GapHead
          eyebrow="Expected outcome"
          id="gap-outcome-title"
          title={
            <>
              Where could you be
              <br />
              in 12 months?
            </>
          }
        />

        <div className="gap-outcome__card" data-reveal>
          <div className="gap-outcome__controls">
            <div className="gap-outcome__rating">
              <div className="gap-outcome__label">
                <label htmlFor="gap-rating">Current FIDE rating</label>
                <output htmlFor="gap-rating">{rating}</output>
              </div>
              <input
                id="gap-rating"
                type="range"
                min={RATING_MIN}
                max={RATING_MAX}
                step={10}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                style={{ "--fill": `${((rating - RATING_MIN) / (RATING_MAX - RATING_MIN)) * 100}%` } as CSSProperties}
              />
              <p className="gap-outcome__ends" aria-hidden="true">
                <span>{RATING_MIN}</span>
                <span>{RATING_MAX}</span>
              </p>
            </div>

            <fieldset className="gap-outcome__commit">
              <legend>You commit to</legend>
              {COMMITMENTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="gap-check"
                  aria-pressed={kept[c.id]}
                  onClick={() => setKept((k) => ({ ...k, [c.id]: !k[c.id] }))}
                >
                  <span className="gap-check__box">
                    <Check />
                  </span>
                  {c.label}
                </button>
              ))}
            </fieldset>
          </div>

          <div className="gap-outcome__panel">
            <span className="gap-outcome__checker" aria-hidden="true" />
            <p className="gap-kicker gap-kicker--dark">Projected rating</p>
            <p className="gap-outcome__numbers">
              <span className="gap-outcome__now">{rating}</span>
              <svg
                className="gap-outcome__arrow"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-label="to"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className={`gap-outcome__next${both ? "" : " is-off"}`}>{both ? `${rating + RATING_GAIN}+` : "?"}</span>
            </p>
            <div className="gap-outcome__track" aria-hidden="true">
              <span className="gap-outcome__track-now" style={{ width: trackPct(rating) }} />
              <span className="gap-outcome__track-gain" style={{ left: trackPct(rating), width: both ? gainPct : "0%" }} />
            </div>
            <p className="gap-outcome__note">
              {both
                ? `That’s the ${RATING_GAIN}+ point target GAP is built around, from ${rating} to ${rating + RATING_GAIN} or beyond.`
                : `The ${RATING_GAIN}+ target assumes both commitments. Consistency is what moves the rating.`}
            </p>
            <p className="gap-outcome__fine">
              *Based on the K40 factor. Results vary with age, starting rating, discipline and tournament performance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
