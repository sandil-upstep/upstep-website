"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { onOpenDemoBooking } from "./demoBooking";
import { Arrow, Cta, Illustration, STEPS, Stepper } from "./DemoBookingParts";
import {
  AGES,
  COUNTRIES,
  DEMO_MINUTES,
  EMPTY_DETAILS,
  LEVELS,
  MONTHS,
  bookDemo,
  dayKey,
  dayLong,
  dayShort,
  detectZone,
  newBookingId,
  sameDay,
  saveBooking,
  slotsOn,
  timeLabel,
  validate,
  wallClock,
  weekday,
  zoneLabel,
  zoneShort,
  type Day,
  type Details,
  type Slot,
  type Zone,
} from "./demoBookingData";
import { getLenis } from "./SmoothScroll";
import "./demoBooking.scss";

// The "Book a FREE demo" drawer: a sheet that slides up over the page with
// the child's and parent's details, then a date and time (held for HOLD_MS
// once picked). Confirming opens the confirmation page in a new tab
// (DemoConfirmed.tsx) and closes the drawer once the booking has gone through.
// Ported from the "Demo booking flow revamp" reference (behaviour) and the
// "book a demo drawer" designs (CTA-1-1 for the details, CTA-2/CTA-3 for the
// date and time). Opened with openDemoBooking() (demoBooking.ts).

type Step = "details" | "slot";
type Pop = "age" | "level" | "code" | "code2" | "tz";
const HOLD_MS = 10 * 60e3;
const LEAVE_MS = 230; // a step fading out before the next comes in
const CLOSE_MS = 450;

const NEEDS = [
  { icon: "/images/structured/books.webp", w: 218, h: 177, label: "Willingness to learn & play chess", wide: true },
  { icon: "/images/book-demo/device.png", w: 92, h: 74, label: "A Device" },
  { icon: "/images/demo-booking/zoom.png", w: 24, h: 15, label: "Online, on Zoom" },
  { icon: "/images/book-demo/clock.png", w: 82, h: 80, label: "20 minutes" },
  { icon: "/images/book-demo/age.png", w: 64, h: 66, label: "Age 4 to 16" },
];

