import type { ReactNode } from "react";
import { COUNTRIES, countryFor } from "./demoBookingData";

// Form fields shared by the demo booking drawer (DemoBookingDrawer.tsx) and
// the GAP registration form (gap/GapRegister.tsx). Styled in demoBooking.scss.
// A field that opens a list (PopField, PhoneField's country code) is wrapped
// in [data-pop={name}], so its owner can close the list on a click outside.

function ChevronCircle() {
  return (
    <svg className="demo-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="m6.8 8.6 3.2 3.2 3.2-3.2" stroke="#1b1b1b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FieldError({ id, text }: { id: string; text: string | false | undefined }) {
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

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  optional,
  type = "text",
  maxLength,
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
  maxLength?: number;
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
          maxLength={maxLength}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <FieldError id={id} text={error} />
    </div>
  );
}

// A field that opens a list under it (age, chess level, region).
export function PopField({
  name,
  open,
  onToggle,
  label,
  value,
  error,
  children,
}: {
  name: string;
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

export function PhoneField({
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
  name: string;
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
  const cc = countryFor(code);
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
          maxLength={20}
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
