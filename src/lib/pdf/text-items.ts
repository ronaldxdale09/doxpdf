import type { PDFDocumentProxy } from "pdfjs-dist";

export interface TextItemBox {
  str: string;
  /** Box in source (unrotated) page points, top-left origin. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** PDF.js internal font reference (`loadedName`, e.g. "g_d0_f1"). */
  fontName: string;
  /** Glyph size in points (from the text matrix), used as the edit font size. */
  size: number;
}

/**
 * Text runs with positions, in the page's unrotated point space (top-left
 * origin). Assumes a source page rotation of 0 (the common case).
 */
export async function getPageTextItems(
  proxy: PDFDocumentProxy,
  pageNumber: number,
): Promise<TextItemBox[]> {
  const page = await proxy.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1, rotation: 0 });
  const pageHeight = viewport.height;
  const content = await page.getTextContent();

  const items: TextItemBox[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    const tx = item.transform as number[];
    const x = tx[4];
    const baseline = tx[5];
    const size = Math.hypot(tx[2], tx[3]) || item.height || 10;
    const height = item.height || size;
    items.push({
      str: item.str,
      x,
      y: pageHeight - (baseline + height),
      width: item.width,
      height,
      fontName: "fontName" in item ? (item.fontName as string) : "",
      size,
    });
  }
  return items;
}
