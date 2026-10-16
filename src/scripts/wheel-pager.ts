import { PAGING } from "../utils/transitions";

interface PagerOptions {
  /** The paging container, or null when this page does not page. */
  root: () => Element | null;
  /** Whether there is somewhere to go in this direction. */
  canStep: (dir: 1 | -1) => boolean;
  /** Move one item in this direction. */
  step: (dir: 1 | -1) => void;
}

// Can this element scroll further in the wheel's direction?
export const canScroll = (el: Element, dy: number) => {
  const isDoc = el === document.documentElement;
  const scroller = isDoc ? document.scrollingElement! : (el as HTMLElement);
  if (scroller.scrollHeight <= scroller.clientHeight) return false;
  if (!isDoc) {
    const overflow = getComputedStyle(el).overflowY;
    if (overflow !== "auto" && overflow !== "scroll") return false;
  }
  return dy > 0
    ? scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1
    : scroller.scrollTop > 0;
};

/**
 * Pages through items with the mouse wheel. Anything scrollable under the
 * pointer (a column, or the page itself) uses the wheel first; paging only
 * happens once it is at its end and the wheel has been quiet for a moment.
 * A trackpad's continuous flick counts as one gesture. Bound once per page
 * load of the router (module scripts are not re-run on navigation).
 */
export function bindWheelPager({ root, canStep, step }: PagerOptions) {
  let lastWheel = 0;
  let lockUntil = 0;
  let holdUntil = 0;

  document.addEventListener(
    "wheel",
    (e) => {
      const container = root();
      if (!container || e.ctrlKey) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // native horizontal
      const dir = e.deltaY > 0 ? 1 : -1;
      const now = Date.now();
      const isNewGesture = now - lastWheel > PAGING.gestureGap;
      lastWheel = now;

      for (
        let el = e.target as Element | null;
        el && el !== container.parentElement;
        el = el.parentElement
      ) {
        if (el !== container || container === document.documentElement) {
          if (canScroll(el, e.deltaY)) {
            holdUntil = now + PAGING.hold;
            return;
          }
        }
      }
      if (!canStep(dir)) return; // nowhere to go: leave the wheel alone
      e.preventDefault();
      if (now < holdUntil) {
        holdUntil = now + PAGING.hold;
        return;
      }
      if (!isNewGesture || now < lockUntil) return;
      lockUntil = now + PAGING.lock;
      step(dir);
    },
    { passive: false },
  );
}
