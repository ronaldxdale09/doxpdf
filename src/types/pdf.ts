/**
 * Shared PDF/editor domain types.
 *
 * These are intentionally framework-agnostic so they can be reused by the
 * viewer, the (future) annotation layer, export, and AI features.
 */

/** How pages are sized within the viewport. */
export type FitMode = "width" | "page" | "custom";

/** Editable document metadata (applied on export). */
export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
}

/**
 * Editor tools. Only "select" and "hand" are wired up in the foundation
 * phase; the rest are placeholders so the toolbar and store can evolve
 * without churn as annotation features land.
 */
export type EditorTool =
  | "select"
  | "hand"
  | "text"
  | "draw"
  | "highlight"
  | "shape"
  | "image"
  | "note"
  | "stamp"
  | "signature"
  | "redaction";

/** Concrete shape produced by the "shape" meta-tool. */
export type ShapeKind = "rect" | "ellipse" | "line" | "arrow";

/**
 * A page in the working document. The document is an ordered list of slots, each
 * a view of a source page (1-indexed; `src: 0` = inserted blank) with a
 * rotation. Reorder/duplicate/delete/insert just rearrange slots — no re-parse.
 */
export interface PageSlot {
  id: string;
  src: number; // 1-indexed source page, or 0 for a blank page
  rotation: number; // 0 | 90 | 180 | 270 (clockwise degrees)
}

/** A page's intrinsic geometry, in PDF points (1/72 inch). */
export interface PageSize {
  width: number;
  height: number;
}

/** Request to scroll the main viewer to a specific page. */
export interface ScrollRequest {
  page: number;
  /** Monotonic id so repeated requests to the same page still fire. */
  id: number;
}
