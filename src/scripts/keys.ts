import { navigate } from "astro:transitions/client";
import { canScroll } from "./wheel-pager";
import { pageTrack, panelIndex, track, trackActive } from "./track";

/** Pixels one j/k/ArrowDown/ArrowUp press scrolls. */
const SCROLL_STEP = 80;

const LEFT = ["ArrowLeft", "h"];
const RIGHT = ["ArrowRight", "l"];
const DOWN = ["ArrowDown", "j"];
const UP = ["ArrowUp", "k"];

const CLOSE_LINKS =
  'a[data-close], a[aria-label="Back to home"]';

// Past the end of a section the arrows carry on into the neighbouring one:
// home panels (Featured is last) -> Events archive -> Images archive -> About
// -> Contact, and back. Within an archive the Previous / Next links page it,
// so these only run at its ends, where the link is missing.
const archive = (name: string) => new RegExp(`^/${name}/(\\d+/)?$`).test(location.pathname);
const page = (name: string) => new RegExp(`^/${name}/?$`).test(location.pathname);
// An archive's last page, as the nav has it (BaseLayout.astro).
const last = (section: string, fallback: string) =>
  document.querySelector<HTMLAnchorElement>(`#main-nav a[data-section="${section}"][data-last]`)?.dataset.last ??
  fallback;
const beyond = (dir: 1 | -1): string | undefined => {
  if (dir > 0) {
    if (location.pathname === "/" && trackActive()) return "/events/";
    if (archive("events")) return "/images/";
    if (archive("images")) return "/about/";
    if (page("about")) return "/contact/";
  } else {
    // Back to home at the panel next to the events archive.
    if (archive("events")) return "/#events";
    // Back into the previous archive at its last page, so pages stay in order.
    if (archive("images")) return last("events-page", "/events/");
    if (page("about")) return last("images-page", "/images/");
    if (page("contact")) return "/about/";
  }
};

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
