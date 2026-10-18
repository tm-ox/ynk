// The seam between home panels (sm and up). When the track moves off the panel
// in view toward another, one diagonal edge (the paging wipe's, with the line
// on it) crosses the screen once, on its own clock: it waits --seam-delay
// after the track sets off, so the incoming panel is mostly in place, then
// takes --seam-duration, eased like --wipe-easing. Ahead of it is the panel being left, behind it the panel
// arriving, each wherever the scroll has got to; the panels slide underneath
// as they always did. Going back is the mirror image. global.css draws the
// masks and the line from --edge (set here every frame), data-reveal and
// data-side; with reduced motion, or without this script, panels are plain.
// At rest the panel in view is whole and the others hidden, so a neighbour
// only ever shows through the seam.
// Arriving on home by a page turn, the panel landed on is simply whole: the
// turn's own seam, on the snapshots (global.css), brings it in.
import { panelsOf, setAim, takeAim } from "./track";

// How far the edge leans sideways per pixel of height: it rises at 58
// degrees, so tan 32deg (global.css uses the matching cos 32deg, 0.848).
const SLANT = Math.tan((32 * Math.PI) / 180);

// How far (as a share of a panel) the track has to move off the panel at rest
// before the seam sets off.
const SET_OFF = 0.01;

// How far back (as a share of a panel) the track has to move against the
// seam's direction to count as turning back. Small: a smooth scroll never
// backs up and a snap back always does; a hand on a trackpad wobbling by a
// pixel or so is ignored.
const TURN_BACK = 0.005;

const wide = matchMedia("(min-width: 40rem)");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

// A CSS easing as a function of time (0 to 1). cubic-bezier() is solved by
// bisection, plenty for one value per frame; anything this does not read
// falls back to an ease-in-out cubic, close to --wipe-easing.
const KEYWORDS: Record<string, number[]> = {
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};
function easing(css: string): (t: number) => number {
  css = css.trim();
  if (css === "linear") return (t) => t;
  const p = KEYWORDS[css] ?? css.match(/^cubic-bezier\(([^)]+)\)$/)?.[1].split(",").map(Number);
  if (!p || p.length !== 4 || p.some(Number.isNaN))
    return (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const [x1, y1, x2, y2] = p;
  const curve = (a: number, b: number, s: number) =>
    3 * a * (1 - s) ** 2 * s + 3 * b * (1 - s) * s * s + s * s * s;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (curve(x1, x2, mid) < t) lo = mid;
      else hi = mid;
    }
    return curve(y1, y2, (lo + hi) / 2);
  };
}

// "0.6s" or "600ms", in ms.
const ms = (css: string, fallback: number) => {
  const m = css.trim().match(/^([\d.]+)(m?s)$/);
  return m ? Number(m[1]) * (m[2] === "s" ? 1000 : 1) : fallback;
};

// One crossing of the seam, from the panel it leaves (from) to the one it
// brings in (to). dir is the way the track moves: 1 is on to a right-hand
// panel, so the seam crosses right to left. The seam's position is its
// distance right of the track's centre (at the track's mid-height): it runs
// from s0 to just past the screen edge it is heading for.
type Seam = {
  from: HTMLElement;
  to: HTMLElement;
  dir: 1 | -1;
  start: number;
  s0: number;
  duration: number;
};

let teardown: (() => void) | null = null;

