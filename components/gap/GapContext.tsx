"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { ZONES, detectZone, type Zone } from "../demoBookingData";
import { currencyFor, type BatchId, type Currency } from "./gapData";
import "./gap.scss";

// What the GAP page's sections share: the time zone the schedule is shown in,
// the batch picked (in the schedule or the form), the currency and FIDE
// discount the fees are shown with, and the registration drawer every Register
// button opens.

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
  registerOpen: boolean;
  openRegister: () => void;
  closeRegister: () => void;
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
  const [registerOpen, setRegisterOpen] = useState(false);
  const openRegister = useCallback(() => setRegisterOpen(true), []);
  const closeRegister = useCallback(() => setRegisterOpen(false), []);

  const zone = pickedZone ?? seen?.zone ?? ZONES[0];
  // Rupees for India, dollars elsewhere, until a currency or region is picked.
  const currency = pickedCurrency ?? (seen?.detected ? currencyFor(seen.zone.country) : "INR");

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
      registerOpen,
      openRegister,
      closeRegister,
    }),
    [seen, zone, batch, currency, fide, registerOpen, openRegister, closeRegister]
  );

  return <GapContext.Provider value={value}>{children}</GapContext.Provider>;
}
