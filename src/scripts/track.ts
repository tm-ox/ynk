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
