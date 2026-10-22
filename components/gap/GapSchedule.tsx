"use client";

import { useEffect, useMemo } from "react";
import { setCoverDark } from "../coverTheme";
import { zoneLabel } from "../demoBookingData";
import { useGap } from "./GapContext";
import { GapHead, GapLines, usePopover, useReveal } from "./GapParts";
import { BATCHES, DAYS, SESSION_MINUTES, SESSION_TYPES, batchFor, sessionTime, sessionsIn } from "./gapData";
import "./gapSchedule.scss";

// "Days & timings": the batch picked, as a week in the visitor's time zone
// (detected, and changeable with the demo drawer's zone list). The batch is
// shared with the registration form.
export default function GapSchedule() {
  const { zone, zones, setZone, now, ready, batch, setBatch } = useGap();
  const { pop, setPop, toggle } = usePopover<"gap-tz">();
  const ref = useReveal<HTMLElement>();
  const sessions = useMemo(() => sessionsIn(batch, zone, now), [batch, zone, now]);
  // Zone names come from the browser's Intl, so they're only shown once the
  // visitor's clock has been read (the server's could differ).
  const label = (z: typeof zone) => (ready ? zoneLabel(z, now) : z.region);

  // As the home page does for "Why we are #1" (AnandSliderPin): the page
  // turns navy once this section's top has scrolled 40% of the way up the
  // viewport, and back to white once the fees section reaches that line.
  useEffect(() => {
    const section = ref.current;
    const page = section?.closest(".gap");
    if (!section || !page) return;
    const next = document.getElementById("fees");
    const past = new Map<Element, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) past.set(entry.target, entry.isIntersecting);
        setCoverDark(page, "gap-schedule", Boolean(past.get(section) && !(next && past.get(next))));
      },
      { rootMargin: "0px 0px -40% 0px" }
    );
    observer.observe(section);
    if (next) observer.observe(next);
    return () => {
      observer.disconnect();
      setCoverDark(page, "gap-schedule", false);
    };
  }, [ref]);

  const tz = (
    <div className="gap-schedule__tz demo-pop-root" data-pop="gap-tz">
      <span aria-hidden="true">Show times in</span>
      <button
        type="button"
        className="demo-tz__btn"
        aria-expanded={pop === "gap-tz"}
        aria-label={`Times shown in ${label(zone)}. Change time zone`}
        onClick={() => toggle("gap-tz")}
      >
        {label(zone)}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {pop === "gap-tz" && (
        <div className="demo-pop demo-pop--list demo-pop--tz" role="group" aria-label="Time zone">
          {zones.map((z) => (
            <button
              key={z.id}
              type="button"
              className="demo-option"
              aria-pressed={z.id === zone.id}
              onClick={() => {
                setZone(z);
                setPop(null);
              }}
            >
              <span className="demo-option__label">{label(z)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section ref={ref} id="schedule" className="gap-section gap-schedule" aria-labelledby="gap-schedule-title">
      <GapLines />
      <div className="gap-inner">
        <GapHead
          eyebrow="Days & timings"
          id="gap-schedule-title"
          title={
            <>
              See your week,
              <br />
              in your time
            </>
          }
          aside={tz}
        />

        <div className="gap-schedule__batches" role="group" aria-label="Batch" data-reveal-group>
          {BATCHES.map((b) => (
            <button key={b.id} type="button" className="gap-batch" aria-pressed={batch === b.id} onClick={() => setBatch(b.id)}>
              <span className="gap-batch__text">
                <span className="gap-batch__name">{b.name}</span>
                <span className="gap-batch__note">{b.note}</span>
              </span>
              <span className="gap-batch__dot" aria-hidden="true" />
            </button>
          ))}
        </div>

        <ol className="gap-week" aria-label={`${batchFor(batch).name}, week at a glance`} data-reveal>
          {DAYS.map((name, d) => {
            const today = sessions.filter((s) => s.day === d);
            return (
              <li key={name} className={`gap-week__day${today.length ? " has-sessions" : ""}`}>
                <span className="gap-week__name">{name}</span>
                <div className="gap-week__slots">
                  {today.length ? (
                    today.map((s) => (
                      <p key={`${batch}-${zone.id}-${s.type}`} className={`gap-week__session gap-week__session--${s.type}`}>
                        <span>{SESSION_TYPES[s.type]}</span>
                        <b>{sessionTime(s)}</b>
                      </p>
                    ))
                  ) : (
                    <span className="gap-week__rest">No class</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="gap-schedule__note">
          Each session runs {SESSION_MINUTES} minutes. Times follow your time zone, daylight saving included.
        </p>
      </div>
    </section>
  );
}
