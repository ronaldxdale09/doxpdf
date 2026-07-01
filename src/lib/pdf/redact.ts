/**
 * Secure redaction — turns "redaction" annotations into *true* content removal.
 *
 * Painting a black box over text does NOT remove it: the characters underneath
 * stay selectable and copy/extractable. That's the classic (and repeatedly
 * catastrophic) redaction leak. To guarantee removal we take every page that has
 * a redaction, **rasterize** it (so no text, vector, or image data survives),
 * paint the solid bars onto the raster, and rebuild that page as a flattened
 * image. Pages with no redactions are copied untouched, so their text stays
 * selectable.
 *
 * `verifyRedactions` re-opens the output and proves the removal: redacted pages
 * yield no extractable text, and no redacted string appears anywhere.
 */
import { PDFDocument } from "pdf-lib";

import { pdfjs } from "./setup";

export interface RedactRegion {
  /** In the page's *displayed* point space (top-left origin) — annotation coords. */
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

/**
 * Rebuild `bytes`, flattening every page that has redaction regions into a
 * rasterized image with the bars painted solid. `regionsByPage` is keyed by
 * 0-based output page index. Returns the rebuilt (unsaved) document so the caller
 * can stamp metadata and serialize.
 */
export async function applyRedactions(
  bytes: Uint8Array,
  regionsByPage: Map<number, RedactRegion[]>,
  scale = 2,
): Promise<PDFDocument> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const task = pdfjs.getDocument({ data: bytes.slice() });
  const pdfjsDoc = await task.promise;

  try {
    const count = src.getPageCount();
    for (let i = 0; i < count; i++) {
      const regions = regionsByPage.get(i);
      if (!regions || regions.length === 0) {
        const [copied] = await out.copyPages(src, [i]);
        out.addPage(copied);
        continue;
      }
      const page = await pdfjsDoc.getPage(i + 1);
      const canvas = document.createElement("canvas");
      try {
        const viewport = page.getViewport({ scale });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context for redaction raster");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        // Paint the solid bars (displayed points → px).
        for (const r of regions) {
          ctx.fillStyle = r.color || "#000000";
          ctx.fillRect(r.x * scale, r.y * scale, r.width * scale, r.height * scale);
        }
        const png = await out.embedPng(canvas.toDataURL("image/png"));
        // The raster already carries the page's rotation, so size the new page to
        // the displayed (rotated) dimensions and draw the image full-bleed.
        const dispW = viewport.width / scale;
        const dispH = viewport.height / scale;
        const np = out.addPage([dispW, dispH]);
        np.drawImage(png, { x: 0, y: 0, width: dispW, height: dispH });
      } finally {
        page.cleanup();
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  } finally {
    await pdfjsDoc.destroy();
  }

  return out;
}

export interface RedactionReport {
  ok: boolean;
  /** Output page indices that were redacted (flattened). */
  redactedPages: number[];
  /** Redacted pages that still yielded extractable text (should be empty). */
  leakyPages: number[];
  /** Redacted strings that still appear somewhere (should be empty). */
  residualStrings: string[];
}

/**
 * Prove the redaction worked: redacted pages must have no extractable text, and
 * none of `redactedStrings` may appear anywhere in the output.
 */
export async function verifyRedactions(
  bytes: Uint8Array,
  redactedPageIndices: number[],
  redactedStrings: string[] = [],
): Promise<RedactionReport> {
  const task = pdfjs.getDocument({ data: bytes.slice() });
  const doc = await task.promise;
  const leakyPages: number[] = [];
  const needles = redactedStrings
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length >= 3);
  const residual = new Set<string>();
  const redacted = new Set(redactedPageIndices);

  try {
    for (let i = 0; i < doc.numPages; i++) {
      const page = await doc.getPage(i + 1);
      try {
        const content = await page.getTextContent();
        const text = content.items
          .map((it) => ("str" in it ? it.str : ""))
          .join(" ");
        if (redacted.has(i) && text.trim().length > 0) leakyPages.push(i);
        const hay = text.toLowerCase();
        for (const n of needles) if (hay.includes(n)) residual.add(n);
      } finally {
        page.cleanup();
      }
    }
  } finally {
    await doc.destroy();
  }

  return {
    ok: leakyPages.length === 0 && residual.size === 0,
    redactedPages: [...redacted].sort((a, b) => a - b),
    leakyPages,
    residualStrings: [...residual],
  };
}