function arm() {
  teardown?.();
  teardown = null;

  const track = document.querySelector<HTMLElement>("[data-track]");
  if (!track) return;
  const panels = panelsOf(track);

  const plain = (s: HTMLElement) => {
    delete s.dataset.reveal;
    delete s.dataset.side;
    s.style.removeProperty("--edge");
  };
  const hide = (s: HTMLElement) => {
    plain(s);
    s.dataset.reveal = "hidden";
  };
  // Everything starts plain, whatever an earlier arm left.
  panels.forEach(plain);
  if (!wide.matches || reduced.matches || !track.clientWidth) return;

  const root = getComputedStyle(document.documentElement);
  const duration = ms(root.getPropertyValue("--seam-duration"), 750);
  const delay = ms(root.getPropertyValue("--seam-delay"), 100);
  const ease = easing(root.getPropertyValue("--wipe-easing"));

  // The panel shown whole while the track rests on it (none while a seam
  // runs).
  let rest: HTMLElement | null = panels[Math.round(track.scrollLeft / track.clientWidth)] ?? null;
  let seam: Seam | null = null;
  // Where the seam was drawn last frame, and the furthest the track has got
  // in the seam's direction since it set off (or turned back).
  let at = 0;
  let furthest = 0;
  let last = track.scrollLeft;

  panels.forEach((s) => s !== rest && hide(s));

  // Half the track's width, plus the edge's sideways lean over half the
  // track's height and a little for the line, so the seam starts and ends
  // wholly off screen.
  const end = () => track.clientWidth / 2 + (SLANT * track.clientHeight) / 2 + 2;

  // Sets a seam off from s0. The panel it leaves shows what is ahead of the
  // edge, the one it brings in what is behind it, with the line (global.css,
  // by data-reveal and data-side); every other panel is hidden. One that
  // starts part way (turning back) runs only the rest of the way, at the
  // same pace. wait holds it at s0 first (--seam-delay, for a seam setting
  // off with the track).
  const go = (
    from: HTMLElement,
    to: HTMLElement,
    dir: 1 | -1,
    s0: number,
    now: number,
    wait = 0,
  ): Seam => {
    panels.forEach((s) => s !== from && s !== to && hide(s));
    from.dataset.reveal = "leaving";
    from.dataset.side = dir > 0 ? "left" : "right";
    to.dataset.reveal = "arriving";
    to.dataset.side = dir > 0 ? "right" : "left";
    furthest = track.scrollLeft / track.clientWidth;
    const share = Math.min(1, Math.abs(-dir * end() - s0) / (2 * end()));
    return { from, to, dir, start: now + wait, s0, duration: duration * share };
  };
  const settle = (panel: HTMLElement) => {
    seam = null;
    rest = panel;
    panels.forEach((s) => (s === panel ? plain(s) : hide(s)));
  };

  let frame = 0;
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };
  function tick(now: number) {
    frame = 0;
    const w = track!.clientWidth;
    if (!w) return;
    const pos = track!.scrollLeft / w;
    const moving = track!.scrollLeft !== last;
    last = track!.scrollLeft;
    // At rest on a panel: still, and (almost) exactly on it. Not exactly: at
    // fractional zoom or pixel ratios scrollLeft settles a fraction off.
    const near = Math.round(pos);
    const still = !moving && Math.abs(pos - near) < 0.01 ? panels[near] : undefined;

    if (!seam) {
      if (!rest) return;
      const from = panels.indexOf(rest);
      if (Math.abs(pos - from) <= SET_OFF) return;
      const dir = pos > from ? 1 : -1;
      // Where the track is headed: a jump (menu, keys) says so, otherwise
      // the next panel along. Anything else is put right once it settles.
      const aim = takeAim();
      const to = aim !== null && (aim - from) * dir > 0 && panels[aim] ? aim : from + dir;
      if (!panels[to]) return;
      seam = go(rest, panels[to], dir, dir * end(), now, delay);
      rest = null;
    }

    // Turned back: the seam heads back the way it came, from where it is,
    // the two panels' parts swapped, so nothing jumps. (Letting it finish
    // first would hide the panel coming back, then wipe it in again.)
    if ((pos - furthest) * seam.dir > 0) furthest = pos;
    else if ((furthest - pos) * seam.dir > TURN_BACK) {
      seam = go(seam.to, seam.from, seam.dir > 0 ? -1 : 1, at, now);
      return schedule();
    }

    // Before its start (the delay) t is 0, so the seam waits just past the
    // leading edge; it counts as done, and can settle, only once across.
    const t = seam.duration
      ? Math.min(1, Math.max(0, (now - seam.start) / seam.duration))
      : now >= seam.start
        ? 1
        : 0;
    at = seam.s0 + (-seam.dir * end() - seam.s0) * ease(t);
    // --edge is the seam's distance right of the panel's own centre, where
    // its gradient's 50% lies. Panels are the track's width and height, so a
    // panel's centre is (index * width - scrollLeft) right of the track's, at
    // the same height (no correction for the edge's lean is needed).
    for (const p of [seam.from, seam.to])
      p.style.setProperty("--edge", `${at - (panels.indexOf(p) * w - track!.scrollLeft)}px`);

    if (t >= 1 && still) {
      // Done and at rest. If the track came to rest somewhere else (a fling
      // past the next panel, a jump with no aim), the seam crosses again from
      // the panel just shown to that one, so no panel stays hidden in view.
      if (still === seam.to) settle(still);
      else {
        const dir = panels.indexOf(still) > panels.indexOf(seam.to) ? 1 : -1;
        seam = go(seam.to, still, dir, dir * end(), now);
      }
    }
    if (seam && (t < 1 || moving || still)) schedule();
  }

  track.addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  teardown = () => {
    cancelAnimationFrame(frame);
    track.removeEventListener("scroll", schedule);
    removeEventListener("resize", schedule);
  };
}

// A jump to a panel by a link (the menu, the hero's arrow) says where the
// track is headed, so the seam runs straight to it and the panels passed on
// the way stay hidden.
document.addEventListener(
  "click",
  (e) => {
    const link = (e.target as Element | null)?.closest?.("a");
    const track = document.querySelector<HTMLElement>("[data-track]");
    if (!link || !track || !link.hash || link.pathname !== location.pathname) return;
    const index = panelsOf(track).findIndex((s) => `#${s.id}` === link.hash);
    if (index >= 0) setAim(index);
  },
  { capture: true },
);

document.addEventListener("astro:page-load", () => arm());
// Crossing the sm breakpoint switches between side-by-side and stacked panels.
wide.addEventListener("change", () => arm());
reduced.addEventListener("change", () => arm());
// This module can first load on a page turn to home (it is only on the home
// page), after that page's astro:page-load has gone by.
arm();
