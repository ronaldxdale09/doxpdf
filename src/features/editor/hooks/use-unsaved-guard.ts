"use client";

import { useEffect } from "react";

import { useAnnotationStore } from "@/store/annotation-store";
import { useDocumentStore } from "@/store/document-store";

/**
 * Warn before the tab is closed/reloaded when the open document has edits that
 * haven't been exported. Everything lives in memory (nothing is uploaded), so a
 * stray refresh would otherwise silently discard the user's work.
 */
export function useUnsavedGuard() {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const hasAnnotations = useAnnotationStore.getState().annotations.length > 0;
      const doc = useDocumentStore.getState();
      const hasForms = Object.keys(doc.formValues).length > 0;
      const hasMetadata = doc.metadata != null;
      const pagesEdited = doc.pages.some(
        (p, i) => p.src !== i + 1 || p.rotation !== 0,
      );
      if (hasAnnotations || hasForms || hasMetadata || pagesEdited) {
        e.preventDefault();
        e.returnValue = ""; // some browsers require a set returnValue
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
}
