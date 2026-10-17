// Home panels fade up as they scroll into view (sm and up; the CSS in
// global.css is gated on prefers-reduced-motion, so this only toggles state).
// The panel already in view on arrival is left alone, as is the hero, so
// nothing fights the page-to-page morphs. A panel resets once fully out of
// view, so it plays again each time you come back to it.
let observer: IntersectionObserver | null = null;

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
    [...s.children].forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(Math.min(i, 4))));
    if ([...track.children].indexOf(s) !== current) out(s);
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const { target, intersectionRatio, isIntersecting } of entries) {
        const s = target as HTMLElement;
        if (intersectionRatio >= 0.5) s.dataset.reveal = "in";
        else if (!isIntersecting && s.dataset.reveal === "in") out(s);
      }
    },
    { root: track, threshold: [0, 0.5] },
  );
  sections.forEach((s) => observer!.observe(s));
}

document.addEventListener("astro:page-load", arm);
