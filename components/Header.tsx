"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./header.scss";
import Button from "./common/Button";
import Image from "next/image";

type NavLink = { label: string; href: string };

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
];

// Placeholder course list — swap for the real catalogue once it's settled.
const COURSE_LINKS: NavLink[] = [
  { label: "Beginner", href: "/courses/beginner" },
  { label: "Intermediate", href: "/courses/intermediate" },
  { label: "Advanced", href: "/courses/advanced" },
];

const TRAILING_LINKS: NavLink[] = [{ label: "Tournament Finder", href: "/tournament-finder" }];

const NAV_LINK_CLASS =
  "text-[15px] font-medium text-[#141b34] transition-colors hover:text-[#f8661a]";

// Stand-in wordmark until the real logo SVG lands in /public/images — then
// replace this with a next/image of it.
function Logo() {
  return (
    <Link href="/" aria-label="Upstep Academy home" className="flex shrink-0 flex-col leading-none py-2 h-full">
      <Image src="/images/main-logo.svg" alt="Upstep Academy" width={120} height={40} className="w-auto h-full" />
    </Link>
  );
}

// Stand-in for the gold "GAP" badge artwork.
function GapBadge() {
  return (
    <Link href="/gap" aria-label="GAP" className="gap-badge">
      {/* GAP */}
      <Image src="/images/GAP1.svg" alt="GAP" width={24} height={24} className="absolute w-auto h-[46px] -left-5" />
      <span className="gap-badge__text">GAP</span>
    </Link>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CoursesDropdown() {
  // Hover and click are tracked apart: if hover alone drove `open`, the
  // click that follows a mouse-enter would immediately toggle it shut.
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const visible = open || hovered;
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close when clicking anywhere outside, or on Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={visible}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className={`${NAV_LINK_CLASS} flex items-center gap-1`}
      >
        Courses
        <Chevron open={visible} />
      </button>
      {visible && (
        // pt-3 bridges the gap under the trigger so hover isn't lost on the way down.
        <div className="absolute left-1/2 top-full -translate-x-1/2 pt-3">
          <ul className="min-w-44 rounded-xl border border-black/5 bg-white p-2 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.2)]">
            {COURSE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => {
                    setOpen(false);
                    setHovered(false);
                  }}
                  className="block rounded-lg px-3 py-2 text-[15px] font-medium text-[#141b34] transition-colors hover:bg-orange-50 hover:text-[#f8661a]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Smart sticky: hide while scrolling down, reveal on any scroll up. Small
// jitters under SCROLL_DELTA are ignored so trackpad noise doesn't flicker it.
const SCROLL_DELTA = 8;
const REVEAL_ZONE = 80;

function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (y < REVEAL_ZONE) setHidden(false);
      else if (Math.abs(y - lastY) < SCROLL_DELTA) return;
      else setHidden(y > lastY);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return hidden;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  // Keep the header pinned while the mobile menu is open or a control inside it has focus.
  const [focusWithin, setFocusWithin] = useState(false);
  const hidden = useHideOnScroll() && !menuOpen && !focusWithin;

  return (
    <header
      onFocus={() => setFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocusWithin(false);
      }}
      className={`fixed inset-x-0 top-0 z-50 px-4 pt-4 font-sans transition-transform duration-300 ease-out motion-reduce:transition-none ${
        // Extra 2rem so the card's drop shadow doesn't peek in at the top edge.
        hidden ? "-translate-y-[calc(100%+2rem)]" : "translate-y-0"
      }`}
    >
      <div className="mx-auto max-w-285 lg:max-w-[max(71.25rem,78vw)] rounded-[10px] border border-white/60 bg-white/65 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_-6px_rgba(20,27,52,0.18)]">
        <div className="flex h-16 items-center justify-between gap-6 px-5 lg:px-6">
          <Logo />

          <nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
                {link.label}
              </Link>
            ))}
            <CoursesDropdown />
            {TRAILING_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <GapBadge />
            <Button size="sm" className="h-[46px]" href="/book-demo">
              Book a FREE demo class
            </Button>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#141b34] lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6">
              {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          // Any link click inside bubbles up here and collapses the menu.
          <nav
            id="mobile-menu"
            aria-label="Main"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
            }}
            className="border-t border-black/5 px-5 pb-5 pt-3 lg:hidden"
          >
            <ul className="flex flex-col">
              {[...NAV_LINKS, ...COURSE_LINKS.map((c) => ({ ...c, label: `Courses — ${c.label}` })), ...TRAILING_LINKS].map(
                (link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={`${NAV_LINK_CLASS} block py-2.5`}>
                      {link.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <GapBadge />
              <Button size="sm" href="/book-demo">
                Book a FREE demo class
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
