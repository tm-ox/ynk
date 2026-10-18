/**
 * Site-wide paging behaviour for the wheel. The wipe's own timing lives in
 * global.css (--wipe-duration, --wipe-easing).
 */
export const PAGING = {
  /** Wheel events closer together than this are one gesture (ms). */
  gestureGap: 120,
  /** Minimum time between page changes (ms). */
  lock: 600,
  /** Quiet time needed after an inner area scrolled before paging (ms). */
  hold: 600,
};
