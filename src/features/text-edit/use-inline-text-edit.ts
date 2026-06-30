"use client";

import { useCallback } from "react";

import { createAnnotation } from "@/lib/annotations/defaults";
import { displaySize } from "@/lib/annotations/geometry";
import { sampleRunColors } from "@/lib/pdf/canvas-sample";
import { identifyFont } from "@/lib/pdf/fonts/identify";
import { findTextRunAt } from "@/lib/pdf/text-hit";
import { useAnnotationStore } from "@/store/annotation-store";
import { useDocumentStore } from "@/store/document-store";
import { useEditorStore } from "@/store/editor-store";
import type { PageSlot } from "@/types/pdf";

/** Extra points around the glyph box so the cover hides every original pixel. */
const PAD_X = 1;
const DESCENDER_PAD = 0.25; // fraction of font size, for glyph descenders

/**
 * Returns a double-click handler for a page slot that turns the clicked PDF text
 * into an editable, font-matched overlay (cover & replace). Wired only for
 * unrotated source slots; everything else is a no-op so normal interactions and
 * existing annotations are untouched. See `docs/inline-text-editing.md`.
 */
export function useInlineTextEdit(slot: PageSlot) {
  return useCallback(
    async (e: React.MouseEvent<HTMLElement>) => {
      // Only in select mode, on a real (unrotated) source page.
      if (useEditorStore.getState().activeTool !== "select") return;
      if (slot.src <= 0 || slot.rotation !== 0) return;

      // Let existing annotations handle their own double-click (edit/select).
      if ((e.target as HTMLElement).closest("[data-annotation]")) return;

      const { pdfProxy, pageSizes, defaultPageSize, file } =
        useDocumentStore.getState();
      if (!pdfProxy) return;

      const srcSize = pageSizes[slot.src] ?? defaultPageSize;
      if (!srcSize) return;
      const display = displaySize(slot.rotation, srcSize.width, srcSize.height);

      const wrapper = e.currentTarget;
      const rect = wrapper.getBoundingClientRect();
      if (rect.width <= 0) return;
      const scale = rect.width / display.width;
      const point = {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      };

      const run = await findTextRunAt(pdfProxy, slot.src, point, file);
      if (!run) return;

      const page = await pdfProxy.getPage(slot.src);
      const identity = await identifyFont(page, run.fontName);

      const box = {
        x: run.x - PAD_X,
        y: run.y,
        width: run.width + PAD_X * 2,
        height: run.height + run.size * DESCENDER_PAD,
      };
      const colors = sampleRunColors(
        wrapper.querySelector("canvas"),
        box,
        display.width,
        display.height,
      );

      const ann = useAnnotationStore.getState();
      const annotation = createAnnotation("text", slot.id, {
        ...box,
        text: run.str,
        fontSize: run.size,
        fontFamily: identity.cssFamily,
        fontCategory: identity.category,
        bold: identity.bold,
        italic: identity.italic,
        color: colors.text,
        coverColor: colors.background,
        sourceFont: identity.realName || undefined,
      });
      ann.add(annotation); // selects it + is one undo step
      ann.setEditing(annotation.id);
    },
    [slot],
  );
}
