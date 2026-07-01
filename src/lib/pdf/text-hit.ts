/**
 * Hit-test a point against a page's text runs, so a double-click can find the
 * text the user means to edit.
 *
 * Boxes come from `getPageTextItems`, in the source page's *unrotated* point
 * space (top-left origin). Inline editing is only wired for unrotated slots
 * (`rotation === 0`), so the caller passes the point directly in that space.
 */
import type { PDFDocumentProxy } from "pdfjs-dist";

import { getPageTextItems, type TextItemBox } from "./text-items";

// Per-file cache of extracted runs (cleared when the open file changes).
const cache = new Map<number, TextItemBox[]>();
let cacheToken: unknown = null;

/** Drop cached runs (call when the document changes). */
export function clearTextHitCache() {
  cache.clear();
  cacheToken = null;
}

async function itemsFor(
  proxy: PDFDocumentProxy,
  src: number,
  token: unknown,
): Promise<TextItemBox[]> {
  if (token !== cacheToken) {
    cache.clear();
    cacheToken = token;
  }
  let items = cache.get(src);
  if (!items) {
    items = await getPageTextItems(proxy, src);
    cache.set(src, items);
  }
  return items;
}

/**
 * Return the text run under `point` (page points, top-left origin), or null.
 *
 * Hit-testing is deliberately forgiving so a double-click "just works" even when
 * it lands in the kerning gap between runs, on the space between two words, or a
 * hair outside a glyph box:
 *  1. Each run's box is grown by font-size-proportional slack (wider sideways,
 *     and downward to cover descenders). Overlapping boxes resolve to the
 *     smallest (most specific) run.
 *  2. If nothing contains the point, we snap to the *nearest* run within a tight
 *     radius — so a click between words picks the adjacent word — while a click
 *     out in a blank margin still resolves to nothing.
 *
 * `token` keys the cache — pass the current `File` so it invalidates on reopen.
 */
export async function findTextRunAt(
  proxy: PDFDocumentProxy,
  src: number,
  point: { x: number; y: number },
  token: unknown,
): Promise<TextItemBox | null> {
  if (src <= 0) return null;
  const items = await itemsFor(proxy, src, token);

  let best: TextItemBox | null = null;
  let bestArea = Infinity;
  let nearest: TextItemBox | null = null;
  let nearestDist = Infinity;

  for (const it of items) {
    if (!it.str.trim()) continue;
    const size = it.size || it.height || 10;
    const slackX = Math.max(1.5, 0.3 * size);
    const slackTop = Math.max(2, 0.2 * it.height);
    const slackBottom = Math.max(2.5, 0.35 * size); // descenders + leading

    const within =
      point.x >= it.x - slackX &&
      point.x <= it.x + it.width + slackX &&
      point.y >= it.y - slackTop &&
      point.y <= it.y + it.height + slackBottom;
    if (within) {
      const area = Math.max(it.width, 1) * Math.max(it.height, 1);
      if (area < bestArea) {
        best = it;
        bestArea = area;
      }
      continue;
    }

    // Distance from the point to the (un-slacked) box, for the snap fallback.
    const dx =
      point.x < it.x
        ? it.x - point.x
        : point.x > it.x + it.width
          ? point.x - (it.x + it.width)
          : 0;
    const dy =
      point.y < it.y
        ? it.y - point.y
        : point.y > it.y + it.height
          ? point.y - (it.y + it.height)
          : 0;
    const dist = Math.hypot(dx, dy);
    const radius = Math.max(6, 0.9 * size);
    if (dist < radius && dist < nearestDist) {
      nearest = it;
      nearestDist = dist;
    }
  }
  return best ?? nearest;
}
