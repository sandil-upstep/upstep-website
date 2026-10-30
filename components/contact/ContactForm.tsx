"use client";

import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Button from "../common/Button";
import { useTouched } from "../DemoBookingFields";
import { isEmail, isName } from "../demoBookingData";

// The Contact Us page's message form: name, phone, an optional email and
// message. Errors show the way the demo drawer's do (useTouched): once a field
// is left, or all of them on a failed submit.

type Fields = { firstName: string; lastName: string; phone: string; email: string; message: string };
type Message = Fields;

const EMPTY: Fields = { firstName: "", lastName: "", phone: "", email: "", message: "" };

// TODO: a stand-in until the contact API exists. Resolves once it's sent.
function sendContactMessage(message: Message): Promise<void> {
  void message;
  return new Promise((resolve) => setTimeout(resolve, 900));
}

// 7 to 15 digits, as typed: spaces, dashes, brackets and a leading + allowed.
const isPhone = (v: string) => /^\+?[\d\s()-]+$/.test(v) && /^\d{7,15}$/.test(v.replace(/\D/g, ""));

function problems(f: Fields) {
  const first = f.firstName.trim();
  const last = f.lastName.trim();
  const phone = f.phone.trim();
  const email = f.email.trim();
  const out = {
    firstName: !first ? "Add your first name" : !isName(first) ? "Use letters only" : "",
    lastName: !last ? "Add your last name" : !isName(last) ? "Use letters only" : "",
    phone: !phone ? "Add a phone number" : !isPhone(phone) ? "Enter a valid phone number" : "",
    email: email && !isEmail(email) ? "Enter a valid email" : "",
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v)) as Partial<typeof out>;
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`contact-field${error ? " is-error" : ""}`}>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <p className="contact-field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function ContactForm() {
  const [f, setF] = useState<Fields>(EMPTY);
  const [tried, setTried] = useState(false);
  const { touch, clear: clearTouched, shown } = useTouched<keyof Fields>();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null); // the sender's first name
  const formRef = useRef<HTMLFormElement>(null);

  const errors = useMemo(() => problems(f), [f]);
  const valid = Object.keys(errors).length === 0;
  const err: Partial<Record<keyof Fields, string>> = shown(errors, tried);
  const set = (k: keyof Fields) => (e: { target: { value: string } }) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  // What each input shares: its error wiring and leaving.
  const wire = (k: keyof Fields, required = true) => ({
    id: `contact-${k}`,
    name: k,
    value: f[k],
    onChange: set(k),
    onBlur: touch(k),
    "aria-required": required,
    "aria-invalid": !!err[k],
    "aria-describedby": err[k] ? `contact-${k}-error` : undefined,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!valid) {
      setTried(true);
      // The first field to fix, once its error has rendered.
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    const clean = (v: string) => v.trim().replace(/\s+/g, " ");
    const message: Message = {
      firstName: clean(f.firstName),
      lastName: clean(f.lastName),
      phone: f.phone.trim(),
      email: f.email.trim(),
      message: f.message.trim(),
    };
    setBusy(true);
    setFailed(false);
    sendContactMessage(message).then(
      () => {
        setBusy(false);
        setSentTo(message.firstName);
      },
      () => {
        setBusy(false);
        setFailed(true);
      }
    );
  };

  const reset = () => {
    setF(EMPTY);
    setTried(false);
    clearTouched();
    setSentTo(null);
  };

  if (sentTo)
    return (
      <div className="contact-done" role="status">
        <h2 className="contact-card__title">Thanks, {sentTo}. We’ve got your message.</h2>
        <p>Our team will get back to you soon.</p>
        <button type="button" className="contact-done__again" onClick={reset}>
          Send another message
        </button>
      </div>
    );

  return (
    <form ref={formRef} className="contact-form" noValidate onSubmit={submit}>
      <h2 className="contact-card__title">Make the 1st move of your child’s chess journey with Upstep Academy!</h2>
      <div className="contact-form__row">
        <Field id="contact-firstName" label="First name" error={err.firstName}>
          <input {...wire("firstName")} placeholder="First Name*" autoComplete="given-name" maxLength={60} />
        </Field>
        <Field id="contact-lastName" label="Last name" error={err.lastName}>
          <input {...wire("lastName")} placeholder="Last Name*" autoComplete="family-name" maxLength={60} />
        </Field>
      </div>
      <Field id="contact-phone" label="Phone number" error={err.phone}>
        <input {...wire("phone")} type="tel" inputMode="tel" placeholder="Phone Number*" autoComplete="tel" maxLength={20} />
      </Field>
      <Field id="contact-email" label="Email (optional)" error={err.email}>
        <input {...wire("email", false)} type="email" placeholder="Email" autoComplete="email" maxLength={254} />
      </Field>
      <Field id="contact-message" label="Comment or message (optional)">
        <textarea {...wire("message", false)} placeholder="Comment or Message" rows={5} maxLength={2000} />
      </Field>
      {failed && (
        <p className="contact-field__error" role="alert">
          We couldn’t send your message. Please try again.
        </p>
      )}
      <Button type="submit" size="lg" fullWidth disabled={busy}>
        {busy ? "Sending…" : "Submit"}
      </Button>
    </form>
  );
}
