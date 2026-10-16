import { canScroll } from "./wheel-pager";
import { pageTrack, panelIndex, track, trackActive } from "./track";

/** Pixels one j/k/ArrowDown/ArrowUp press scrolls. */
const SCROLL_STEP = 80;

const LEFT = ["ArrowLeft", "h"];
const RIGHT = ["ArrowRight", "l"];
const DOWN = ["ArrowDown", "j"];
const UP = ["ArrowUp", "k"];

// Alt + h/j/k/l mirror the plain letters, for people whose Vim-style browser
// extension takes the plain ones. Matched by physical key (e.code) because
// Alt changes the character on some layouts (macOS).
const ALT_CODES: Record<string, string> = { KeyH: "h", KeyJ: "j", KeyK: "k", KeyL: "l" };

const CLOSE_LINKS =
  'a[aria-label="All events"], a[aria-label="All images"], a[aria-label="Back to home"]';

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// The area keys scroll, independent of focus or pointer (the wheel handles
// what is under the pointer): on the home page the panel in view, otherwise
// the event details column, then the page. Inside a panel, its own scrolling
// column comes first.
const scrollAreas = (): Element[] => {
  const t = trackActive();
  if (t) {
    const panel = t.querySelectorAll(":scope > section")[panelIndex(t)];
    return panel ? [...panel.querySelectorAll("[data-scroll]"), panel] : [];
  }
  return [...document.querySelectorAll("[data-scroll]"), document.documentElement];
};

// Bound once on import: module scripts are not re-run by the view-transition
// router, so everything is looked up at event time.
document.addEventListener("keydown", (e) => {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const target = e.target as Element;
  if (target.closest("input, textarea, select, [contenteditable]")) return;
  // With Alt held only the Vim letters apply; Alt+arrows stay the browser's.
  const key = e.altKey ? ALT_CODES[e.code] : e.key;
  if (!key) return;

  const dir = RIGHT.includes(key) ? 1 : LEFT.includes(key) ? -1 : 0;
  if (dir) {
    // The home track pages its panels; elsewhere follow Previous / Next.
    const link = document.querySelector<HTMLAnchorElement>(
      `a[aria-label="${dir > 0 ? "Next" : "Previous"}"]`,
    );
    if (pageTrack(dir)) e.preventDefault();
    else if (link) {
      e.preventDefault();
      link.click();
    }
    return;
  }

  if (key === "Escape") {
    const link = document.querySelector<HTMLAnchorElement>(CLOSE_LINKS);
    if (link) {
      e.preventDefault();
      link.click();
    }
    return;
  }

  const dy = DOWN.includes(key) ? 1 : UP.includes(key) ? -1 : 0;
  if (!dy) return;
  // Below sm the home page scrolls as a normal page: leave it native.
  if (track() && !trackActive()) return;
  const area = scrollAreas().find((el) => canScroll(el, dy));
  if (!area) return;
  e.preventDefault();
  const scroller =
    area === document.documentElement ? document.scrollingElement! : area;
  scroller.scrollBy({
    top: dy * SCROLL_STEP,
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });
});
