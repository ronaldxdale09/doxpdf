/**
 * Multi-format export. Everything is derived from the already-baked edited PDF
 * bytes (annotations + page ops applied), so images and text reflect the user's
 * edits. All client-side — nothing is uploaded.
 */
import { pdfjs } from "@/lib/pdf/setup";

import { downloadBlob } from "./file";

export type ImageFormat = "png" | "jpeg";

async function loadDoc(bytes: Uint8Array) {
  // Pass a copy — pdf.js transfers the buffer to its worker.
  return pdfjs.getDocument({ data: bytes.slice() }).promise;
}

/** Render every page to an image Blob. */
async function renderPages(
  bytes: Uint8Array,
  format: ImageFormat,
  scale = 2,
): Promise<Blob[]> {
  const doc = await loadDoc(bytes);
  const mime = format === "png" ? "image/png" : "image/jpeg";
  const blobs: Blob[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, mime, format === "jpeg" ? 0.92 : undefined),
    );
    if (blob) blobs.push(blob);
  }
  return blobs;
}

/** Export pages as images: a single image for one page, else a ZIP. */
export async function exportImages(
  bytes: Uint8Array,
  baseName: string,
  format: ImageFormat,
): Promise<void> {
  const blobs = await renderPages(bytes, format);
  if (blobs.length === 0) return;
  if (blobs.length === 1) {
    downloadBlob(blobs[0], `${baseName}.${format === "jpeg" ? "jpg" : "png"}`);
    return;
  }
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  blobs.forEach((blob, i) => {
    const n = String(i + 1).padStart(String(blobs.length).length, "0");
    zip.file(`${baseName}-${n}.${format === "jpeg" ? "jpg" : "png"}`, blob);
  });
  downloadBlob(await zip.generateAsync({ type: "blob" }), `${baseName}-images.zip`);
}

/** Extract the document's text (page-labelled). */
async function extractText(bytes: Uint8Array): Promise<string[]> {
  const doc = await loadDoc(bytes);
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((it) => ("str" in it ? it.str : ""))
        .join(" ")
        .replace(/\s+\n/g, "\n")
        .trim(),
    );
  }
  return pages;
}

export async function exportText(
  bytes: Uint8Array,
  baseName: string,
): Promise<void> {
  const pages = await extractText(bytes);
  const text = pages.join("\n\n");
  downloadBlob(new Blob([text], { type: "text/plain" }), `${baseName}.txt`);
}

export async function exportMarkdown(
  bytes: Uint8Array,
  baseName: string,
): Promise<void> {
  const pages = await extractText(bytes);
  const md = pages
    .map((text, i) => `## Page ${i + 1}\n\n${text}`)
    .join("\n\n---\n\n");
  downloadBlob(
    new Blob([`# ${baseName}\n\n${md}\n`], { type: "text/markdown" }),
    `${baseName}.md`,
  );
}
