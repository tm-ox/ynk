// The row of screens, left to right: home (the hero), Featured, the events
// archive, the images archive (an event's own pictures included), About,
// Contact. Page turns (Base.astro), the arrow keys and the wheel
// (scripts/step.ts), the nav and the position line (BaseLayout.astro) all
// follow this order. Detail pages, privacy and 404 are not in the row.


export interface Screen {
  /** The nav link's data-section, and its transition name. */
  name: string;
  label: string;
  /** Its first page. */
  href: string;
  /** Its pages (slashless typed by hand too). */
  match: RegExp;
  /** An archive, paged by Previous / Next. Going back onto it lands on its
   *  last page, so the pages run in order. */
  paged?: boolean;
}

export const ROW: Screen[] = [
  { name: "home", label: "Home", href: "/", match: /^\/$/ },
  { name: "featured", label: "Featured", href: "/featured/", match: /^\/featured\/?$/ },
  { name: "events", label: "Events", href: "/events/", match: /^\/events(\/(\d+\/?)?)?$/, paged: true },
  {
    name: "images",
    label: "Images",
    href: "/images/",
    match: /^\/images(\/(\d+\/?)?)?$|^\/images\/event\/[^/]+(\/(\d+\/?)?)?$/,
    paged: true,
  },
  { name: "about", label: "About", href: "/about/", match: /^\/about\/?$/ },
  { name: "contact", label: "Contact", href: "/contact/", match: /^\/contact\/?$/ },
];

/** Where a path sits in the row, or undefined when it is not in it. */
export const screenOf = (pathname: string) => {
  const i = ROW.findIndex((s) => s.match.test(pathname));
  return i < 0 ? undefined : i;
};

/** Which page of its screen a path is, from 1. An event's own pictures count
 *  as the images archive's first page. */
export const pageOf = (pathname: string) =>
  pathname.startsWith("/images/event/") ? 1 : Number(pathname.match(/\/(\d+)\/?$/)?.[1] ?? 1);

/**
 * The screen next along from a path's, `dir` one way: its first page going
 * forward, its last going back (`last` gives an archive's). Undefined at the
 * row's ends and off the row. An event's own pictures are a branch of the
 * images archive rather than one of its pages, so they lead nowhere either.
 */
export const neighbour = (
  pathname: string,
  dir: 1 | -1,
  last: (s: Screen) => string | undefined,
) => {
  const i = screenOf(pathname);
  if (i === undefined || pathname.startsWith("/images/event/")) return;
  const to = ROW[i + dir];
  if (!to) return;
  return dir < 0 && to.paged ? (last(to) ?? to.href) : to.href;
};
