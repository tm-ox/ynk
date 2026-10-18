import { navigate } from "astro:transitions/client";
import { canScroll } from "./wheel-pager";
import { pageTrack, panelIndex, track, trackActive } from "./track";
import { neighbour } from "../utils/row";

/** Pixels one j/k/ArrowDown/ArrowUp press scrolls. */
const SCROLL_STEP = 80;

const LEFT = ["ArrowLeft", "h"];
const RIGHT = ["ArrowRight", "l"];
const DOWN = ["ArrowDown", "j"];
const UP = ["ArrowUp", "k"];

const CLOSE_LINKS =
  'a[data-close], a[aria-label="Back to home"]';

// Past the end of a screen the arrows carry on into the neighbouring one,
// along the row (utils/row.ts): home -> Featured -> Events archive -> Images
// archive -> About -> Contact, and back. Within an archive the Previous / Next
// links page it, so these only run at its ends, where the link is missing.
// Going back onto an archive lands on its last page, as the nav has it
// (BaseLayout.astro).
const beyond = (dir: 1 | -1) =>
  neighbour(
    location.pathname,
    dir,
    (s) => document.querySelector<HTMLAnchorElement>(`#main-nav a[data-section="${s.name}"][data-last]`)?.dataset.last,
  );


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
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  const target = e.target as Element;
  if (target.closest("input, textarea, select, [contenteditable]")) return;
  // An open modal (Settings) handles its own keys, Esc included.
  if (document.querySelector("dialog[open]")) return;
  if (e.key === "?") {
    e.preventDefault();
    document.querySelector<HTMLElement>("[data-settings-open]")?.click();
    return;
  }
  if (e.shiftKey) return;
  const key = e.key;

  const dir = RIGHT.includes(key) ? 1 : LEFT.includes(key) ? -1 : 0;
  if (dir) {
    // A held key must not queue navigations or skip panels.
    if (e.repeat) {
      e.preventDefault();
      return;
    }
    // The home track pages its panels; elsewhere follow Previous / Next.
    const link = document.querySelector<HTMLAnchorElement>(
      `a[aria-label="${dir > 0 ? "Next" : "Previous"}"]`,
    );
    const t = trackActive();
    const edge = t && panelIndex(t) === (dir > 0 ? t.querySelectorAll(":scope > section").length - 1 : 0);
    if (t && edge) {
      const to = beyond(dir);
      if (to) {
        e.preventDefault();
        navigate(to);
      }
    } else if (pageTrack(dir)) e.preventDefault();
    else if (link) {
      e.preventDefault();
      link.click();
    } else {
      const to = beyond(dir);
      if (to) {
        e.preventDefault();
        navigate(to);
      }
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
