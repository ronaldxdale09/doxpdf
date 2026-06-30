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
 * A small vertical slack absorbs the gap between glyph box and click; when
 * several boxes overlap the point, the smallest (most specific) wins.
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
  const slackY = 2;

  let best: TextItemBox | null = null;
  let bestArea = Infinity;
  for (const it of items) {
    if (!it.str.trim()) continue;
    const within =
      point.x >= it.x &&
      point.x <= it.x + it.width &&
      point.y >= it.y - slackY &&
      point.y <= it.y + it.height + slackY;
    if (!within) continue;
    const area = Math.max(it.width, 1) * Math.max(it.height, 1);
    if (area < bestArea) {
      best = it;
      bestArea = area;
    }
  }
  return best;
}