const reduceMotion = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function DemoBookingDrawer() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const timers = useRef<number[]>([]);

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [leaving, setLeaving] = useState(false);

  const [f, setF] = useState<Details>(EMPTY_DETAILS);
  const [tried, setTried] = useState(false);
  const [showPhone2, setShowPhone2] = useState(false);
  const [pop, setPop] = useState<Pop | null>(null);
  const [q, setQ] = useState("");

  const [zones, setZones] = useState<Zone[]>([]);
  const [zone, setZone] = useState<Zone | null>(null);
  const [detected, setDetected] = useState(false);
  const [openedAt, setOpenedAt] = useState(0); // availability is worked out from when the drawer opened
  const [now, setNow] = useState(0);
  const [month, setMonth] = useState(0); // 0 = this month, 1 = the next
  const [selDay, setSelDay] = useState<Day | null>(null);
  const [selSlot, setSelSlot] = useState<number | null>(null);
  const [holdUntil, setHoldUntil] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, reduceMotion() ? 0 : ms));
  }, []);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const reset = useCallback(() => {
    setStep("details");
    setF((prev) => ({ ...EMPTY_DETAILS, code: prev.code, code2: prev.code }));
    setTried(false);
    setShowPhone2(false);
    setMonth(0);
    setSelDay(null);
    setSelSlot(null);
    setHoldUntil(null);
    setSubmitting(false);
    setFailed(false);
  }, []);

  // ---- Opening and closing ----
  const zoneFound = useRef(false);
  useEffect(
    () =>
      onOpenDemoBooking(() => {
        returnFocus.current = document.activeElement;
        // The visitor's time zone, and their country for the phone code.
        if (!zoneFound.current) {
          zoneFound.current = true;
          const d = detectZone();
          setZones(d.zones);
          setZone(d.zone);
          setDetected(d.detected);
          if (d.zone.country) setF((prev) => ({ ...prev, code: d.zone.country, code2: d.zone.country }));
        }
        setOpenedAt(Date.now());
        setNow(Date.now());
        setClosing(false);
        setOpen(true);
      }),
    [],
  );

  // On shorter windows the details step's spacing gives way (fit() in
  // demoBooking.scss) so it all shows in the sheet without scrolling: --fit is
  // the share of the designs' spacing there's room for, 1 down to 0.
  const fitDetails = useCallback(() => {
    const dialog = dialogRef.current;
    const panel = dialog?.querySelector<HTMLElement>(".demo-drawer__panel");
    const details = panel?.querySelector<HTMLElement>(".demo-details");
    if (!dialog?.open || !panel || !details) return;
    const heightAt = (fit: number) => {
      details.style.setProperty("--fit", String(fit));
      return details.getBoundingClientRect().height;
    };
    const tight = heightAt(0);
    const full = heightAt(1);
    const room = dialog.clientHeight - panel.offsetTop - 1; // a pixel spare for rounding
    if (full > tight) details.style.setProperty("--fit", String(Math.min(1, Math.max(0, (room - tight) / (full - tight)))));
  }, []);
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", fitDetails);
    return () => window.removeEventListener("resize", fitDetails);
  }, [open, fitDetails]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog || dialog.open) return;
    dialog.showModal();
    fitDetails();
    dialog.scrollTop = 0;
    headingRef.current?.focus({ preventScroll: true });
    // The page stays put underneath.
    getLenis()?.stop();
    document.documentElement.classList.add("demo-drawer-lock");
  }, [open]);

  const finishClose = useCallback(() => {
    dialogRef.current?.close();
    getLenis()?.start();
    document.documentElement.classList.remove("demo-drawer-lock");
    setOpen(false);
    setClosing(false);
    setPop(null);
    const el = returnFocus.current as HTMLElement | null;
    if (el?.isConnected) el.focus({ preventScroll: true });
  }, []);

  const close = useCallback(() => {
    if (!open || closing) return;
    setClosing(true);
    setPop(null);
    later(finishClose, CLOSE_MS);
  }, [open, closing, finishClose, later]);

  useEffect(
    () => () => {
      getLenis()?.start();
      document.documentElement.classList.remove("demo-drawer-lock");
    },
    [],
  );

  // ---- Steps ----
  const go = (next: Step, after?: () => void) => {
    setLeaving(true);
    setPop(null);
    later(() => {
      setStep(next);
      setLeaving(false);
      after?.();
      dialogRef.current?.scrollTo({ top: 0 });
    }, LEAVE_MS);
  };
  // Each step's heading takes the focus as it comes in.
  useEffect(() => {
    if (dialogRef.current?.open) headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const errors = useMemo(() => validate(f), [f]);
  const valid = Object.keys(errors).length === 0;
  const err = tried ? errors : {};
  const set = (k: keyof Details) => (v: string) => setF((prev) => ({ ...prev, [k]: v }));
  // Fitted again as the step comes in, and as rows or error lines come and go.
  const errKey = Object.keys(err).join();
  useLayoutEffect(() => fitDetails(), [fitDetails, step, showPhone2, errKey]);

  const goSlot = () => {
    if (!valid) {
      setTried(true);
      // The first field to fix, once its error has rendered.
      requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("[aria-invalid='true'], [data-invalid]")?.focus());
      return;
    }
    go("slot");
  };

  // ---- Calendar ----
  // The month shown, in the chosen zone's calendar.
  const base = useMemo(() => {
    if (!zone || !openedAt) return null;
    const today = wallClock(openedAt, zone).day;
    return { y: today.y + Math.floor((today.m + month) / 12), m: (today.m + month) % 12 };
  }, [zone, openedAt, month]);
  // Every open slot that month, by day.
  const monthSlots = useMemo(() => {
    const out = new Map<string, Slot[]>();
    if (!zone || !base) return out;
    const dim = new Date(Date.UTC(base.y, base.m + 1, 0)).getUTCDate();
    for (let d = 1; d <= dim; d++) {
      const day = { y: base.y, m: base.m, d };
      out.set(dayKey(day), slotsOn(day, zone, openedAt));
    }
    return out;
  }, [zone, openedAt, base]);
  const daySlots = useMemo(() => (selDay && zone ? slotsOn(selDay, zone, openedAt) : []), [selDay, zone, openedAt]);
  const slotWall = selSlot != null && zone ? wallClock(selSlot, zone) : null;

  const pickDay = (day: Day) => {
    setSelDay(day);
    if (!slotWall || !sameDay(slotWall.day, day)) {
      setSelSlot(null);
      setHoldUntil(null);
    }
  };
  const pickSlot = useCallback((at: number) => {
    const t = Date.now();
    setSelSlot(at);
    setHoldUntil(t + HOLD_MS);
    setNow(t);
  }, []);
  const pickZone = (z: Zone) => {
    setZone(z);
    setPop(null);
    // The picked time stays; its day may move in the new zone's calendar.
    if (selSlot != null) setSelDay(wallClock(selSlot, z).day);
  };

  // The hold's countdown.
  useEffect(() => {
    if (!open || step !== "slot" || holdUntil == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open, step, holdUntil]);
  const holdLeft = holdUntil == null ? 0 : Math.max(0, Math.ceil((holdUntil - now) / 1000));

  const submit = () => {
    if (selSlot == null || submitting || !zone) return;
    if (!valid) return go("details", () => setTried(true));
    const { firstName, lastName, age, level, email } = f;
    const summary = { firstName, lastName, age, level, email, slot: selSlot, timeZone: zone.id };
    const id = newBookingId();
    const url = `/book-demo/confirmed?id=${id}`;
    saveBooking(id, { status: "pending" });
    // Opened now, inside the click, so pop-up blockers let it through; it
    // shows the booking going through until this tab says how it went.
    const tab = window.open(url, "_blank");
    if (tab) tab.opener = null;
    setSubmitting(true);
    setFailed(false);
    setPop(null);
    bookDemo({ ...f, slot: selSlot, timeZone: zone.id }).then(
      () => {
        saveBooking(id, { status: "booked", booking: summary });
        // Pop-ups blocked: the confirmation opens here instead.
        if (!tab) return router.push(url);
        // A finished booking starts afresh next time.
        close();
        later(reset, CLOSE_MS);
      },
      () => {
        saveBooking(id, { status: "failed" });
        tab?.close();
        setSubmitting(false);
        setFailed(true);
      }
    );
  };

  // ---- Popovers: one open at a time; a click elsewhere or Escape closes it ----
  useEffect(() => {
    if (!pop) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target;
      if (!(t instanceof Element) || !t.closest(`[data-pop="${pop}"]`)) setPop(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [pop]);
  const toggle = (p: Pop) => {
    setQ("");
    setPop((cur) => (cur === p ? null : p));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape" || !pop) return;
    // Escape closes the open list first, not the drawer.
    e.preventDefault();
    e.stopPropagation();
    dialogRef.current?.querySelector<HTMLElement>(`[data-pop="${pop}"] [aria-expanded]`)?.focus();
    setPop(null);
  };

  const cur = STEPS.findIndex((s) => s.id === step);
  const tzShort = zone ? zoneShort(zone, selSlot ?? openedAt) : "";

  return (
    <dialog
      ref={dialogRef}
      className={`demo-drawer is-${step}${closing ? " is-closing" : ""}`}
      aria-labelledby="demo-drawer-title"
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        // A click on the backdrop, outside the sheet.
        if (e.target === e.currentTarget) close();
      }}
    >
      {open && (
        <div className="demo-drawer__panel">
          <div className="demo-drawer__deco" aria-hidden="true">
            <span className="demo-drawer__checks" />
            <span className="demo-drawer__corner" />
          </div>
          <button type="button" className="demo-drawer__close" aria-label="Close" onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 5l14 14M19 5 5 19" />
            </svg>
          </button>

          <div className={`demo-drawer__body${leaving ? " is-leaving" : ""}`} key={step}>
            {step === "details" && (
              <div className="demo-details">
                <div className="demo-main">
                  <Stepper cur={cur} />
                  <h2 ref={headingRef} tabIndex={-1} className="demo-title" id="demo-drawer-title">
                    Tell us about your child
                  </h2>
                  <p className="demo-sub">So we can match the right coach. It takes about a minute.</p>

                  <form
                    id="demo-details-form"
                    className="demo-card demo-form"
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      goSlot();
                    }}
                  >
                    <span className="demo-cube demo-cube--form" aria-hidden="true" />
                    <fieldset className="demo-form__group">
                      <legend className="demo-form__legend">Your child’s details*</legend>
                      <div className="demo-form__row">
                        <TextField
                          id="demo-first"
                          label="First Name"
                          value={f.firstName}
                          onChange={set("firstName")}
                          error={err.firstName && "Add a first name"}
                          autoComplete="off"
                        />
                        <TextField
                          id="demo-last"
                          label="Last Name"
                          optional
                          value={f.lastName}
                          onChange={set("lastName")}
                          autoComplete="off"
                        />
                      </div>
                      <div className="demo-form__row">
                        <PopField
                          name="age"
                          open={pop === "age"}
                          onToggle={() => toggle("age")}
                          label="Select Age"
                          value={f.age && `${f.age} years`}
                          error={err.age && "Pick an age"}
                        >
                          <div className="demo-pop demo-pop--ages" role="group" aria-label="Child’s age">
                            <span className="demo-pop__title">Child’s age</span>
                            <div className="demo-pop__grid">
                              {AGES.map((a) => (
                                <button
                                  key={a}
                                  type="button"
                                  className="demo-chip"
                                  aria-pressed={f.age === a}
                                  onClick={() => {
                                    set("age")(a);
                                    setPop(null);
                                  }}
                                >
                                  {a}
                                </button>
                              ))}
                            </div>
                          </div>
                        </PopField>
                        <PopField
                          name="level"
                          open={pop === "level"}
                          onToggle={() => toggle("level")}
                          label="Chess Level"
                          value={f.level}
                          error={err.level && "Pick the closest match. There are no wrong answers."}
                        >
                          <div className="demo-pop demo-pop--list" role="group" aria-label="How much chess do they know?">
                            {LEVELS.map((l) => (
                              <button
                                key={l.label}
                                type="button"
                                className="demo-option"
                                aria-pressed={f.level === l.label}
                                onClick={() => {
                                  set("level")(l.label);
                                  setPop(null);
                                }}
                              >
                                <span className="demo-option__label">{l.label}</span>
                                <span className="demo-option__sub">{l.sub}</span>
                              </button>
                            ))}
                          </div>
                        </PopField>
                      </div>
                    </fieldset>

                    <hr className="demo-form__rule" />

                    <fieldset className="demo-form__group">
                      <legend className="demo-form__legend">How to reach you?*</legend>
                      <div className="demo-form__row">
                        <TextField
                          id="demo-parent"
                          label="Parent’s Name"
                          value={f.parentName}
                          onChange={set("parentName")}
                          error={err.parentName && "Add your name"}
                          autoComplete="name"
                        />
                        <TextField
                          id="demo-email"
                          label="Email address"
                          type="email"
                          value={f.email}
                          onChange={set("email")}
                          error={err.email && "Enter a valid email for the Zoom link"}
                          autoComplete="email"
                        />
                      </div>
                      <div className="demo-form__row demo-form__row--phone">
                        <PhoneField
                          id="demo-phone"
                          name="code"
                          label="Whatsapp Number"
                          code={f.code}
                          value={f.phone}
                          onCode={set("code")}
                          onChange={set("phone")}
                          open={pop === "code"}
                          onToggle={() => toggle("code")}
                          q={q}
                          onQ={setQ}
                          close={() => setPop(null)}
                          error={err.phone && "Enter a valid phone number"}
                        />
                        {!showPhone2 && (
                          <button type="button" className="demo-add" onClick={() => setShowPhone2(true)}>
                            <svg
                              viewBox="0 0 20 20"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              aria-hidden="true"
                            >
                              <circle cx="10" cy="10" r="8.2" />
                              <path d="M10 6.2v7.6M6.2 10h7.6" />
                            </svg>
                            Add Another Number
                          </button>
                        )}
                      </div>
                      {showPhone2 && (
                        <div className="demo-form__row demo-form__row--phone">
                          <PhoneField
                            id="demo-phone2"
                            name="code2"
                            label="Other Number"
                            optional
                            code={f.code2}
                            value={f.phone2}
                            onCode={set("code2")}
                            onChange={set("phone2")}
                            open={pop === "code2"}
                            onToggle={() => toggle("code2")}
                            q={q}
                            onQ={setQ}
                            close={() => setPop(null)}
                            autoFocus
                          />
                        </div>
                      )}
                    </fieldset>
                  </form>

                  <div className="demo-foot">
                    <p className="demo-consent">We only use these details to send your Zoom link and reminders.</p>
                    <Cta type="submit" form="demo-details-form" dim={!valid}>
                      Continue <Arrow />
                    </Cta>
                  </div>
                  <ul className="demo-trust">
                    <li>
                      <Image src="/images/demo-booking/shield.png" width={38} height={39} alt="" />
                      Trusted by families in 20+ countries
                    </li>
                    <li>
                      <Image src="/images/demo-booking/medal.png" width={32} height={39} alt="" />
                      Certified and inspired by GM Viswanathan Anand
                    </li>
                  </ul>
                </div>
                <Illustration />
              </div>
            )}

            {step === "slot" && zone && base && (
              <div className="demo-slot">
                <aside className="demo-info" aria-label="About the demo">
                  <span className="demo-cube demo-cube--info" aria-hidden="true" />
                  <span className="demo-info__blob" aria-hidden="true" />
                  <span className="demo-info__tag">Free · no card needed</span>
                  <h3 className="demo-info__title">1-on-1 chess demo class</h3>
                  <p className="demo-info__text">
                    The Objective of our chess demo class is to{" "}
                    <b>
                      assess your child’s Chess level, give you a live experience of our online chess classes, and also show you the format
                      in which chess is taught
                    </b>{" "}
                    online by our well-experienced coaches
                  </p>
                  <p className="demo-info__needs-title">All your kid needs is:</p>
                  <ul className="demo-info__needs">
                    {NEEDS.map((n) => (
                      <li key={n.label} className={n.wide ? "is-wide" : undefined}>
                        <Image src={n.icon} width={n.w} height={n.h} alt="" />
                        {n.label}
                      </li>
                    ))}
                  </ul>
                  <div className="demo-info__slot" aria-live="polite">
                    <span className="demo-info__slot-label">Your slot</span>
                    {slotWall ? (
                      <>
                        <span className="demo-info__slot-date">{dayLong(slotWall.day)}</span>
                        <span className="demo-info__slot-time">
                          {timeLabel(slotWall.minutes)} · {tzShort}
                        </span>
                        <span className="demo-info__hold">
                          <Image src="/images/demo-booking/hourglass.png" width={18} height={26} alt="" />
                          {holdLeft > 0 ? (
                            <span>
                              Held for you for{" "}
                              <b>{`${String(Math.floor(holdLeft / 60)).padStart(2, "0")}:${String(holdLeft % 60).padStart(2, "0")}`}</b>
                            </span>
                          ) : (
                            <span>We’ve released the hold, but this time is still open. You can still book it.</span>
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="demo-info__slot-none">{selDay ? dayLong(selDay) : "Choose a date and time"}</span>
                    )}
                  </div>
                  <ul className="demo-info__trust">
                    <li>
                      <Image src="/images/demo-booking/shield.png" width={38} height={39} alt="" />
                      Trusted by families in 20+ countries.
                    </li>
                    <li>
                      <Image src="/images/demo-booking/medal.png" width={32} height={39} alt="" />
                      <span>
                        Certified and inspired by
                        <br />
                        GM Viswanathan Anand
                      </span>
                    </li>
                  </ul>
                </aside>

                <div className="demo-main">
                  <Stepper cur={cur} />
                  <h2 ref={headingRef} tabIndex={-1} className="demo-title" id="demo-drawer-title">
                    Pick a date &amp; time for your free demo
                  </h2>
                  <div className="demo-tz">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9.5" />
                      <path d="M12 2.5a14 14 0 0 0 0 19 14 14 0 0 0 0-19M2.5 12h19" />
                    </svg>
                    <span>Times shown in</span>
                    <div className="demo-pop-root" data-pop="tz">
                      <button type="button" className="demo-tz__btn" aria-expanded={pop === "tz"} onClick={() => toggle("tz")}>
                        {zoneLabel(zone, openedAt)}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      {pop === "tz" && (
                        <div className="demo-pop demo-pop--list demo-pop--tz" role="group" aria-label="Time zone">
                          {zones.map((z) => (
                            <button
                              key={z.id}
                              type="button"
                              className="demo-option"
                              aria-pressed={z.id === zone.id}
                              onClick={() => pickZone(z)}
                            >
                              <span className="demo-option__label">{zoneLabel(z, openedAt)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {detected && <span className="demo-tz__note">(detected automatically)</span>}
                  </div>

                  <div className="demo-cal-wrap">
                    <div className={`demo-card demo-cal${selDay ? " has-day" : ""}`}>
                      <span className="demo-cube demo-cube--cal-a" aria-hidden="true" />
                      <span className="demo-cube demo-cube--cal-b" aria-hidden="true" />
                      <div className="demo-cal__month">
                        <div className="demo-cal__head">
                          <span className="demo-cal__label" aria-live="polite">
                            {MONTHS[base.m]} {base.y}
                          </span>
                          <div className="demo-cal__nav">
                            <button type="button" aria-label="Previous month" disabled={month === 0} onClick={() => setMonth(0)}>
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m14.5 6-6 6 6 6" />
                              </svg>
                            </button>
                            <button type="button" aria-label="Next month" disabled={month === 1} onClick={() => setMonth(1)}>
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m9.5 6 6 6-6 6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="demo-cal__grid demo-cal__dow" aria-hidden="true">
                          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                            <span key={d}>{d}</span>
                          ))}
                        </div>
                        <div className="demo-cal__grid">
                          {Array.from({ length: (weekday({ ...base, d: 1 }) + 6) % 7 }, (_, i) => (
                            <span key={`lead-${i}`} />
                          ))}
                          {Array.from(monthSlots.entries()).map(([k, slots], i) => {
                            const day = { ...base, d: i + 1 };
                            const sel = sameDay(day, selDay);
                            const label = `${dayLong(day)}${slots.length ? `, ${slots.length} slots open` : ", no slots"}`;
                            return (
                              <span key={k} className="demo-cal__cell">
                                {slots.length || sel ? (
                                  <button
                                    type="button"
                                    className={`demo-day${sel ? " is-sel" : ""}`}
                                    aria-pressed={sel}
                                    aria-label={label}
                                    onClick={() => pickDay(day)}
                                  >
                                    {day.d}
                                  </button>
                                ) : (
                                  <span className="demo-day is-off">{day.d}</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                        <div className="demo-cal__legend">
                          <span className="is-open">Slots open</span>
                          <span className="is-sel">Selected</span>
                        </div>
                      </div>

                      <div className="demo-cal__times" aria-hidden={!selDay} inert={!selDay}>
                        {selDay && (
                          <div className="demo-times" key={dayKey(selDay)}>
                            <div className="demo-times__head">
                              <div>
                                <span className="demo-times__day">{dayShort(selDay)}</span>
                                <span className="demo-times__count">
                                  {daySlots.length} slots open <span aria-hidden="true">•</span> {DEMO_MINUTES} min each
                                </span>
                              </div>
                              <button
                                type="button"
                                className="demo-times__close"
                                aria-label="Close times"
                                onClick={() => {
                                  setSelDay(null);
                                  setSelSlot(null);
                                  setHoldUntil(null);
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                  <path d="M7 7l10 10M17 7 7 17" />
                                </svg>
                              </button>
                            </div>
                            <div className="demo-times__list">
                              {(
                                [
                                  ["Morning", (m: number) => m < 720],
                                  ["Afternoon", (m: number) => m >= 720 && m < 1020],
                                  ["Evening", (m: number) => m >= 1020],
                                ] as const
                              ).map(([name, test]) => {
                                const group = daySlots.filter((s) => test(s.minutes));
                                if (!group.length) return null;
                                return (
                                  <div key={name} className="demo-times__group" role="group" aria-label={name}>
                                    <span className="demo-times__name">{name}</span>
                                    <div className="demo-times__grid">
                                      {group.map((s) => (
                                        <button
                                          key={s.at}
                                          type="button"
                                          className="demo-time"
                                          aria-pressed={selSlot === s.at}
                                          onClick={() => pickSlot(s.at)}
                                        >
                                          {timeLabel(s.minutes)}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="demo-foot demo-foot--slot">
                    <button type="button" className="demo-back" onClick={() => go("details")}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M19 12H5M11 6l-6 6 6 6" />
                      </svg>
                      Back
                    </button>
                    {slotWall && (
                      <p className="demo-foot__slot">
                        {dayShort(slotWall.day)}, <b>{timeLabel(slotWall.minutes)}</b>
                      </p>
                    )}
                    <Cta onClick={submit} disabled={selSlot == null || submitting} dim={selSlot == null || submitting}>
                      {submitting ? (
                        <>
                          <span className="demo-spinner" aria-hidden="true" />
                          Booking your slot…
                        </>
                      ) : (
                        <>
                          Confirm My Free Demo <Arrow />
                        </>
                      )}
                    </Cta>
                  </div>
                  {failed && (
                    <p className="demo-error demo-foot__error" role="alert">
                      We couldn’t book that time. Please try again, or pick another slot.
                    </p>
                  )}
                </div>
                <Illustration />
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

function ChevronCircle() {
  return (
    <svg className="demo-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="m6.8 8.6 3.2 3.2 3.2-3.2" stroke="#1b1b1b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FieldError({ id, text }: { id: string; text: string | false | undefined }) {
  if (!text) return null;
  return (
    <p className="demo-error" id={`${id}-error`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 7.5v5M12 16.5h.01" />
      </svg>
      {text}
    </p>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  optional,
  type = "text",
  autoComplete,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | false;
  optional?: boolean;
  type?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="demo-form__cell">
      <div className={`demo-field${value ? " is-filled" : ""}${error ? " is-error" : ""}`}>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={label}
          aria-label={optional ? `${label} (optional)` : label}
          aria-required={!optional}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <FieldError id={id} text={error} />
    </div>
  );
}

// A field that opens a list under it (age, chess level).
function PopField({
  name,
  open,
  onToggle,
  label,
  value,
  error,
  children,
}: {
  name: Pop;
  open: boolean;
  onToggle: () => void;
  label: string;
  value: string;
  error?: string | false;
  children: ReactNode;
}) {
  const id = `demo-${name}`;
  return (
    <div className="demo-form__cell demo-pop-root" data-pop={name}>
      <button
        type="button"
        id={id}
        className={`demo-field demo-field--select${value ? " is-filled" : ""}${error ? " is-error" : ""}${open ? " is-active" : ""}`}
        aria-expanded={open}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-label={value ? `${label}: ${value}` : label}
        data-invalid={!!error || undefined}
        onClick={onToggle}
      >
        <span>{value || label}</span>
        <ChevronCircle />
      </button>
      {open && children}
      <FieldError id={id} text={error} />
    </div>
  );
}

function PhoneField({
  id,
  name,
  label,
  optional,
  code,
  value,
  onCode,
  onChange,
  open,
  onToggle,
  q,
  onQ,
  close,
  error,
  autoFocus,
}: {
  id: string;
  name: "code" | "code2";
  label: string;
  optional?: boolean;
  code: string;
  value: string;
  onCode: (iso: string) => void;
  onChange: (v: string) => void;
  open: boolean;
  onToggle: () => void;
  q: string;
  onQ: (v: string) => void;
  close: () => void;
  error?: string | false;
  autoFocus?: boolean;
}) {
  const cc = COUNTRIES.find((c) => c.iso === code) ?? COUNTRIES[0];
  const ql = q.trim().toLowerCase();
  const list = COUNTRIES.filter((c) => !ql || c.name.toLowerCase().includes(ql) || c.dial.includes(ql) || c.iso.toLowerCase() === ql);
  return (
    <div className="demo-form__cell demo-pop-root" data-pop={name}>
      <div className={`demo-field demo-field--phone${value ? " is-filled" : ""}${error ? " is-error" : ""}${open ? " is-active" : ""}`}>
        <button
          type="button"
          className="demo-code"
          aria-expanded={open}
          aria-label={`Country code: ${cc.name} ${cc.dial}`}
          onClick={onToggle}
        >
          {cc.iso} {cc.dial}
          <ChevronCircle />
        </button>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          value={value}
          placeholder={label}
          aria-label={optional ? `${label} (optional)` : label}
          aria-required={!optional}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete={optional ? "off" : "tel-national"}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {open && (
        <div className="demo-pop demo-pop--codes" role="group" aria-label="Country code">
          <label className="demo-pop__search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={q}
              onChange={(e) => onQ(e.target.value)}
              placeholder="Search country or code"
              aria-label="Search country or code"
              autoFocus
            />
          </label>
          <div className="demo-pop__scroll">
            {list.map((c) => (
              <button
                key={c.iso}
                type="button"
                className="demo-country"
                aria-pressed={c.iso === code}
                onClick={() => {
                  onCode(c.iso);
                  close();
                }}
              >
                <span className="demo-country__iso">{c.iso}</span>
                <span className="demo-country__name">{c.name}</span>
                <span className="demo-country__dial">{c.dial}</span>
              </button>
            ))}
            {!list.length && <span className="demo-pop__empty">No matches</span>}
          </div>
        </div>
      )}
      <FieldError id={id} text={error} />
    </div>
  );
}
