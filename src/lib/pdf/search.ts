import { rotateAnnotationGeometry } from "@/lib/annotations/geometry";
import { useDocumentStore } from "@/store/document-store";
import { type SearchMatch, useSearchStore } from "@/store/search-store";

import { getPageTextItems, type TextItemBox } from "./text-items";

const itemCache = new Map<number, TextItemBox[]>();
let cacheFile: File | null = null;

/** Find all occurrences of `query` and populate the search store with boxes. */
export async function runSearch(query: string, caseSensitive: boolean) {
  const search = useSearchStore.getState();
  const { pdfProxy, pages, file, pageSizes, defaultPageSize } =
    useDocumentStore.getState();

  if (file !== cacheFile) {
    itemCache.clear();
    cacheFile = file;
  }
  if (!query.trim() || !pdfProxy) {
    search.setMatches([]);
    return;
  }

  search.setSearching(true);
  try {
    const needle = caseSensitive ? query : query.toLowerCase();
    const matches: SearchMatch[] = [];
    let counter = 0;

    for (let i = 0; i < pages.length; i++) {
      const slot = pages[i];
      if (slot.src === 0) continue;

      let items = itemCache.get(slot.src);
      if (!items) {
        items = await getPageTextItems(pdfProxy, slot.src);
        itemCache.set(slot.src, items);
      }

      for (const item of items) {
        const hay = caseSensitive ? item.str : item.str.toLowerCase();
        const len = item.str.length || 1;
        let from = 0;
        let idx: number;
        while ((idx = hay.indexOf(needle, from)) !== -1) {
          let box = {
            x: item.x + (idx / len) * item.width,
            y: item.y,
            width: (needle.length / len) * item.width,
            height: item.height,
          };
          if (slot.rotation) {
            const src = pageSizes[slot.src] ?? defaultPageSize;
            if (src) {
              box = {
                ...box,
                ...rotateAnnotationGeometry(
                  box,
                  0,
                  slot.rotation,
                  src.width,
                  src.height,
                ),
              };
            }
          }
          matches.push({
            id: `m${counter++}`,
            slotId: slot.id,
            order: i,
            ...box,
          });
          from = idx + Math.max(needle.length, 1);
        }
      }
    }
    search.setMatches(matches);
  } finally {
    search.setSearching(false);
  }
}
