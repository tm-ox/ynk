import { canScroll } from "./wheel-pager";
import { stepFor } from "./step";

/** Pixels one j/k/ArrowDown/ArrowUp press scrolls. */
const SCROLL_STEP = 80;

const LEFT = ["ArrowLeft", "h"];
const RIGHT = ["ArrowRight", "l"];
const DOWN = ["ArrowDown", "j"];
const UP = ["ArrowUp", "k"];

const CLOSE_LINKS =
  'a[data-close], a[aria-label="Back to home"]';


const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// The area keys scroll, independent of focus or pointer (the wheel handles
// what is under the pointer): the first of the screen's own scrolling areas
// (the event details column, an archive grid, Featured) that can go on, then
// the page.
const scrollAreas = (): Element[] => [
  ...document.querySelectorAll("[data-scroll]"),
  document.documentElement,
];

// Bound once on import: module scripts are not re-run by the view-transition
// router, so everything is looked up at event time.
document.addEventListener("keydown", (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  const target = e.target as Element;
  if (target.closest("input, textarea, select, [contenteditable]")) return;
  // An open modal (Settings) handles its own keys, Esc included.
  if (document.querySelector("dialog[open]")) return;
  if (e.key === "?") {
    e.preventDefault();
    // The cog that shows (the header's from sm up, the menu panel's on
    // phones: BaseLayout.astro); with the menu shut neither does, and either
    // opens the same dialog.
    const cogs = [...document.querySelectorAll<HTMLElement>("[data-settings-open]")];
    (cogs.find((b) => b.checkVisibility()) ?? cogs[0])?.click();
    return;
  }
  if (e.shiftKey) return;
  const key = e.key;

  const dir = RIGHT.includes(key) ? 1 : LEFT.includes(key) ? -1 : 0;
  if (dir) {
    // A held key must not queue navigations or skip pages.
    if (e.repeat) {
      e.preventDefault();
      return;
    }
    // Follow Previous / Next; past them, the neighbouring screen (scripts/step.ts).
    const step = stepFor(dir);
    if (step) {
      e.preventDefault();
      step();
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
  const area
 = scrollAreas().find((el) => canScroll(el, dy));
  if (!area) return;
  e.preventDefault();
  const scroller =
    area === document.documentElement ? document.scrollingElement! : area;
  scroller.scrollBy({
    top: dy * SCROLL_STEP,
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });
});
