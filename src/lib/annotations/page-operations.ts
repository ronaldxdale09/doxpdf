/**
 * Page operations that span the document (slot) store and the annotation store.
 * Kept in one place so the two stores stay decoupled and the sidebar just calls
 * these high-level actions.
 */
import { useAnnotationStore } from "@/store/annotation-store";
import { useDocumentStore } from "@/store/document-store";

import { rotateAnnotationGeometry } from "./geometry";

/** Rotate a page by ±90°, transforming its annotations so they stay attached. */
export function rotatePage(id: string, dir: 1 | -1) {
  const doc = useDocumentStore.getState();
  const slot = doc.pages.find((p) => p.id === id);
  if (!slot) return;
  const oldR = slot.rotation;
  const newR = (((oldR + dir * 90) % 360) + 360) % 360;
  doc.setRotation(id, newR);

  const src =
    (slot.src > 0 ? doc.pageSizes[slot.src] : null) ?? doc.defaultPageSize;
  if (!src) return;
  const ann = useAnnotationStore.getState();
  for (const a of ann.annotationsForSlot(id)) {
    ann.update(a.id, rotateAnnotationGeometry(a, oldR, newR, src.width, src.height));
  }
}

/** Delete a page and its annotations. */
export function deletePage(id: string) {
  useAnnotationStore.getState().removeForSlot(id);
  useDocumentStore.getState().deleteSlot(id);
}

/** Duplicate a page including its annotations. */
export function duplicatePage(id: string) {
  const newId = useDocumentStore.getState().duplicateSlot(id);
  if (newId) useAnnotationStore.getState().cloneForSlot(id, newId);
  return newId;
}

/** Insert a blank page after the given slot index. */
export function insertBlankPage(index: number) {
  return useDocumentStore.getState().insertBlankAfter(index);
}

/** Move a page from one position to another. */
export function reorderPages(from: number, to: number) {
  useDocumentStore.getState().reorderPages(from, to);
}
