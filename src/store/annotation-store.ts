import { create } from "zustand";

import type { Annotation } from "@/types/annotations";

const HISTORY_LIMIT = 200;
const DUPLICATE_OFFSET = 12; // points

function clone(list: Annotation[]): Annotation[] {
  return list.map((a) => ({
    ...a,
    points: a.points ? a.points.map((p) => ({ ...p })) : undefined,
  }));
}

interface AnnotationState {
  annotations: Annotation[]; // array order == z-order (last = top)
  selectedId: string | null;
  /** Id of the text annotation currently in inline-edit mode, if any. */
  editingId: string | null;
  past: Annotation[][];
  future: Annotation[][];

  // --- queries ---
  annotationsForSlot: (pageId: string) => Annotation[];

  // --- mutations (each discrete action is one undo step) ---
  add: (annotation: Annotation) => void;
  update: (
    id: string,
    patch: Partial<Annotation>,
    options?: { history?: boolean },
  ) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  reorder: (id: string, dir: "front" | "back" | "forward" | "backward") => void;
  /** Replace the whole set (e.g. after page operations). */
  replaceAll: (next: Annotation[]) => void;
  /** Drop every annotation on a slot (e.g. when a page is deleted). */
  removeForSlot: (pageId: string) => void;
  /** Copy a slot's annotations onto another slot (e.g. when duplicating a page). */
  cloneForSlot: (fromId: string, toId: string) => void;
  clearAll: () => void;
  /** Hard reset — drops annotations, selection, AND history (new file opened). */
  reset: () => void;

  // --- selection ---
  select: (id: string | null) => void;
  /** Enter/leave inline text-edit mode for an annotation. */
  setEditing: (id: string | null) => void;

  // --- history ---
  /** Snapshot current state before a live operation (drag/resize/edit). */
  commit: () => void;
  undo: () => void;
  redo: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => {
  const pushHistory = () => {
    const { annotations, past } = get();
    const next = [...past, clone(annotations)];
    if (next.length > HISTORY_LIMIT) next.shift();
    set({ past: next, future: [] });
  };

  return {
    annotations: [],
    selectedId: null,
    editingId: null,
    past: [],
    future: [],

    annotationsForSlot: (pageId) =>
      get().annotations.filter((a) => a.pageId === pageId),

    add: (annotation) => {
      pushHistory();
      set((s) => ({
        annotations: [...s.annotations, annotation],
        selectedId: annotation.id,
      }));
    },

    update: (id, patch, options) => {
      if (options?.history) pushHistory();
      set((s) => ({
        annotations: s.annotations.map((a) =>
          a.id === id ? { ...a, ...patch } : a,
        ),
      }));
    },

    remove: (id) => {
      pushHistory();
      set((s) => ({
        annotations: s.annotations.filter((a) => a.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
        editingId: s.editingId === id ? null : s.editingId,
      }));
    },

    duplicate: (id) => {
      const original = get().annotations.find((a) => a.id === id);
      if (!original) return;
      pushHistory();
      const copy: Annotation = {
        ...clone([original])[0],
        id: `${id}-${Math.round(original.x + original.y) % 9973}-${get().annotations.length}`,
        x: original.x + DUPLICATE_OFFSET,
        y: original.y + DUPLICATE_OFFSET,
        points: original.points?.map((p) => ({
          x: p.x + DUPLICATE_OFFSET,
          y: p.y + DUPLICATE_OFFSET,
        })),
        createdAt: original.createdAt + 1,
      };
      set((s) => ({
        annotations: [...s.annotations, copy],
        selectedId: copy.id,
      }));
    },

    reorder: (id, dir) => {
      const list = get().annotations;
      const index = list.findIndex((a) => a.id === id);
      if (index < 0) return;
      pushHistory();
      const next = [...list];
      const [item] = next.splice(index, 1);
      if (dir === "front") next.push(item);
      else if (dir === "back") next.unshift(item);
      else if (dir === "forward")
        next.splice(Math.min(index + 1, next.length), 0, item);
      else next.splice(Math.max(index - 1, 0), 0, item);
      set({ annotations: next });
    },

    replaceAll: (nextAnnotations) => {
      pushHistory();
      set({ annotations: nextAnnotations, selectedId: null });
    },

    removeForSlot: (pageId) => {
      if (!get().annotations.some((a) => a.pageId === pageId)) return;
      pushHistory();
      set((s) => ({
        annotations: s.annotations.filter((a) => a.pageId !== pageId),
      }));
    },

    cloneForSlot: (fromId, toId) => {
      const copies = clone(
        get().annotations.filter((a) => a.pageId === fromId),
      ).map((a, i) => ({ ...a, id: `${a.id}-c${i}`, pageId: toId }));
      if (copies.length === 0) return;
      pushHistory();
      set((s) => ({ annotations: [...s.annotations, ...copies] }));
    },

    clearAll: () => {
      pushHistory();
      set({ annotations: [], selectedId: null });
    },

    reset: () =>
      set({
        annotations: [],
        selectedId: null,
        editingId: null,
        past: [],
        future: [],
      }),

    select: (id) =>
      set((s) => ({
        selectedId: id,
        // Leaving a selection also leaves edit mode for a different annotation.
        editingId: s.editingId && s.editingId !== id ? null : s.editingId,
      })),

    setEditing: (id) =>
      set((s) => ({
        editingId: id,
        // Editing implies selecting the same annotation.
        selectedId: id ?? s.selectedId,
      })),

    commit: () => pushHistory(),

    undo: () => {
      const { past, future, annotations } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      set({
        annotations: previous,
        past: past.slice(0, -1),
        future: [...future, clone(annotations)],
        selectedId: null,
      });
    },

    redo: () => {
      const { past, future, annotations } = get();
      if (future.length === 0) return;
      const next = future[future.length - 1];
      set({
        annotations: next,
        future: future.slice(0, -1),
        past: [...past, clone(annotations)],
        selectedId: null,
      });
    },
  };
});
