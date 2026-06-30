"use client";

/**
 * Central PDF.js / react-pdf runtime configuration.
 *
 * Importing this module (for its side effects) wires up the worker and the
 * required CSS for the text/annotation layers. All assets are served from our
 * own origin — see `scripts/copy-pdf-worker.mjs` — so rendering works fully
 * offline and nothing is ever sent to a third-party CDN.
 */
import { pdfjs } from "react-pdf";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// Local worker (privacy-first, offline-capable).
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

/**
 * Options passed to react-pdf's <Document>. Defined once at module scope so the
 * reference is stable across renders (react-pdf warns about inline objects).
 */
export const PDF_OPTIONS = {
  cMapUrl: "/pdf/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "/pdf/standard_fonts/",
} as const;

export { pdfjs };
