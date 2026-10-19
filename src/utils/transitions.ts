/**
 * Site-wide paging behaviour for the wheel. The page turn's own timing lives
 * in global.css (--seam-duration, --page-seam-easing).
 */
export const PAGING = {
  /** Wheel events closer together than this are one gesture (ms). */
  gestureGap: 120,
  /** Minimum time between page changes (ms): at least a page turn's length
   *  (--seam-duration, 0.55s), so wheeling on does not cut a turn short. */
  lock: 600,
  /** Quiet time needed after an inner area scrolled before paging (ms). */
  hold: 600,
};
