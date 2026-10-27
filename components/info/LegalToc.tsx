"use client";

import { useEffect, useRef, useState } from "react";
import { onScrollFrame } from "../SmoothScroll";

// The legal pages' contents list (LegalDoc.tsx). Marks the section being read,
// the last one whose top has passed 30% of the way down the viewport (the
// last one outright at the very bottom of the page), and keeps that link in
// view inside the list.
export default function LegalToc({ sections }: { sections: { id: string; title: string }[] }) {
  const [active, setActive] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null);
    const update = () => {
      const line = window.innerHeight * 0.3;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current: string | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      if (atBottom && els.length) current = els[els.length - 1].id;
      setActive(current);
    };
    update();
    const stop = onScrollFrame(update);
    window.addEventListener("resize", update);
    return () => {
      stop();
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  // Scrolls the list, never the page, when the active link sits outside it
  // (or under its edge fades).
  useEffect(() => {
    const nav = navRef.current;
    const link = active ? nav?.querySelector<HTMLElement>(`a[href="#${active}"]`) : null;
    if (!nav || !link || nav.scrollHeight <= nav.clientHeight) return;
    const fade = 32;
    const top = link.offsetTop - nav.scrollTop;
    if (top < fade || top + link.offsetHeight > nav.clientHeight - fade) {
      nav.scrollTo({ top: link.offsetTop - nav.clientHeight / 2 + link.offsetHeight / 2, behavior: "smooth" });
    }
  }, [active]);

  return (
    // data-lenis-prevent: lets the wheel scroll the list itself, not the page.
    <nav ref={navRef} className="legal-doc__toc" aria-label="Contents" data-lenis-prevent>
      <p className="legal-doc__toc-title">Contents</p>
      <ol>
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={s.id === active ? "is-active" : undefined}
              aria-current={s.id === active ? "location" : undefined}
            >
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
