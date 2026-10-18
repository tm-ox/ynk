// Gives each archive thumbnail its place in the rise-in as a number (--d on
// its li), so the grid fills along the site's diagonal, top-left first,
// instead of in reading order. Rows and columns are read from where the cells
// actually sit, so it holds at every column count (2 to 12) without a table.

// The front's lean is --wipe-angle's: a 122deg gradient runs 32deg below
// horizontal, so equal-order cells lie on a line rising at 58deg, like the
// logo's strokes. One column step then costs 1 and one row step costs
// tan(32deg) of that, scaled by how much taller a row is than a column is
// wide (rows carry a title and rules), so the front leans at the real angle
// and not just in cell counts.
const TAN_LEAN = Math.tan((32 * Math.PI) / 180);

const ranks = (values: number[]) => {
    const sorted = [...new Set(values.map(Math.round))].sort((a, b) => a - b);
    return { index: (v: number) => sorted.indexOf(Math.round(v)), sorted };
};

const stagger = (grid: HTMLElement) => {
    const cells = [...grid.children].filter(
        (el): el is HTMLElement => el instanceof HTMLElement && !!el.querySelector(".thumb"),
    );
    if (!cells.length) return;
    const cols = ranks(cells.map((c) => c.offsetLeft));
    const rows = ranks(cells.map((c) => c.offsetTop));
    const pitch = (sorted: number[]) =>
        sorted.length > 1 ? (sorted[sorted.length - 1] - sorted[0]) / (sorted.length - 1) : 0;
    const colPitch = pitch(cols.sorted);
    const rowPitch = pitch(rows.sorted);
    const k = colPitch && rowPitch ? (TAN_LEAN * rowPitch) / colPitch : TAN_LEAN;
    for (const c of cells) {
        const d = cols.index(c.offsetLeft) + rows.index(c.offsetTop) * k;
        c.style.setProperty("--d", d.toFixed(2));
    }
};

document.addEventListener("astro:page-load", () => {
    document.querySelectorAll<HTMLElement>(".gallery-grid").forEach(stagger);
});
