"use client";

import { useState } from "react";
import Button from "../common/Button";
import { openDemoBooking } from "../demoBooking";
import { Arrow, Cta } from "../DemoBookingParts";
import { useGap } from "./GapContext";
import { GapHead, GapLines, useReveal } from "./GapParts";
import {
  ELIGIBILITY,
  FEES,
  FIDE_DISCOUNT,
  MONTHS,
  PLATFORMS,
  eligibility,
  feeFor,
  money,
  ratingHint,
  type Currency,
  type Platform,
} from "./gapData";
import "./gapFees.scss";

// Fees and eligibility: the year's fee (in the visitor's currency, less the
// FIDE player's discount) on the navy card, and beside it a check of the
// player's rating against GAP's range, pointing to the form or a free demo.
export default function GapFees() {
  const { currency, setCurrency, fide, setFide, goToRegister } = useGap();
  const [platform, setPlatform] = useState<Platform>("FIDE");
  const [rating, setRating] = useState("");
  const ref = useReveal<HTMLElement>();
  const price = feeFor(currency, fide);
  const result = eligibility(platform, rating);
  const verdict = ELIGIBILITY[result];

  return (
    <section ref={ref} id="fees" className="gap-section gap-fees" aria-labelledby="gap-fees-title">
      <GapLines />
      <div className="gap-inner">
        <GapHead
          eyebrow="Fee structure"
          id="gap-fees-title"
          title={
            <>
              Fees &amp;
              <br />
              eligibility
            </>
          }
        />

        <div className="gap-fees__body" data-reveal-group>
          <div className="gap-fee">
            <span className="gap-fee__checker" aria-hidden="true" />
            <div className="gap-fee__top">
              <p className="gap-kicker gap-kicker--dark">{MONTHS} months · limited seats</p>
              <div className="gap-seg gap-seg--dark" role="group" aria-label="Currency">
                {(Object.keys(FEES) as Currency[]).map((c) => (
                  <button key={c} type="button" className="gap-seg__opt" aria-pressed={currency === c} onClick={() => setCurrency(c)}>
                    {FEES[c].label}
                  </button>
                ))}
              </div>
            </div>

            <div aria-live="polite">
              <p className="gap-fee__value">
                Program value <del>{money(FEES[currency].value, currency)}</del>
              </p>
              <p className="gap-fee__price">
                <span className="gap-fee__amount">{money(price, currency)}</span>
                <span className="gap-fee__for">for {MONTHS} months</span>
              </p>
              <p className="gap-fee__month">About {money(price / MONTHS, currency)} a month</p>
            </div>

            <button type="button" role="switch" aria-checked={fide} className="gap-switch" onClick={() => setFide(!fide)}>
              <span className="gap-switch__track" aria-hidden="true" />
              <span>
                I’m a FIDE-rated player, so take <b>{FIDE_DISCOUNT * 100}% off</b>
              </span>
            </button>

            <div className="gap-fee__cta">
              <Cta onClick={goToRegister}>
                Reserve my seat <Arrow />
              </Cta>
            </div>
          </div>

          <div id="eligibility" className="gap-elig">
            <p className="gap-kicker">Eligibility check</p>
            <h3 className="gap-elig__title">Do you qualify?</h3>
            <div className="gap-seg gap-elig__seg" role="group" aria-label="Your rating is from">
              {PLATFORMS.map((p) => (
                <button key={p} type="button" className="gap-seg__opt" aria-pressed={platform === p} onClick={() => setPlatform(p)}>
                  {p}
                </button>
              ))}
            </div>
            <div className="gap-elig__field">
              <label htmlFor="gap-elig-rating">{ratingHint(platform)}</label>
              <div className={`demo-field${rating ? " is-filled" : ""}`}>
                <input
                  id="gap-elig-rating"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="e.g. 1520"
                  maxLength={4}
                  value={rating}
                  onChange={(e) => setRating(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
            </div>
            <div className={`gap-elig__result is-${result}`} role="status">
              <p className="gap-elig__verdict">{verdict.title}</p>
              <p>{verdict.body}</p>
              {verdict.next && (
                <Button size="sm" onClick={verdict.next === "register" ? goToRegister : openDemoBooking}>
                  {verdict.nextLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
