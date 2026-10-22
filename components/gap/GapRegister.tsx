"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { openDemoBooking } from "../demoBooking";
import { PhoneField, PopField, TextField, useTouched } from "../DemoBookingFields";
import { Arrow, Cta, Illustration } from "../DemoBookingParts";
import { countryFor, digitsLabel, isEmail, isName, nationalNumber, zoneShort } from "../demoBookingData";
import { useGap } from "./GapContext";
import { Check, GapHead, GapLines, usePopover, useReveal } from "./GapParts";
import { BATCHES, MONTHS, REGIONS, batchFor, currencyFor, feeFor, money, registerForGap, sessionShort, sessionsIn } from "./gapData";
import "./gapRegister.scss";

// The registration form: the student, how to reach the family, and the batch
// (shared with the schedule). Picking a region sets the WhatsApp number's
// country code and the currency the fees are shown in. The fields, their
// lists and the button are the demo drawer's, so the two forms behave alike.

type Fields = { name: string; email: string; region: string; code: string; phone: string };
type Pop = "gap-region" | "gap-code";
type Sent = { firstName: string; phone: string; batch: string };

const EMPTY: Fields = { name: "", email: "", region: "", code: "", phone: "" };

// Each field's problem, if it has one.
function problems(f: Fields, code: string) {
  const name = f.name.trim();
  const email = f.email.trim();
  const c = countryFor(code);
  const out = {
    name: !name ? "Add the student’s name" : !isName(name) ? "Use letters only" : name.length < 2 ? "Add the student’s full name" : "",
    email: !email ? "Add an email so we can reach you" : !isEmail(email) ? "Enter a valid email" : "",
    region: f.region ? "" : "Pick a region",
    phone: !f.phone.trim()
      ? "Add a WhatsApp number"
      : nationalNumber(f.phone, c) == null
        ? `Enter a valid number: ${digitsLabel(c)} for ${c.name}`
        : "",
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v)) as Partial<typeof out>;
}

