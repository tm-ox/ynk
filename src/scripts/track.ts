// Paging for the home page's horizontal track of panels (sm and up).
import { navigate } from "astro:transitions/client";
import { placePosition } from "./position";

const wide = window.matchMedia("(min-width: 40rem)");

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const track = () => document.querySelector<HTMLElement>("[data-track]");
export const trackActive = () => (wide.matches ? track() : null);

/** The panels of the track. The track also holds stray <style> elements, so never index its raw children. */
export const panelsOf = (t: HTMLElement) => [...t.querySelectorAll<HTMLElement>(":scope > section")];
const count = (t: HTMLElement) => panelsOf(t).length;
export const panelIndex = (t: HTMLElement) => Math.round(t.scrollLeft / t.clientWidth);

// tan 32deg: how far the seam (rising at 58 degrees) leans sideways per pixel
// of height.
const SLANT = 0.6249;
/**
 * global.css draws a page turn's seam relative to each snapshot's own box,
 * assuming it is centred on the screen. A box that is not (an archive grid
 * sits lower than the home track, and below xl runs on past the screen) needs
 * this added to keep the outgoing and incoming edges one line: minus its
 * centre's offset right of the screen's centre, and the seam's lean over its
 * centre's offset below it.
 */
export const seamShift = (el: Element | null) => {
  if (!el) return "0px";
  const r = el.getBoundingClientRect();
  const dx = r.left + r.width / 2 - innerWidth / 2;
  const dy = r.top + r.height / 2 - innerHeight / 2;
  return `${-(dx + SLANT * dy)}px`;
};

// True while a step runs as a view transition. scripts/reveal.ts leaves the
// panels whole meanwhile: the transition's snapshots carry the seam.
let stepping = false;
export const trackStepping = () => stepping;

/**
 * Moves the track to panel `index` as a page turn: the same view transition
 * as moving between home and the archives (global.css, the .page rules), the
 * track being the .page group "home" at both ends. `move` makes the move
 * (otherwise it is a scroll), inside the transition's update, at once. With
 * reduced motion it is an instant scroll; without view transitions, the
 * smooth scroll it always was. A step asked for while one (or a page
 * navigation) is running is dropped: the wheel and keys already hold back a
 * burst, so it is a stray.
 */
function step(t: HTMLElement, index: number, move?: () => void) {
  const go = (behavior: ScrollBehavior) => () => {
    move?.();
    t.scrollTo({ left: index * t.clientWidth, behavior });
    // Inside a transition's update, so the position line is where the move
    // ends when the new state is captured (its scroll event comes too late).
    placePosition(index);
  };
  if (reduced()) return go("instant")();
  if (!document.startViewTransition) return go("smooth")();
  const root = document.documentElement;
  if (stepping || root.hasAttribute("data-astro-transition")) return;
  const from = panelIndex(t);
  if (index === from) return move?.();

  stepping = true;
  // What global.css turns pages on, as Base.astro sets it for a page turn:
  // the way, the incoming group (.into, for the line) and the boxes' shift, the same
  // at both ends as the track itself does not move.
  root.setAttribute("data-astro-transition", index > from ? "paging-forward" : "paging-back");
  t.style.setProperty("view-transition-class", "page into");
  root.style.setProperty("--turn-old-shift", seamShift(t));
  root.style.setProperty("--turn-new-shift", seamShift(t));
  // Named parts inside the panels (the featured event, its flyer and label,
  // the featured pictures) would be captured on their own and not move with
  // the track: off for the step, then as they were.
  const named = [
    ...t.querySelectorAll<HTMLElement>('[data-astro-transition-scope], [style*="view-transition-name"]'),
  ].map((el) => [el, el.style.viewTransitionName] as const);
  named.forEach(([el]) => (el.style.viewTransitionName = "none"));
  // The move must be instant, a link's jump too (the track otherwise
  // scrolls smoothly, by CSS).
  t.style.scrollBehavior = "auto";
  const vt = document.startViewTransition(go("instant"));
  vt.finished.finally(() => {
    root.removeAttribute("data-astro-transition");
    t.style.removeProperty("view-transition-class");
    root.style.removeProperty("--turn-old-shift");
    root.style.removeProperty("--turn-new-shift");
    named.forEach(([el, name]) => (el.style.viewTransitionName = name));
    t.style.scrollBehavior = "";
    stepping = false;
  });
}

/** Moves the track one panel; returns false when there is no active track. */
export function pageTrack(dir: 1 | -1) {
  const t = trackActive();
  if (!t) return false;
  step(t, Math.min(Math.max(panelIndex(t) + dir, 0), count(t) - 1));
  return true;
}

// A link on home to one of its panels (the nav, the hero's arrow) turns to it
// the same way. The router still makes the move, inside the transition, so the
// hash and the history are as they were. Left to the router alone where there
// is nothing to turn: below sm, with reduced motion, without view
// transitions, or to the panel already in view.
document.addEventListener(
  "click",
  (e) => {
    const t = trackActive();
    const link = (e.target as Element | null)?.closest?.("a");
    if (
      !t ||
      !link ||
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      (link.target && link.target !== "_self") ||
      !link.hash ||
      link.origin !== location.origin ||
      link.pathname !== location.pathname ||
      reduced() ||
      !document.startViewTransition
    )
      return;
    const index = panelsOf(t).findIndex((s) => `#${s.id}` === link.hash);
    if (index < 0 || index === panelIndex(t)) return;
    e.preventDefault();
    step(t, index, () => navigate(link.href, { sourceElement: link }));
  },
  { capture: true },
);
