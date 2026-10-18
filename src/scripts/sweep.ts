// A panel (Settings, the phone menu) shown and hidden like a page turn: the
// page turn's edge and line (see the page turn rules in global.css) cross its
// own box, right to left to show it and back to hide it, with
// --page-seam-easing. `duration` and `fade` name the panel's own tokens: how
// long the edge takes to cross it, and with reduced motion how long it only
// fades instead.
//
// The edge is a line on screen at the logo's angle: ex is where it crosses
// the panel's mid-height, and it leans tan 32deg sideways per unit of height.
// The panel shows what is right of it; its contents start --page-band further
// right, and in that gap the line rides between two strips of the panel's
// background, as on a page turn. Every clip is a polygon in its own box, so
// the contents' clip follows them however far they are scrolled. The line is
// `seam` (a .sweep-seam, global.css), laid over the panel's box, whose edges
// cut it off: it never shows outside the panel.
//
// Resolves when it is done; rejects if it is cancelled. Hidden, it holds the
// panel clipped away (fill forwards) until the caller cancels it. The panel
// carries data-closing while it turns away, which keeps the line showing if
// that cuts an opening short.
const TAN = Math.tan((32 * Math.PI) / 180);

const ms = (style: CSSStyleDeclaration, name: string) => {
  const value = style.getPropertyValue(name).trim();
  return value.endsWith("ms") ? parseFloat(value) : parseFloat(value) * 1000;
};

export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function sweep(
  panel: HTMLElement,
  contents: HTMLElement,
  seam: HTMLElement,
  show: boolean,
  { duration, fade }: { duration: string; fade: string },
) {
  const style = getComputedStyle(panel);
  const fill: FillMode = show ? "none" : "forwards";
  if (reduced()) {
    return panel.animate({ opacity: show ? [0, 1] : [1, 0] }, { duration: ms(style, fade), easing: "ease", fill }).finished;
  }
  const line = seam.firstElementChild as HTMLElement;
  const box = panel.getBoundingClientRect();
  const inner = contents.getBoundingClientRect();
  const halo = parseFloat(style.getPropertyValue("--page-halo")) || 0;
  const band = (parseFloat(style.getPropertyValue("--wipe-line")) || 0) + 2 * halo;
  const mid = box.top + box.height / 2;
  const lean = (box.height / 2) * TAN;
  // Hidden: the edge's foot is at the box's right side. Shown: the line and
  // the gap are past its left side at the top.
  const hidden = box.right + lean;
  const shown = box.left - lean - band;
  const [from, to] = show ? [hidden, shown] : [shown, hidden];
  const clip = (b: DOMRect, ex: number, gap: number) => {
    const x = (y: number) => ex + (mid - y) * TAN + gap - b.left;
    // The top and bottom run a little past the box (by `over`, the edge
    // still on the same line), so the clip never trims the borders: the box
    // can sit on a fractional pixel where the clip's edge would antialias
    // the rule thinner until the clip comes off.
    const over = 4;
    return `polygon(${x(b.top - over)}px ${-over}px, 10000px ${-over}px, 10000px ${b.height + over}px, ${x(b.bottom + over)}px ${b.height + over}px)`;
  };
  const timing = { duration: ms(style, duration), easing: style.getPropertyValue("--page-seam-easing").trim(), fill };
  // The window is fixed, so it stays put while the panel scrolls. Its
  // containing block is the viewport, or a fixed ancestor with a backdrop
  // filter (the header): placed, then moved by however far that put it off.
  seam.hidden = false;
  Object.assign(seam.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
  const placed = seam.getBoundingClientRect();
  Object.assign(seam.style, { left: `${2 * box.left - placed.left}px`, top: `${2 * box.top - placed.top}px` });
  return Promise.all(
    [
      panel.animate({ clipPath: [clip(box, from, 0), clip(box, to, 0)] }, timing),
      contents.animate({ clipPath: [clip(inner, from, band), clip(inner, to, band)] }, timing),
      line.animate({ translate: [`${from + halo - box.left}px 0`, `${to + halo - box.left}px 0`] }, timing),
    ].map((a) => a.finished),
  ).finally(() => {
    // Unless it was cut short by a close, which needs the line again.
    if (show && !panel.hasAttribute("data-closing")) seam.hidden = true;
  });
}
