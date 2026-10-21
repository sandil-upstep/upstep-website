"use client";

import { useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "./common/Button";
import { Cta, Illustration, STEPS, Stepper } from "./DemoBookingParts";
import {
  DEMO_MINUTES,
  bookingKey,
  cap,
  dayFull,
  readBooking,
  timeLabel,
  wallClock,
  zoneFor,
  zoneShort,
  type BookingSummary,
} from "./demoBookingData";
import "./demoBooking.scss";

// The demo booking's confirmation (CTA-4), on its own page: the drawer opens
// it in a new tab the moment "Confirm" is pressed, then hands it the booking
// through localStorage (see saveBooking in demoBookingData.ts). It shows the
// booking going through until then.

const EXPECT = [
  { title: "Say Hello", body: "The coach gets to know your child: their age, interests and how much chess they know." },
  { title: "Play and solve", body: "A short game and a few puzzles, pitched at the right level." },
  { title: "Get a plan", body: "You get their level and a suggested course. There’s no pressure to sign up." },
];

// The drawer's tab writes the booking; other tabs hear about it here.
const subscribe = (onChange: () => void) => {
  addEventListener("storage", onChange);
  return () => removeEventListener("storage", onChange);
};

export default function DemoConfirmed({ id }: { id: string | null }) {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return id ? localStorage.getItem(bookingKey(id)) : null;
      } catch {
        return null;
      }
    },
    () => undefined // not read yet: the server render and hydration
  );
  const record = useMemo(() => (raw === undefined ? undefined : readBooking(raw)), [raw]);

  return (
    <main className="demo-confirmed">
      <div className="demo-confirmed__deco" aria-hidden="true">
        <span className="demo-confirmed__checks" />
        <span className="demo-confirmed__corner" />
      </div>
      <header className="demo-done__bar">
        <Link href="/" aria-label="Upstep Academy home">
          <Image src="/images/main-logo.svg" width={227} height={65} alt="Upstep Academy" className="demo-done__logo" />
        </Link>
        <Button size="sm" className="demo-done__home" href="/">
          Go To Homepage
        </Button>
      </header>

      {record === undefined || record?.status === "pending" ? (
        <div className="demo-confirmed__status" role="status">
          <span className="demo-spinner" aria-hidden="true" />
          <h1>Booking your slot…</h1>
          <p>This only takes a moment.</p>
        </div>
      ) : record?.status === "booked" ? (
        <Booked booking={record.booking} />
      ) : (
        <div className="demo-confirmed__status" role="alert">
          <h1>{record?.status === "failed" ? "We couldn’t book that time" : "We couldn’t find this booking"}</h1>
          <p>
            {record?.status === "failed"
              ? "Nothing was booked. Go back to the tab you booked from and pick another slot."
              : "If you’ve just booked a demo, the details are on their way to your email."}
          </p>
          <Cta href="/">Go To Homepage</Cta>
        </div>
      )}
    </main>
  );
}

function Booked({ booking }: { booking: BookingSummary }) {
  const zone = zoneFor(booking.timeZone);
  const wall = wallClock(booking.slot, zone);
  const childName = [cap(booking.firstName), cap(booking.lastName)].filter(Boolean).join(" ") || "Your child";
  return (
    <div className="demo-done__inner">
      <div className="demo-main">
        <Stepper cur={STEPS.length} />
        <h1 className="demo-title">You’re all set{cap(booking.firstName) ? `, ${cap(booking.firstName)}` : ""}!</h1>
        <p className="demo-done__lead">
          We’ve emailed the details to{" "}
          <b>{booking.email.trim()} and our team will connect with you on Whatsapp and coordinate further</b>. You will receive the
          Zoom link on your registered email address and Whatsapp number.
        </p>

        <div className="demo-ticket">
          <span className="demo-cube demo-cube--ticket" aria-hidden="true" />
          <div className="demo-ticket__top">
            <Image src="/images/demo-booking/calendar.png" width={59} height={70} alt="" className="demo-ticket__icon" />
            <div>
              <p className="demo-ticket__meta">
                <Image src="/images/book-demo/clock.png" width={82} height={80} alt="" />
                {DEMO_MINUTES} minutes <span aria-hidden="true">•</span> FREE demo <span aria-hidden="true">•</span> On Zoom
              </p>
              <p className="demo-ticket__date">{dayFull(wall.day)}</p>
              <p className="demo-ticket__time">
                {timeLabel(wall.minutes)} {zoneShort(zone, booking.slot)}
              </p>
            </div>
          </div>
          <div className="demo-ticket__child">
            <span className="demo-ticket__avatar" aria-hidden="true">
              {childName.charAt(0)}
            </span>
            <div>
              <p className="demo-ticket__name">{childName}</p>
              <p className="demo-ticket__child-meta">
                {booking.age} years <span aria-hidden="true">•</span> {booking.level}
              </p>
            </div>
          </div>
        </div>

        <h2 className="demo-done__subtitle">What happens in the {DEMO_MINUTES} minutes</h2>
        <div className="demo-expect-wrap">
          <span className="demo-cube demo-cube--expect-a" aria-hidden="true" />
          <span className="demo-cube demo-cube--expect-b" aria-hidden="true" />
          <ol className="demo-expect">
            {EXPECT.map((e, i) => (
              <li key={e.title}>
                <span className="demo-expect__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{e.title}</h3>
                <p>{e.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="demo-foot demo-foot--done">
          <Cta href="/">Go To Homepage</Cta>
        </div>
      </div>
      <span className="demo-cube demo-cube--done" aria-hidden="true" />
      <Illustration />
    </div>
  );
}
