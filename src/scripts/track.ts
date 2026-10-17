// Paging for the home page's horizontal track of panels (sm and up).
const wide = window.matchMedia("(min-width: 40rem)");

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const track = () => document.querySelector<HTMLElement>("[data-track]");
export const trackActive = () => (wide.matches ? track() : null);

/** The panels of the track. The track also holds stray <style> elements, so never index its raw children. */
export const panelsOf = (t: HTMLElement) => [...t.querySelectorAll<HTMLElement>(":scope > section")];
const count = (t: HTMLElement) => panelsOf(t).length;
export const panelIndex = (t: HTMLElement) => Math.round(t.scrollLeft / t.clientWidth);

/** Scrolls the track one panel; returns false when there is no active track. */
export function pageTrack(dir: 1 | -1) {
  const t = trackActive();
  if (!t) return false;
  const next = Math.min(Math.max(panelIndex(t) + dir, 0), count(t) - 1);
  t.scrollTo({ left: next * t.clientWidth, behavior: reduced() ? "auto" : "smooth" });
  return true;
}
