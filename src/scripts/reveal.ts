// Home panels wipe in as they arrive (sm and up; the CSS in global.css is gated
// on prefers-reduced-motion, so this only toggles state). The hero takes part
// like the rest; the panel in view on arrival is shown as is, so nothing fights
// the page-to-page morphs. The exception is arriving by a page turn from an
// archive (data-turn on the root, set in Base.astro): the track slides in as
// one piece, and the panel landed on wipes in like an archive grid does.
// State is derived from the track's scroll position on every scroll, so it does
// not depend on the route taken: a panel is "in" once START of it is in view and
// resets to "out" when (almost) none of it is, and so plays again on each visit.
// While "out" a panel also records which side of the screen it lies on
// (data-side), so the wipe enters from that side; it is left alone while "in".
// (An IntersectionObserver cannot do this: it never reports a panel that merely
// touches the viewport edge.)
import { panelsOf } from "./track";

// Fraction of a panel in view that triggers its wipe: raise for later, lower for earlier.
const START = 0.4;

const wide = matchMedia("(min-width: 40rem)");
let teardown: (() => void) | null = null;

// turn: the root's data-turn, on the page load that follows a page turn only
// (not when the breakpoint is crossed later), so the wipe plays once.
function arm(turn?: string) {
  teardown?.();
  teardown = null;

  const track = document.querySelector<HTMLElement>("[data-track]");
  if (!track || !wide.matches || !track.clientWidth) return;

  const panels = panelsOf(track);

  const update = () => {
    const w = track.clientWidth;
    if (!w) return;
    for (const s of panels) {
      const offset = panels.indexOf(s) * w - track.scrollLeft;
      const visible = 1 - Math.abs(offset) / w;
      if (visible >= START) s.dataset.reveal = "in";
      // Not "<= 0": at fractional zoom or pixel ratios scrollLeft settles a
      // fraction of a pixel off, so a panel next door never reaches exactly 0.
      else if (visible < 0.1) s.dataset.reveal = "out";
      if (s.dataset.reveal === "out") s.dataset.side = offset < 0 ? "left" : "right";
    }
  };

  // Panels other than the one in view start hidden; the one in view is "in"
  // without a transition (no "out" state was ever applied to it).
  const w = track.clientWidth;
  const current = Math.round(track.scrollLeft / w);
  panels.forEach((s) => {
    s.dataset.side = panels.indexOf(s) < current ? "left" : "right";
    if (panels.indexOf(s) !== current) s.dataset.reveal = "out";
  });

  // After a page turn the panel in view (where Base.astro's after-swap has
  // already scrolled the track) wipes in from the side the page came from.
  // Base.astro also set every panel "out" on the incoming page, so it was
  // hidden from the first frame; otherwise a leftover "out" is cleared, so the
  // panel shows as is.
  const landed = panels[current];
  let wipe = 0;
  if (landed && turn) {
    landed.dataset.side = turn === "back" ? "left" : "right";
    landed.dataset.reveal = "out";
    // The page was only just swapped in and may not have been styled yet. The
    // transition runs from the styled "out" state, so style it now, then go
    // "in" a frame later.
    getComputedStyle(landed).getPropertyValue("--edge");
    wipe = requestAnimationFrame(() => (landed.dataset.reveal = "in"));
  } else if (landed?.dataset.reveal === "out") delete landed.dataset.reveal;

  let frame = 0;
  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };
  track.addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  teardown = () => {
    cancelAnimationFrame(wipe);
    cancelAnimationFrame(frame);
    track.removeEventListener("scroll", onScroll);
    removeEventListener("resize", onScroll);
  };
}

document.addEventListener("astro:page-load", () => arm(document.documentElement.dataset.turn));
// Crossing the sm breakpoint switches between side-by-side and stacked panels.
wide.addEventListener("change", () => arm());
