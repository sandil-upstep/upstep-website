// The page cover's dark theme (.main-cover--dark, styled in anandSection.scss).
// More than one section asks for it, so the cover stays dark while any of
// them does: one section letting go can't undo another's request.
const requests = new Set<string>();

export function setCoverDark(cover: Element, source: string, on: boolean) {
  if (on) requests.add(source);
  else requests.delete(source);
  const dark = requests.size > 0;
  cover.classList.toggle("main-cover--dark", dark);
  // Tells the header which theme to take here: the cover's background colour
  // is mid-tween for 0.7s after every switch, so it can't be read reliably.
  cover.setAttribute("data-nav-theme", dark ? "dark" : "light");
}
