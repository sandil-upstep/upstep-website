import Image from "next/image";
import Button from "./common/Button";
import type { ButtonProps } from "./common/Button";

// Pieces shared by the demo booking drawer (DemoBookingDrawer.tsx) and the
// confirmation page it opens (DemoConfirmed.tsx). Styled in demoBooking.scss.

export const STEPS = [
  { id: "details", label: "Your details" },
  { id: "slot", label: "Demo slots" },
  { id: "done", label: "Confirmed" },
] as const;

// cur: the index of the current step (STEPS.length once they're all done).
export function Stepper({ cur }: { cur: number }) {
  return (
    <ol className="demo-steps" aria-label="Booking steps">
      {STEPS.map((s, i) => {
        const state = i < cur ? "done" : i === cur ? "current" : "todo";
        return (
          <li key={s.id} className={`demo-steps__item is-${state}`} aria-current={state === "current" ? "step" : undefined}>
            <span className="demo-steps__dot">
              {state === "done" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-label="Done"
                >
                  <path d="M19 7 9.5 16.5 5 12" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span className="demo-steps__label">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Illustration() {
  return (
    <div className="demo-illustration" aria-hidden="true">
      {/* TODO: cut from the design mockup as a stand-in; swap in the exported original. */}
      <Image src="/images/demo-booking/bd-img.png" width={451} height={445} alt="" />
    </div>
  );
}

export function Arrow() {
  return (
    <svg
      className="demo-arrow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// The site's orange button with its offset outline, as in the designs; `dim`
// fades it while there's still something to fill in.
export function Cta({ dim, ...props }: { dim?: boolean } & ButtonProps) {
  return (
    <span className={`demo-cta${dim ? " is-dim" : ""}`}>
      <span className="demo-cta__outline" aria-hidden="true" />
      <Button {...props} className="demo-cta__btn" />
    </span>
  );
}
