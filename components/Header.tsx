"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import "./header.scss";
import Button from "./common/Button";
import { openDemoBooking } from "./demoBooking";
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

// --nav-fg flips between ink and white with the bar's theme (header.scss).
const NAV_LINK_CLASS =
  "text-[15px] font-medium text-(--nav-fg) transition-colors hover:text-[#f8661a]";

// The floating frosted bar and its row, shared with the demo confirmation
// page's slim header (DemoConfirmed.tsx) so the two match.
export const NAV_BAR_CLASS =
  "site-nav mx-auto max-w-285 lg:max-w-[max(71.25rem,78vw)] rounded-[10px] border backdrop-blur-xl backdrop-saturate-150";
export const NAV_ROW_CLASS = "flex h-16 items-center justify-between gap-6 px-5 lg:px-6";

// Stand-in wordmark until the real logo SVG lands in /public/images — then
// replace this with a next/image of it.
export function Logo() {
  return (
    <Link href="/" aria-label="Upstep Academy home" className="flex shrink-0 flex-col leading-none py-2 h-full">
      <Image src="/images/main-logo.svg" alt="Upstep Academy" width={120} height={40} className="site-nav__logo w-auto h-full" />
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

type NavTheme = "light" | "dark";

// Any CSS colour → [r, g, b, a] (0–255, alpha 0–1). Painting it on a 1×1
// canvas resolves oklch(), color() etc. the same as rgb(); cached, since a
// page only has a handful of background colours.
const rgbaCache = new Map<string, number[]>();
let rgbaCtx: CanvasRenderingContext2D | null = null;

function toRgba(color: string) {
  let rgba = rgbaCache.get(color);
  if (rgba) return rgba;
  rgbaCtx ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!rgbaCtx) return [0, 0, 0, 0];
  rgbaCtx.clearRect(0, 0, 1, 1);
  rgbaCtx.fillStyle = color;
  rgbaCtx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = rgbaCtx.getImageData(0, 0, 1, 1).data;
  rgba = [r, g, b, a / 255];
  rgbaCache.set(color, rgba);
  return rgba;
}

// The theme the page calls for at (x, y): walk up from whatever sits there
// to the first element that either names one with data-nav-theme (for
// backgrounds that animate, or are images/gradients) or has a mostly opaque
// background colour. Null when nothing is there to read.
function themeBehind(header: HTMLElement, x: number, y: number): NavTheme | null {
  const target = document.elementsFromPoint(x, y).find((el) => !header.contains(el));
  if (!target) return null;
  for (let node: Element | null = target; node; node = node.parentElement) {
    const named = node.getAttribute("data-nav-theme");
    if (named === "light" || named === "dark") return named;
    const [r, g, b, a] = toRgba(getComputedStyle(node).backgroundColor);
    if (a >= 0.5) return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128 ? "dark" : "light";
  }
  return "light";
}

// Re-reads the page behind the bar on every scroll frame, and whenever a
// section switches its data-nav-theme (the cover's theme flips aren't always
// tied to a scroll event).
function useNavTheme(headerRef: RefObject<HTMLElement | null>, barRowRef: RefObject<HTMLElement | null>) {
  const [theme, setTheme] = useState<NavTheme>("light");
  const pathname = usePathname();

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const header = headerRef.current;
      const row = barRowRef.current;
      if (!header || !row) return;
      // Measured against the header so the header's own slide cancels out:
      // while it's hidden this still samples where the bar will come back to.
      const y = row.getBoundingClientRect().top - header.getBoundingClientRect().top + row.offsetHeight / 2;
      const next = themeBehind(header, window.innerWidth / 2, y);
      if (next) setTheme(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-nav-theme"] });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [headerRef, barRowRef, pathname]);

  return theme;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  // Keep the header pinned while the mobile menu is open or a control inside it has focus.
  const [focusWithin, setFocusWithin] = useState(false);
  const hidden = useHideOnScroll() && !menuOpen && !focusWithin;
  const headerRef = useRef<HTMLElement>(null);
  const barRowRef = useRef<HTMLDivElement>(null);
  const theme = useNavTheme(headerRef, barRowRef);

  return (
    <header
      ref={headerRef}
      onFocus={() => setFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocusWithin(false);
      }}
      className={`site-header fixed inset-x-0 top-0 z-50 px-4 pt-4 font-sans transition-transform duration-300 ease-out motion-reduce:transition-none ${
        // Extra 2rem so the card's drop shadow doesn't peek in at the top edge.
        hidden ? "-translate-y-[calc(100%+2rem)]" : "translate-y-0"
      }`}
    >
      {/* Glass colours and shadow live in header.scss (.site-nav), per theme. */}
      <div data-theme={theme} className={NAV_BAR_CLASS}>
        <div ref={barRowRef} className={NAV_ROW_CLASS}>
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
            <Button size="sm" className="h-[46px]" onClick={openDemoBooking}>
              Book a FREE demo class
            </Button>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-(--nav-fg) lg:hidden"
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
            className="border-t border-(--nav-divider) px-5 pb-5 pt-3 lg:hidden"
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
              <Button
                size="sm"
                onClick={() => {
                  setMenuOpen(false);
                  openDemoBooking();
                }}
              >
                Book a FREE demo class
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
