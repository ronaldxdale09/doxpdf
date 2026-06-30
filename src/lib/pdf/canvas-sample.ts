/**
 * Sample the background and text color of a text run from the rendered page
 * canvas, so an inline edit can cover the original on its real background and
 * redraw in its real ink color.
 *
 * Heuristic: over the run's pixels, the **mode** color is the background; the
 * frequent color that differs most from it is the ink. This handles both
 * dark-on-light and light-on-dark without assuming white paper.
 */

export interface SampledColors {
  /** Background fill to cover the original glyphs. */
  background: string;
  /** Ink color to redraw the text in. */
  text: string;
}

const DEFAULT: SampledColors = { background: "#ffffff", text: "#18181b" };

function toHex(r: number, g: number, b: number): string {
  const h = (v: number) => v.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Page-point box → integer canvas-pixel rect, clamped to the canvas. */
function pixelRect(
  canvas: HTMLCanvasElement,
  box: { x: number; y: number; width: number; height: number },
  pageWidthPt: number,
  pageHeightPt: number,
) {
  const sx = canvas.width / pageWidthPt;
  const sy = canvas.height / pageHeightPt;
  const x = Math.max(0, Math.floor(box.x * sx));
  const y = Math.max(0, Math.floor(box.y * sy));
  const w = Math.min(canvas.width - x, Math.ceil(box.width * sx));
  const h = Math.min(canvas.height - y, Math.ceil(box.height * sy));
  return { x, y, w, h };
}

/**
 * Sample colors for `box` (page points, top-left origin) from `canvas`.
 * `pageWidthPt`/`pageHeightPt` are the page's displayed size in points, used to
 * map points → canvas pixels. Returns sensible defaults on any failure.
 */
export function sampleRunColors(
  canvas: HTMLCanvasElement | null,
  box: { x: number; y: number; width: number; height: number },
  pageWidthPt: number,
  pageHeightPt: number,
): SampledColors {
  if (!canvas || pageWidthPt <= 0 || pageHeightPt <= 0) return DEFAULT;
  const { x, y, w, h } = pixelRect(canvas, box, pageWidthPt, pageHeightPt);
  if (w <= 0 || h <= 0) return DEFAULT;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return DEFAULT;

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(x, y, w, h).data;
  } catch {
    return DEFAULT; // tainted canvas — shouldn't happen for local renders
  }

  // Quantize to 16-level buckets and count, tracking each bucket's mean color.
  const counts = new Map<number, { n: number; r: number; g: number; b: number }>();
  const step = Math.max(1, Math.floor((w * h) / 4000)); // cap work on big runs
  for (let i = 0; i < w * h; i += step) {
    const p = i * 4;
    const a = data[p + 3];
    if (a < 8) continue; // skip transparent
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const e = counts.get(key);
    if (e) {
      e.n++;
      e.r += r;
      e.g += g;
      e.b += b;
    } else {
      counts.set(key, { n: 1, r, g, b });
    }
  }
  if (counts.size === 0) return DEFAULT;

  const buckets = [...counts.values()].map((e) => ({
    n: e.n,
    r: Math.round(e.r / e.n),
    g: Math.round(e.g / e.n),
    b: Math.round(e.b / e.n),
  }));
  buckets.sort((a, b) => b.n - a.n);

  const bg = buckets[0];
  const dist = (c: { r: number; g: number; b: number }) =>
    Math.abs(c.r - bg.r) + Math.abs(c.g - bg.g) + Math.abs(c.b - bg.b);

  // Ink: the most frequent bucket that's clearly different from the background.
  let ink = buckets.find((c) => dist(c) > 60) ?? null;
  if (!ink) {
    // Low-contrast run (e.g. faint text) — take the farthest bucket instead.
    ink = buckets.reduce((a, c) => (dist(c) > dist(a) ? c : a), bg);
  }

  return {
    background: toHex(bg.r, bg.g, bg.b),
    text: ink && ink !== bg ? toHex(ink.r, ink.g, ink.b) : DEFAULT.text,
  };
}
