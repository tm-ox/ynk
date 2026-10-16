import { canScroll } from "./wheel-pager";

/** Pixels one j/k/ArrowDown/ArrowUp press scrolls. */
const SCROLL_STEP = 80;

const LEFT = ["ArrowLeft", "h"];
const RIGHT = ["ArrowRight", "l"];
const DOWN = ["ArrowDown", "j"];
const UP = ["ArrowUp", "k"];

const CLOSE_LINKS =
  'a[aria-label="All events"], a[aria-label="All images"], a[aria-label="Back to home"]';

// From the sm breakpoint up the home page is a horizontal track of panels.
const wide = window.matchMedia("(min-width: 40rem)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let panelPager: ((dir: 1 | -1) => boolean) | null = null;

/** The home track registers its panel paging here; it returns true if it handled the key. */
export function registerPanelPager(fn: (dir: 1 | -1) => boolean) {
  panelPager = fn;
}

// The element last under the pointer, so keys scroll what the reader is looking at.
let pointerTarget: Element | null = null;
document.addEventListener(
  "pointermove",
  (e) => {
    pointerTarget = e.target as Element;
  },
  { passive: true },
);

// Nearest ancestor (or self) that can scroll in this direction.
const scrollableFrom = (start: Element | null, dy: number) => {
  for (let el = start; el; el = el.parentElement) {
    if (canScroll(el, dy)) return el;
  }
  return null;
};

// The first text area a reader would expect: the event details column, then
// the home panel in view, then the page.
const fallbackAreas = (): Element[] => {
  const areas = [...document.querySelectorAll("[data-scroll]")];
  const track = document.querySelector<HTMLElement>("[data-track]");
  if (track) {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    const panel = track.querySelectorAll(":scope > section")[i];
    if (panel) areas.push(panel);
  }
  areas.push(document.documentElement);
  return areas;
};

const scrollTarget = (focus: Element, dy: number) => {
  return (
    scrollableFrom(focus, dy) ??
    scrollableFrom(pointerTarget, dy) ??
    fallbackAreas().find((el) => canScroll(el, dy)) ??
    null
  );
};

// Bound once on import: module scripts are not re-run by the view-transition
// router, so everything is looked up at event time.
document.addEventListener("keydown", (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const target = e.target as Element;
  if (target.closest("input, textarea, select, [contenteditable]")) return;
  const key = e.key;

  const dir = RIGHT.includes(key) ? 1 : LEFT.includes(key) ? -1 : 0;
  if (dir) {
    // The home track pages its panels; elsewhere follow Previous / Next.
    const link = document.querySelector<HTMLAnchorElement>(
      `a[aria-label="${dir > 0 ? "Next" : "Previous"}"]`,
    );
    if (panelPager?.(dir)) e.preventDefault();
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
  if (!wide.matches && document.querySelector("[data-track]")) return;
  const area = scrollTarget(target, dy);
  if (!area) return;
  e.preventDefault();
  const scroller =
    area === document.documentElement ? document.scrollingElement! : area;
  scroller.scrollBy({
    top: dy * SCROLL_STEP,
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });
});
