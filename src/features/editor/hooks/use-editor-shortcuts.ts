"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { exportPdf } from "@/lib/pdf/export";
import { useAnnotationStore } from "@/store/annotation-store";
import { useDocumentStore } from "@/store/document-store";
import { useEditorStore } from "@/store/editor-store";
import { useSearchStore } from "@/store/search-store";
import type { EditorTool } from "@/types/pdf";

const TOOL_KEYS: Record<string, EditorTool> = {
  v: "select",
  h: "hand",
  t: "text",
  d: "draw",
  e: "highlight",
  s: "shape",
  n: "note",
  k: "stamp",
};

/**
 * Global keyboard shortcuts for the editor (Adobe-style).
 *
 *   ⌘/Ctrl+S          download           ⌘/Ctrl+Z / ⇧Z   undo / redo
 *   ⌘/Ctrl + / -      zoom in / out      Delete           remove selection
 *   ⌘/Ctrl+0          fit width          ⌘/Ctrl+D         duplicate
 *   PageDn / PageUp   next / prev page   Esc              deselect
 *   V H T D E S N K   tools
 */
export function useEditorShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      const mod = e.metaKey || e.ctrlKey;
      const doc = useDocumentStore.getState();
      const ann = useAnnotationStore.getState();
      const editor = useEditorStore.getState();
      const key = e.key.toLowerCase();

      // --- modifier combos ---
      if (mod && key === "s") {
        e.preventDefault();
        if (doc.file) {
          exportPdf(doc.file, {
            pages: doc.pages,
            annotations: ann.annotations,
            defaultSize: doc.defaultPageSize,
            metadata: doc.metadata,
            formValues: doc.formValues,
          })
            .then(() => toast.success("Your PDF has been downloaded."))
            .catch(() => toast.error("Sorry — we couldn't export this PDF."));
        }
        return;
      }
      if (mod && key === "f") {
        e.preventDefault();
        useSearchStore.getState().setOpen(true);
        return;
      }
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) ann.redo();
        else ann.undo();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        ann.redo();
        return;
      }
      if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        doc.zoomIn();
        return;
      }
      if (mod && e.key === "-") {
        e.preventDefault();
        doc.zoomOut();
        return;
      }
      if (mod && e.key === "0") {
        e.preventDefault();
        doc.setFitMode("width");
        return;
      }
      if (mod && key === "d") {
        e.preventDefault();
        if (ann.selectedId) ann.duplicate(ann.selectedId);
        return;
      }

      if (isTyping) return;

      // --- single keys ---
      if (e.key === "?") {
        e.preventDefault();
        editor.setShortcutsOpen(!editor.shortcutsOpen);
        return;
      }
      if (e.key === "Escape") {
        ann.select(null);
        editor.setActiveTool("select");
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && ann.selectedId) {
        e.preventDefault();
        ann.remove(ann.selectedId);
        return;
      }
      if (e.key === "PageDown") {
        e.preventDefault();
        doc.goToPage(doc.currentPage + 1);
        return;
      }
      if (e.key === "PageUp") {
        e.preventDefault();
        doc.goToPage(doc.currentPage - 1);
        return;
      }
      if (!mod && TOOL_KEYS[key]) {
        editor.setActiveTool(TOOL_KEYS[key]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
