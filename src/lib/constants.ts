/**
 * App-wide constants. Kept dependency-free so it can be imported from both
 * server and client modules.
 */

export const APP_NAME = "DoxPDF";
export const APP_TAGLINE = "Edit PDFs right in your browser";
export const APP_DESCRIPTION =
  "A fast, private, in-browser PDF editor. No account, no uploads, no watermarks — your files never leave your device.";

/** Discrete zoom stops surfaced in the UI (1 = 100%). */
export const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4] as const;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 6;
export const DEFAULT_ZOOM = 1;

/** Accepted upload constraints. */
export const ACCEPTED_PDF_MIME = "application/pdf";
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

/** Clamp a number into an inclusive range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Snap to the next/previous discrete zoom level relative to the current zoom.
 * @param direction +1 to zoom in, -1 to zoom out.
 */
export function getNextZoom(current: number, direction: 1 | -1): number {
  if (direction === 1) {
    const next = ZOOM_LEVELS.find((z) => z > current + 0.001);
    return clamp(next ?? current * 1.25, MIN_ZOOM, MAX_ZOOM);
  }
  const prev = [...ZOOM_LEVELS].reverse().find((z) => z < current - 0.001);
  return clamp(prev ?? current / 1.25, MIN_ZOOM, MAX_ZOOM);
}

/** Human-readable file size, e.g. "2.4 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}
