"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Eyebrow from "../Eyebrow";
import RevealTitle from "../RevealTitle";

gsap.registerPlugin(ScrollTrigger);

// Pieces the GAP page's sections share. Styled in gap.scss.

// The home page's four guide lines, either side of the content column.
export function GapLines({ dark }: { dark?: boolean }) {
  return (
    <div className={`gap-lines${dark ? " gap-lines--dark" : ""}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

// Eyebrow, outlined headline (both animate in, as on the home page) and an
// optional lead; `aside` sits to the right of it on wide screens.
export function GapHead({
  eyebrow,
  title,
  id,
  lead,
  aside,
  dark,
}: {
  eyebrow: string;
  title: ReactNode;
  id: string;
  lead?: ReactNode;
  aside?: ReactNode;
  dark?: boolean;
}) {
  const head = (
    <div>
      <Eyebrow className="gap-eyebrow" boxClassName="gap-eyebrow__box" rotate={45}>
        {eyebrow}
      </Eyebrow>
      <RevealTitle className="gap-title" id={id}>
        {title}
      </RevealTitle>
      {lead && <p className="gap-lead">{lead}</p>}
    </div>
  );
  const cls = `gap-head${aside ? " gap-head--split" : ""}${dark ? " gap-head--dark" : ""}`;
  return (
    <div className={cls}>
      {head}
      {aside}
    </div>
  );
}

// Inside the returned ref, each [data-reveal] rises in once it scrolls into
// view, and the children of each [data-reveal-group] follow one another, as
// the home page's cards do. Laid out before the first paint, so nothing shows
// before it hides.
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]", root).forEach((el) => {
        gsap.from(el, {
          y: 32,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal-group]", root).forEach((group) => {
        gsap.from(group.children, {
          y: 24,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: group, start: "top 85%", once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);
  return ref;
}

// One open list at a time (the drawer's popovers): a click outside the open
// one's [data-pop] closes it, and Escape does too, handing the focus back to
// the field that opened it.
export function usePopover<T extends string>() {
  const [pop, setPop] = useState<T | null>(null);
  useEffect(() => {
    if (!pop) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target;
      if (!(t instanceof Element) || !t.closest(`[data-pop="${pop}"]`)) setPop(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      document.querySelector<HTMLElement>(`[data-pop="${pop}"] [aria-expanded]`)?.focus();
      setPop(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pop]);
  const toggle = useCallback((p: T) => setPop((cur) => (cur === p ? null : p)), []);
  return { pop, setPop, toggle };
}

export function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
