// One step along, `dir` one way, as the arrow keys and the wheel both take
// it: Previous / Next where the page has them (an archive's pages, an event's
// or picture's neighbours). Past them, at a screen's end, the neighbouring
// screen of the row (utils/row.ts): home -> Featured -> Events archive ->
// Images archive -> About -> Contact, and back. Going back onto an archive
// lands on its last page, as the nav has it (BaseLayout.astro), so the pages
// run in order.
import { navigate } from "astro:transitions/client";
import { prefetch } from "astro:prefetch";
import { neighbour } from "../utils/row";

const link = (dir: 1 | -1) =>
  document.querySelector<HTMLAnchorElement>(`a[aria-label="${dir > 0 ? "Next" : "Previous"}"]`);

const last = (name: string) =>
  document.querySelector<HTMLAnchorElement>(`#main-nav a[data-section="${name}"][data-last]`)?.dataset.last;

/** The step to take, or undefined where there is nowhere to go. Looked up at
 *  the time, as the router swaps pages under bound listeners. */
export function stepFor(dir: 1 | -1): (() => void) | undefined {
  const a = link(dir);
  if (a) return () => a.click();
  const to = neighbour(location.pathname, dir, (s) => last(s.name));
  if (to) return () => navigate(to);
}

/** Prefetches the screens either side of this one, so a step past Previous /
 *  Next (swipe, key, wheel) finds the page already fetched, as the arrows'
 *  own targets are (data-astro-prefetch="load"). Run on each page load. */
export function prefetchNeighbours() {
  for (const dir of [1, -1] as const) {
    const to = neighbour(location.pathname, dir, (s) => last(s.name));
    if (to) prefetch(to);
  }
}
