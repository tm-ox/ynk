// Paging for the home page's horizontal track of panels (sm and up).
const wide = window.matchMedia("(min-width: 40rem)");

export const track = () => document.querySelector<HTMLElement>("[data-track]");
export const trackActive = () => (wide.matches ? track() : null);

const count = (t: HTMLElement) => t.querySelectorAll(":scope > section").length;
export const panelIndex = (t: HTMLElement) => Math.round(t.scrollLeft / t.clientWidth);

/** Scrolls the track one panel; returns false when there is no active track. */
export function pageTrack(dir: 1 | -1) {
  const t = trackActive();
  if (!t) return false;
  const next = Math.min(Math.max(panelIndex(t) + dir, 0), count(t) - 1);
  t.scrollTo({ left: next * t.clientWidth, behavior: "smooth" });
  return true;
}

const SETTLE_DELAY = 120; // ms of stillness before the track settles
const NUDGE = 0.04; // fraction of a panel that counts as "meant to move"

/**
 * Lands the track on a panel whenever it stops moving. Instead of CSS snapping
 * (which undoes small nudges), a nudge of more than NUDGE of a panel carries on
 * to the neighbour in that direction. Small steps from other input, such as a
 * browser extension's scroll keys, then page panel by panel. Bound once.
 */
export function bindTrackSettle() {
  let timer: number | undefined;
  document.addEventListener(
    "scroll",
    (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement) || !t.hasAttribute("data-track")) return;
      clearTimeout(timer);
      timer = window.setTimeout(() => settle(t), SETTLE_DELAY);
    },
    { capture: true, passive: true },
  );
}

function settle(t: HTMLElement) {
  if (!trackActive()) return;
  const pos = t.scrollLeft / t.clientWidth;
  const nearest = Math.round(pos);
  if (Math.abs(pos - nearest) < 0.01) {
    t.dataset.panel = String(nearest);
    return;
  }
  const from = Number(t.dataset.panel ?? nearest);
  const delta = pos - from;
  let target = nearest;
  if (Math.abs(delta) <= 1 && Math.abs(delta) > NUDGE) {
    target = from + Math.sign(delta);
  }
  target = Math.min(Math.max(target, 0), count(t) - 1);
  t.dataset.panel = String(target);
  t.scrollTo({ left: target * t.clientWidth, behavior: "smooth" });
}
