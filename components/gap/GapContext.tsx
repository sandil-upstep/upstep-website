"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { ZONES, detectZone, type Zone } from "../demoBookingData";
import { getLenis } from "../SmoothScroll";
import { currencyFor, type BatchId, type Currency } from "./gapData";
import "./gap.scss";

// What the GAP page's sections share: the time zone the schedule is shown in,
// the batch picked (in the schedule or the form), the currency and FIDE
// discount the fees are shown with, and the way down to the registration form.

type Visitor = { zone: Zone; zones: Zone[]; detected: boolean; now: number };

// The visitor's clock, read once on the client. The server render (and
// hydration) use India's, which is what the page shows until then.
let visitor: Visitor | null = null;
const readVisitor = () => (visitor ??= { ...detectZone(), now: Date.now() });
const subscribe = () => () => {};

type GapState = {
  ready: boolean; // the visitor's clock has been read
  now: number;
  zones: Zone[];
  zone: Zone;
  setZone: (zone: Zone) => void;
  country: string; // the visitor's country by their clock (ISO), or ""
  batch: BatchId;
  setBatch: (batch: BatchId) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  fide: boolean;
  setFide: (fide: boolean) => void;
  goToRegister: () => void;
};

const GapContext = createContext<GapState | null>(null);

export function useGap() {
  const gap = useContext(GapContext);
  if (!gap) throw new Error("useGap must be used inside <GapProvider>");
  return gap;
}

export function GapProvider({ children }: { children: ReactNode }) {
  const seen = useSyncExternalStore(subscribe, readVisitor, () => null);
  const [pickedZone, setZone] = useState<Zone | null>(null);
  const [pickedCurrency, setCurrency] = useState<Currency | null>(null);
  const [batch, setBatch] = useState<BatchId>(1);
  const [fide, setFide] = useState(false);

  const zone = pickedZone ?? seen?.zone ?? ZONES[0];
  // Rupees for India, dollars elsewhere, until a currency or region is picked.
  const currency = pickedCurrency ?? (seen?.detected ? currencyFor(seen.zone.country) : "INR");

  // Down to the form; once there, its heading takes the focus so keyboard and
  // screen reader users land in it too.
  const goToRegister = useCallback(() => {
    const target = document.getElementById("register");
    if (!target) return;
    const focus = () => target.querySelector<HTMLElement>("[data-register-focus]")?.focus({ preventScroll: true });
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(target, { onComplete: focus });
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    window.setTimeout(focus, reduced ? 0 : 700);
  }, []);

  const value = useMemo<GapState>(
    () => ({
      ready: seen !== null,
      now: seen?.now ?? 0,
      zones: seen?.zones ?? ZONES,
      zone,
      setZone,
      country: seen?.detected ? seen.zone.country : "",
      batch,
      setBatch,
      currency,
      setCurrency,
      fide,
      setFide,
      goToRegister,
    }),
    [seen, zone, batch, currency, fide, goToRegister]
  );

  return <GapContext.Provider value={value}>{children}</GapContext.Provider>;
}
