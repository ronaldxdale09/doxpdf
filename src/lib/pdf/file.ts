/**
 * Helpers for turning browser File/Blob objects into the byte buffers that
 * pdf-lib and pdf.js consume. Pure functions — safe to unit test.
 */

/** Read a File/Blob into a fresh Uint8Array. */
export async function fileToBytes(file: Blob): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

/** Best-effort PDF detection by MIME type or extension. */
export function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

/** Strip a file extension, e.g. "contract.pdf" -> "contract". */
export function getBaseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/**
 * Trigger a browser download for the given bytes. Creates a temporary object
 * URL and revokes it on the next tick to avoid leaking memory.
 */
export function downloadBytes(
  bytes: Uint8Array | ArrayBuffer,
  fileName: string,
  mimeType = "application/pdf",
): void {
  // Copy into a standalone ArrayBuffer so the Blob is never backed by a
  // possibly-detached or shared buffer.
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);

  downloadBlob(new Blob([copy.buffer], { type: mimeType }), fileName);
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
