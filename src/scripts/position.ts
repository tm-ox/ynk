// The position line under the header (BaseLayout.astro, global rule in its
// style): where the screen in view sits in the row of home panels, archive
// pages, About and Contact. Other pages set it from the build (--i, --n); on
// home its --i follows the track.
import { panelsOf, track } from "./track";

const line = () => document.querySelector<HTMLElement>("[data-position]");

/** Puts the line at panel `i` of the home track (a fraction while scrolling). */
export function placePosition(i: number) {
  const el = line();
  if (!el) return;
  const last = (panelsOf(track()!).length || 1) - 1;
  el.style.setProperty("--i", String(Math.min(Math.max(i, 0), last)));
}

const fromScroll = () => {
  const t = track();
  if (t && t.clientWidth) placePosition(t.scrollLeft / t.clientWidth);
};

// Continuous while the track scrolls natively (wheel and keys step by view
// transition instead, which sets the end place itself: see track.ts), at most
// once a frame. The track is a new element on every visit to home.
let frame = 0;
const onScroll = () => {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    fromScroll();
  });
};
let bound: HTMLElement | null = null;
document.addEventListener("astro:page-load", () => {
  const t = track();
  if (t === bound) return;
  bound = t;
  if (!t) return;
  t.addEventListener("scroll", onScroll, { passive: true });
  fromScroll();
});

// A page turn onto home: the new snapshot is taken right after the swap, before
// the track has scrolled to a #panel in the address, so the line goes to that
// panel here and the morph ends in the right place.
let hash = "";
document.addEventListener("astro:before-preparation", (e: any) => {
  hash = e.to.pathname === "/" ? e.to.hash : "";
});
document.addEventListener("astro:after-swap", () => {
  const t = track();
  if (!t) return;
  const i = hash ? panelsOf(t).findIndex((s) => `#${s.id}` === hash) : 0;
  placePosition(Math.max(i, 0));
});
