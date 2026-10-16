import type { TransitionDirectionalAnimations } from "astro";

/** Site-wide timing for paging between items (events, photos, home panels). */
export const PAGING = {
  /** Slide between detail pages. */
  slideDuration: "0.35s",
  slideEasing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  /** Wheel gestures: events closer together than this are one gesture (ms). */
  gestureGap: 120,
  /** Minimum time between page changes (ms). */
  lock: 600,
  /** Quiet time needed after an inner area scrolled before paging (ms). */
  hold: 600,
};

const timing = {
  duration: PAGING.slideDuration,
  easing: PAGING.slideEasing,
  fillMode: "both" as const,
};

/**
 * Horizontal slide for detail pages. Keyframes live in global.css.
 * Forward (Next) moves left, back (Previous) moves right.
 */
export const slide: TransitionDirectionalAnimations = {
  forwards: {
    old: { name: "slide-out-left", ...timing },
    new: { name: "slide-in-right", ...timing },
  },
  backwards: {
    old: { name: "slide-out-right", ...timing },
    new: { name: "slide-in-left", ...timing },
  },
};
