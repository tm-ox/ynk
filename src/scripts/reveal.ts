// Home panels fade in (columns alternately rising and falling) as they scroll into view (sm and up; the CSS in
// global.css is gated on prefers-reduced-motion, so this only toggles state).
// The panel already in view on arrival is left alone, as is the hero, so
// nothing fights the page-to-page morphs. A panel resets once fully out of
// view, so it plays again each time you come back to it.
let observer: IntersectionObserver | null = null;

function mark(el: HTMLElement | undefined, order: number, dir: number) {
  if (!el) return;
  el.dataset.revealItem = "";
  el.style.setProperty("--i", String(order));
  el.style.setProperty("--dir", String(dir));
}

function arm() {
  observer?.disconnect();
  observer = null;

  const track = document.querySelector<HTMLElement>("[data-track]");
  if (!track || !matchMedia("(min-width: 40rem)").matches) return;

  const sections = [...track.querySelectorAll<HTMLElement>(":scope > section:not(#top)")];
  const current = Math.round(track.scrollLeft / track.clientWidth);
  const out = (s: HTMLElement) => {
    s.dataset.reveal = "out";
  };

  for (const s of sections) {
    // The label bar only fades. The content below it is a row of columns: the
    // first rises, the next falls, and so on, arriving together.
    const [bar, body] = s.children as unknown as HTMLElement[];
    mark(bar, 0, 0);
    [...(body?.children ?? [])].forEach((c, i) => mark(c as HTMLElement, 1, i % 2 === 0 ? 1 : -1));
    if ([...track.children].indexOf(s) !== current) out(s);
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const { target, intersectionRatio } of entries) {
        const s = target as HTMLElement;
        if (intersectionRatio >= 0.5) s.dataset.reveal = "in";
        // Ratio 0, not isIntersecting: a neighbouring panel touching the edge
        // still counts as intersecting, so it would never reset.
        else if (intersectionRatio === 0 && s.dataset.reveal === "in") out(s);
      }
    },
    { root: track, threshold: [0, 0.5] },
  );
  sections.forEach((s) => observer!.observe(s));
}

document.addEventListener("astro:page-load", arm);
