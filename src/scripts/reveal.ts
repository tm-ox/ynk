// Home panels fade in (columns alternately rising and falling) as they scroll
// into view (sm and up; the CSS in global.css is gated on prefers-reduced-motion,
// so this only toggles state). The hero is never animated, and the panel in view
// on arrival is shown as is, so nothing fights the page-to-page morphs.
// State is derived from the track's scroll position on every scroll, so it does
// not depend on the route taken: a panel is "in" once half of it is in view and
// resets to "out" when (almost) none of it is, and so plays again on each visit.
// (An IntersectionObserver cannot do this: it never reports a panel that merely
// touches the viewport edge.)
import { panelsOf } from "./track";

const wide = matchMedia("(min-width: 40rem)");
let teardown: (() => void) | null = null;

function mark(el: HTMLElement | undefined, order: number, dir: number) {
  if (!el) return;
  el.dataset.revealItem = "";
  el.style.setProperty("--i", String(order));
  el.style.setProperty("--dir", String(dir));
}

function arm() {
  teardown?.();
  teardown = null;

  const track = document.querySelector<HTMLElement>("[data-track]");
  if (!track || !wide.matches || !track.clientWidth) return;

  const panels = panelsOf(track);
  const animated = panels.filter((s) => s.id !== "top");
  for (const s of animated) {
    // The label bar only fades. The content below it is a row of columns: the
    // first rises, the next falls, and so on, arriving together.
    const [bar, body] = s.children as unknown as HTMLElement[];
    mark(bar, 0, 0);
    [...(body?.children ?? [])].forEach((c, i) => mark(c as HTMLElement, 1, i % 2 === 0 ? 1 : -1));
  }

  const update = () => {
    const w = track.clientWidth;
    if (!w) return;
    for (const s of animated) {
      const visible = 1 - Math.abs(track.scrollLeft - panels.indexOf(s) * w) / w;
      if (visible >= 0.5) s.dataset.reveal = "in";
      // Not "<= 0": at fractional zoom or pixel ratios scrollLeft settles a
      // fraction of a pixel off, so a panel next door never reaches exactly 0.
      else if (visible < 0.1) s.dataset.reveal = "out";
    }
  };

  // Panels other than the one in view start hidden; the one in view is "in"
  // without a transition (no "out" state was ever applied to it).
  const w = track.clientWidth;
  const current = Math.round(track.scrollLeft / w);
  animated.forEach((s) => {
    if (panels.indexOf(s) !== current) s.dataset.reveal = "out";
  });

  let frame = 0;
  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };
  track.addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  teardown = () => {
    cancelAnimationFrame(frame);
    track.removeEventListener("scroll", onScroll);
    removeEventListener("resize", onScroll);
  };
}

document.addEventListener("astro:page-load", arm);
// Crossing the sm breakpoint switches between side-by-side and stacked panels.
wide.addEventListener("change", arm);
