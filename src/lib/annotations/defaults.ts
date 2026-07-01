import { nanoid } from "nanoid";

import type { Annotation, AnnotationType, DrawMode } from "@/types/annotations";

/** Curated annotation palette — ink, the brand amber, and clear signal hues. */
export const ANNOTATION_COLORS = [
  "#18181B", // ink
  "#E5484D", // red
  "#F59E0B", // amber (brand)
  "#22A06B", // green
  "#2D7FF9", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#FFFFFF", // white
] as const;

/** Highlighter swatch colors (translucent in use). */
export const HIGHLIGHT_COLORS = [
  "#FFE234", // yellow
  "#7CF59A", // green
  "#6FD3FF", // cyan
  "#FF9BD2", // pink
  "#FFB86B", // orange
] as const;

export interface StampPreset {
  id: string;
  label: string;
  color: string;
}

export const STAMP_PRESETS: StampPreset[] = [
  { id: "approved", label: "APPROVED", color: "#22A06B" },
  { id: "rejected", label: "REJECTED", color: "#E5484D" },
  { id: "draft", label: "DRAFT", color: "#6B7280" },
  { id: "paid", label: "PAID", color: "#2D7FF9" },
  { id: "confidential", label: "CONFIDENTIAL", color: "#E5484D" },
  { id: "reviewed", label: "REVIEWED", color: "#8B5CF6" },
  { id: "final", label: "FINAL", color: "#18181B" },
  { id: "urgent", label: "URGENT", color: "#F59E0B" },
];

export const DRAW_PRESETS: Record<
  DrawMode,
  { strokeWidth: number; opacity: number }
> = {
  pen: { strokeWidth: 2, opacity: 1 },
  marker: { strokeWidth: 6, opacity: 0.9 },
  highlighter: { strokeWidth: 14, opacity: 0.4 },
};

export const DEFAULT_FONT_SIZE = 16; // points

// The font catalog (base-14 + bundled library) lives in lib/fonts/catalog.
export { DEFAULT_FONT_OPTION } from "@/lib/fonts/catalog";
import { DEFAULT_FONT_OPTION } from "@/lib/fonts/catalog";

export const DEFAULT_FONT_FAMILY = DEFAULT_FONT_OPTION.cssFamily;

/**
 * Build a new annotation with sensible per-type defaults. Geometry (x/y/width/
 * height/points) is supplied by the creating tool; everything else falls back to
 * the active tool settings passed in `overrides`.
 */
export function createAnnotation(
  type: AnnotationType,
  pageId: string,
  overrides: Partial<Annotation> = {},
): Annotation {
  const base: Annotation = {
    id: nanoid(8),
    type,
    pageId,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    opacity: 1,
    color: "#18181B",
    createdAt: Date.now(),
  };

  switch (type) {
    case "text":
      base.text = "";
      base.fontSize = DEFAULT_FONT_SIZE;
      base.fontId = DEFAULT_FONT_OPTION.id;
      base.fontFamily = DEFAULT_FONT_OPTION.cssFamily;
      base.fontCategory = DEFAULT_FONT_OPTION.category;
      base.align = "left";
      break;
    case "note":
      base.text = "";
      base.color = "#F59E0B";
      base.width = 24;
      base.height = 24;
      break;
    case "rect":
    case "ellipse":
      base.strokeWidth = 2;
      base.fill = null;
      break;
    case "line":
    case "arrow":
      base.strokeWidth = 2;
      break;
    case "draw":
      base.strokeWidth = DRAW_PRESETS.pen.strokeWidth;
      base.drawMode = "pen";
      base.points = [];
      break;
    case "highlight":
      base.color = "#FFE234";
      base.opacity = 0.4;
      break;
    case "stamp":
      base.stampVariant = "approved";
      base.color = "#22A06B";
      break;
    case "redaction":
      // Solid opaque bar; on export the content beneath is truly removed.
      base.color = "#000000";
      base.opacity = 1;
      break;
    case "image":
      break;
  }

  return { ...base, ...overrides };
}
