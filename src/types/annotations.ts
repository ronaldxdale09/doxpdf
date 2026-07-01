/**
 * Annotation data model.
 *
 * Geometry is stored in **PDF points** with a **top-left origin (y-down)** —
 * the same space pages report via react-pdf's `originalWidth/originalHeight`.
 * The overlay converts points → screen px with a single `scale` factor, and the
 * exporter flips y to PDF's bottom-left origin. Keeping one canonical unit makes
 * both rendering and baking trivial and resolution-independent.
 */

export type AnnotationType =
  | "text"
  | "draw"
  | "rect"
  | "ellipse"
  | "line"
  | "arrow"
  | "highlight"
  | "note"
  | "stamp"
  | "image";

export type DrawMode = "pen" | "marker" | "highlighter";

export interface Point {
  x: number;
  y: number;
}

/**
 * A single annotation. A deliberately flat shape (vs. a strict discriminated
 * union) so the store can update any field generically with `Partial<Annotation>`.
 * Type-specific fields are optional; renderers and the exporter switch on `type`.
 */
export interface Annotation {
  id: string;
  type: AnnotationType;
  /** The page slot this annotation belongs to (travels with the page). */
  pageId: string;

  // Bounding box, in page points (in the page's *displayed* orientation),
  // top-left origin.
  x: number;
  y: number;
  width: number;
  height: number;

  rotation: number; // degrees
  opacity: number; // 0..1
  color: string; // hex — stroke/text/border depending on type

  // Shapes
  fill?: string | null; // hex or null for no fill
  strokeWidth?: number; // points

  // Freehand / line / arrow — absolute page-point coordinates
  points?: Point[];
  drawMode?: DrawMode;

  // Text & sticky notes
  text?: string;
  fontSize?: number; // points
  fontFamily?: string;
  /** Catalog font id (see lib/fonts/catalog). Drives on-screen + embedded font. */
  fontId?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right" | "justify";
  author?: string;

  // Inline text edits (cover & replace over existing PDF text)
  /** Opaque fill painted behind the text — hides the original glyphs. */
  coverColor?: string;
  /** Generic family used to pick the export font (sans→Helvetica, etc.). */
  fontCategory?: "sans" | "serif" | "mono";
  /** Real name of the font this edit is replacing (provenance / future reuse). */
  sourceFont?: string;

  // Reflowable paragraph edits (live re-wrap; see docs/reflow-text-editing.md)
  /** This text annotation is a reflowable paragraph (own layout engine). */
  reflow?: boolean;
  /** Baseline-to-baseline spacing in points (from the original paragraph). */
  lineHeight?: number;
  /** Key into the reflow font registry — measured & baked with these bytes. */
  reflowFontId?: string;

  // Stamps
  stampVariant?: string;

  // Images (and rendered signatures) — data URL
  imageSrc?: string;

  createdAt: number;
}
