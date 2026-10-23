import { getLenis } from "./SmoothScroll";

// Holds the page still under a modal drawer (the demo booking, GAP's register)
// and puts it back where it was. Counted, so one drawer opening over another
// that's closing doesn't unlock the page under it. Styled in globals.css.
let locks = 0;
let pageY = 0;

export function lockPage() {
  if (locks++ > 0) return;
  const root = document.documentElement;
  pageY = window.scrollY;
  // Hiding the scrollbar widens the page by its width (0 for overlay
  // scrollbars); the page and its fixed bars are padded by that much.
  root.style.setProperty("--page-sbw", `${window.innerWidth - root.clientWidth}px`);
  getLenis()?.stop();
  root.classList.add("page-lock");
}

// After the dialog has closed: its own focus return can scroll the page to
// the element it focuses, so that's undone, for Lenis too, before it restarts
// from the wrong place.
export function unlockPage() {
  if (locks === 0 || --locks > 0) return;
  document.documentElement.classList.remove("page-lock");
  if (window.scrollY !== pageY) {
    window.scrollTo({ top: pageY, behavior: "instant" });
    getLenis()?.scrollTo(pageY, { immediate: true, force: true });
  }
  getLenis()?.start();
}
