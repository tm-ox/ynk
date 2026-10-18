// A sideways swipe steps as the arrow keys and the wheel do (scripts/step.ts):
// Previous / Next where the page has them, past them the neighbouring screen
// of the row. Swipe left goes on (Next), swipe right goes back. The step runs
// on release, so the page turn is the same seam as a tap on the arrows; the
// page does not follow the finger.
import { stepFor } from "./step";
import { PAGING } from "../utils/transitions";

/** How far (px) a finger must travel sideways to count as a swipe. */
const DISTANCE = 60;
/** How much more sideways than vertical it must be (a scroll is not a swipe). */
const SLOPE = 1.5;
/** Longer than this (ms) is a drag or a read, not a swipe. */
const TIME = 600;
/** Starts this close (px) to the screen's side edge are the browser's own
 *  back / forward gesture (iOS Safari), not ours. */
const EDGE = 24;

let start: { x: number; y: number; t: number } | null = null;
let lockUntil = 0;

// Where a swipe means something else, or nothing: fields, the open Settings
// dialog or phone menu (the page under them is out of reach), anything that
// scrolls sideways, and a page zoomed in (the finger pans it).
const ignored = (target: Element) =>
  !!target.closest("input, textarea, select, [contenteditable], dialog, #main-nav") ||
  !!document.querySelector("dialog[open], #main-nav.expanded") ||
  (window.visualViewport?.scale ?? 1) > 1.01 ||
  scrollsSideways(target);

const scrollsSideways = (el: Element | null): boolean => {
  for (; el && el !== document.documentElement; el = el.parentElement) {
    const x = getComputedStyle(el).overflowX;
    if ((x === "auto" || x === "scroll") && el.scrollWidth > el.clientWidth) return true;
  }
  return false;
};

// Bound once on import: module scripts are not re-run by the view-transition
// router, so everything is looked up at event time. Passive: scrolling is
// never held up waiting on these.
document.addEventListener(
  "touchstart",
  (e) => {
    start = null;
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    if (t.clientX < EDGE || t.clientX > window.innerWidth - EDGE) return;
    if (ignored(e.target as Element)) return;
    start = { x: t.clientX, y: t.clientY, t: e.timeStamp };
  },
  { passive: true },
);
// A second finger (a pinch) cancels it.
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) start = null;
  },
  { passive: true },
);
document.addEventListener("touchcancel", () => (start = null), { passive: true });
document.addEventListener(
  "touchend",
  (e) => {
    const s = start;
    start = null;
    if (!s || e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) < DISTANCE || Math.abs(dx) < Math.abs(dy) * SLOPE) return;
    if (e.timeStamp - s.t > TIME) return;
    // One step per swipe, and none while the last one is still turning.
    if (e.timeStamp < lockUntil) return;
    const step = stepFor(dx < 0 ? 1 : -1);
    if (!step) return;
    lockUntil = e.timeStamp + PAGING.lock;
    step();
  },
  { passive: true },
);
