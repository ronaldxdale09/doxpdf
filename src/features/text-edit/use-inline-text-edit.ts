"use client";

import { useCallback, useRef } from "react";

import { createAnnotation } from "@/lib/annotations/defaults";
import { displaySize } from "@/lib/annotations/geometry";
import { sampleRunColors } from "@/lib/pdf/canvas-sample";
import { identifyFont } from "@/lib/pdf/fonts/identify";
import { resolveReflowFont } from "@/lib/pdf/reflow/fonts";
import { findParagraphAt, getPageParagraphs } from "@/lib/pdf/text-blocks";
import { findTextRunAt } from "@/lib/pdf/text-hit";
import { useAnnotationStore } from "@/store/annotation-store";
import { useDocumentStore } from "@/store/document-store";
import { useEditorStore } from "@/store/editor-store";
import type { PageSlot } from "@/types/pdf";

/** Extra points around the glyph box so the cover hides every original pixel. */
const PAD_X = 1;
const DESCENDER_PAD = 0.25; // fraction of font size, for glyph descenders

/**
 * Double-click handler that turns clicked PDF text into an editable overlay.
 * A safely-reflowable paragraph becomes a live-rewrapping block; everything else
 * falls back to single-run cover & replace. Wired only for unrotated source
 * slots. See `docs/reflow-text-editing.md` and `docs/inline-text-editing.md`.
 */
export function useInlineTextEdit(slot: PageSlot) {
  // Guards against a second double-click racing in before the first has added
  // its annotation (both async chains would otherwise create duplicate covers).
  const inflight = useRef(false);

  return useCallback(
    async (e: React.MouseEvent<HTMLElement>) => {
      if (useEditorStore.getState().activeTool !== "select") return;
      if (slot.src <= 0 || slot.rotation !== 0) return;
      if ((e.target as HTMLElement).closest("[data-annotation]")) return;
      if (inflight.current) return;

      const { pdfProxy, pageSizes, defaultPageSize, file } =
        useDocumentStore.getState();
      if (!pdfProxy) return;

      const srcSize = pageSizes[slot.src] ?? defaultPageSize;
      if (!srcSize) return;
      const display = displaySize(slot.rotation, srcSize.width, srcSize.height);

      // Read everything off the event synchronously — `currentTarget` is nulled
      // once the handler yields at the first await.
      const wrapper = e.currentTarget;
      const rect = wrapper.getBoundingClientRect();
      if (rect.width <= 0) return;
      const scale = rect.width / display.width;
      const point = {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      };
      const canvas = wrapper.querySelector("canvas");

      inflight.current = true;
      try {
        const page = await pdfProxy.getPage(slot.src);
        // Natively-rotated pages (/Rotate 90/180/270) put text runs in a swapped
        // coordinate space our geometry doesn't handle; bail rather than
        // mis-place the edit. (User-applied rotation is already excluded above.)
        if (((page.rotate % 360) + 360) % 360 !== 0) return;

        const ann = useAnnotationStore.getState();

        // ---- Reflow path: a safely-reflowable paragraph ----
        try {
          const paras = await getPageParagraphs(pdfProxy, slot.src, file);
          const para = findParagraphAt(paras, point);
          if (para && para.reflow === "reflowable" && para.fontName) {
            const identity = await identifyFont(page, para.fontName);
            const reflowFont = await resolveReflowFont(
              identity,
              para.fontSize,
              para.text,
            );
            if (reflowFont) {
              const box = {
                x: para.x0,
                y: para.y0,
                width: para.x1 - para.x0,
                height: para.y1 - para.y0,
              };
              const colors = sampleRunColors(canvas, box, display.width, display.height);
              const annotation = createAnnotation("text", slot.id, {
                ...box,
                text: para.text,
                fontSize: para.fontSize,
                lineHeight: para.lineHeight,
                align: para.align,
                fontFamily: reflowFont.cssFamily,
                fontCategory: identity.category,
                color: colors.text,
                coverColor: colors.background,
                reflow: true,
                reflowFontId: reflowFont.fontId,
                sourceFont: identity.realName || undefined,
              });
              ann.add(annotation);
              ann.setEditing(annotation.id);
              return;
            }
          }
        } catch {
          // fall through to the single-run inline edit
        }

        // ---- Fallback: single-run cover & replace ----
        const run = await findTextRunAt(pdfProxy, slot.src, point, file);
        if (!run) return;
        const identity = await identifyFont(page, run.fontName);
        const box = {
          x: run.x - PAD_X,
          y: run.y,
          width: run.width + PAD_X * 2,
          height: run.height + run.size * DESCENDER_PAD,
        };
        const colors = sampleRunColors(canvas, box, display.width, display.height);
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
        ann.add(annotation);
        ann.setEditing(annotation.id);
      } catch (err) {
        console.error("[DoxPDF] inline text edit failed", err);
      } finally {
        inflight.current = false;
      }
    },
    [slot],
  );
}