export default function GapRegister() {
  const { batch, setBatch, zone, now, ready, currency, setCurrency, fide, country } = useGap();
  const [f, setF] = useState<Fields>(EMPTY);
  const [tried, setTried] = useState(false);
  const { touch, clear: clearTouched, shown } = useTouched<keyof Fields>();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const [q, setQ] = useState("");
  const { pop, setPop, toggle } = usePopover<Pop>();
  const ref = useReveal<HTMLElement>();
  const cardRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  // The visitor's own country code until one is picked.
  const code = f.code || country || "IN";
  const errors = useMemo(() => problems(f, code), [f, code]);
  const valid = Object.keys(errors).length === 0;
  const err = shown(errors, tried);
  const set = (k: keyof Fields) => (v: string) => setF((prev) => ({ ...prev, [k]: v }));

  // The confirmation takes the focus once it's shown.
  useEffect(() => {
    if (sent) doneRef.current?.focus();
  }, [sent]);

  const pickRegion = (region: (typeof REGIONS)[number]) => {
    setF((prev) => ({ ...prev, region: region.label, code: region.country || prev.code }));
    setCurrency(currencyFor(region.country));
    setPop(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!valid) {
      setTried(true);
      // The first field to fix, once its error has rendered.
      requestAnimationFrame(() => cardRef.current?.querySelector<HTMLElement>("[aria-invalid='true'], [data-invalid]")?.focus());
      return;
    }
    const c = countryFor(code);
    const phone = nationalNumber(f.phone, c) ?? "";
    const name = f.name.trim().replace(/\s+/g, " ");
    setBusy(true);
    setFailed(false);
    setPop(null);
    registerForGap({ name, email: f.email.trim(), region: f.region, code: c.iso, phone, batch, currency, fide }).then(
      () => {
        setBusy(false);
        setSent({ firstName: name.split(" ")[0], phone: `${c.dial} ${phone}`, batch: batchFor(batch).name });
      },
      () => {
        setBusy(false);
        setFailed(true);
      }
    );
  };

  const reset = () => {
    setF((prev) => ({ ...EMPTY, code: prev.code }));
    setTried(false);
    clearTouched();
    setFailed(false);
    setSent(null);
  };

  return (
    <section ref={ref} id="register" className="gap-section gap-register" aria-labelledby="gap-register-title">
      <GapLines />
      <div className="gap-inner">
        <GapHead
          eyebrow="Limited seats"
          id="gap-register-title"
          title={
            <>
              Claim your seat
              <br />
              in GAP
            </>
          }
          lead="Takes a minute. We’ll confirm eligibility and your batch on WhatsApp."
        />

        <div className="gap-register__layout">
          <div className="gap-register__main" data-reveal>
            <div ref={cardRef} className="demo-card gap-register__card">
              <span className="demo-cube gap-register__cube" aria-hidden="true" />
              {sent ? (
                <div className="gap-register__done" role="status">
                  <span className="gap-register__tick" aria-hidden="true">
                    <Check />
                  </span>
                  <h3 ref={doneRef} tabIndex={-1} data-register-focus className="gap-register__title">
                    You’re in the queue, {sent.firstName}
                  </h3>
                  <p className="gap-register__text">
                    We’ll message <b>{sent.phone}</b> on WhatsApp to confirm eligibility and your seat in {sent.batch}.
                  </p>
                  <button type="button" className="gap-link" onClick={reset}>
                    Register another student
                  </button>
                </div>
              ) : (
                <form id="gap-register-form" className="demo-form gap-register__form" noValidate onSubmit={submit}>
                  <p className="gap-register__fee">
                    <span className="gap-register__pulse" aria-hidden="true" />
                    {money(feeFor(currency, fide), currency)} · {MONTHS} months · limited seats
                  </p>
                  <h3 tabIndex={-1} data-register-focus className="gap-register__title">
                    Register for GAP
                  </h3>

                  <fieldset className="demo-form__group">
                    <legend className="demo-form__legend">About the student*</legend>
                    <div className="demo-form__row">
                      <TextField
                        id="gap-name"
                        label="Student’s name"
                        value={f.name}
                        onChange={set("name")}
                        error={err.name}
                        onLeave={touch("name")}
                        maxLength={80}
                        autoComplete="off"
                      />
                      <PopField
                        name="gap-region"
                        open={pop === "gap-region"}
                        onToggle={() => toggle("gap-region")}
                        label="Region"
                        value={f.region}
                        error={err.region}
                        onLeave={touch("region")}
                      >
                        <div className="demo-pop demo-pop--list" role="group" aria-label="Region">
                          {REGIONS.map((r) => (
                            <button
                              key={r.label}
                              type="button"
                              className="demo-option"
                              aria-pressed={f.region === r.label}
                              onClick={() => pickRegion(r)}
                            >
                              <span className="demo-option__label">{r.label}</span>
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
                        id="gap-email"
                        label="Parent’s email"
                        type="email"
                        value={f.email}
                        onChange={set("email")}
                        error={err.email}
                        onLeave={touch("email")}
                        maxLength={254}
                        autoComplete="email"
                      />
                      <PhoneField
                        id="gap-phone"
                        name="gap-code"
                        label="WhatsApp number"
                        code={code}
                        value={f.phone}
                        onCode={set("code")}
                        onChange={set("phone")}
                        open={pop === "gap-code"}
                        onToggle={() => {
                          setQ("");
                          toggle("gap-code");
                        }}
                        q={q}
                        onQ={setQ}
                        close={() => setPop(null)}
                        error={err.phone}
                        onLeave={touch("phone")}
                      />
                    </div>
                  </fieldset>

                  <hr className="demo-form__rule" />

                  <fieldset className="demo-form__group">
                    <legend className="demo-form__legend">
                      Preferred batch
                      {ready && <span className="gap-register__tz"> · times in {zoneShort(zone, now)}</span>}
                    </legend>
                    <div className="gap-register__batches">
                      {BATCHES.map((b) => (
                        <button key={b.id} type="button" className="gap-batch" aria-pressed={batch === b.id} onClick={() => setBatch(b.id)}>
                          <span className="gap-batch__text">
                            <span className="gap-batch__name">{b.name}</span>
                            <span className="gap-batch__note">{sessionsIn(b.id, zone, now).map(sessionShort).join(" · ")}</span>
                          </span>
                          <span className="gap-batch__dot" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </form>
              )}
            </div>

            {!sent && (
              <>
                <div className="demo-foot gap-register__foot">
                  <p className="demo-consent">We only use these details to confirm your seat and batch.</p>
                  <Cta type="submit" form="gap-register-form" disabled={busy} dim={!valid || busy}>
                    {busy ? (
                      <>
                        <span className="demo-spinner" aria-hidden="true" />
                        Registering…
                      </>
                    ) : (
                      <>
                        Register now <Arrow />
                      </>
                    )}
                  </Cta>
                </div>
                {failed && (
                  <p className="demo-error gap-register__error" role="alert">
                    We couldn’t send your registration. Please try again.
                  </p>
                )}
                <p className="gap-register__alt">
                  Not sure yet?{" "}
                  <button type="button" className="gap-link" onClick={openDemoBooking}>
                    Book a free demo class
                  </button>
                </p>
              </>
            )}
          </div>

          <div className="gap-register__art" aria-hidden="true">
            <Illustration />
          </div>
        </div>
      </div>
    </section>
  );
}
