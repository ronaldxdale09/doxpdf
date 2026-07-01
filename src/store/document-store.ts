import type { PDFDocumentProxy } from "pdfjs-dist";
import { nanoid } from "nanoid";
import { create } from "zustand";

import {
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  clamp,
  getNextZoom,
} from "@/lib/constants";
import { clearReflowFonts } from "@/lib/pdf/reflow/fonts";
import { useAnnotationStore } from "@/store/annotation-store";
import { useSearchStore } from "@/store/search-store";
import type {
  FitMode,
  PageSize,
  PageSlot,
  PdfMetadata,
  ScrollRequest,
} from "@/types/pdf";

/** Clear per-document state that lives in sibling stores (annotations, search). */
function resetDependentStores() {
  useAnnotationStore.getState().reset();
  useSearchStore.getState().clear();
  clearReflowFonts();
}

interface DocumentState {
  /** The currently open file. Source of truth for both rendering and export. */
  file: File | null;
  numPages: number;
  /** Ordered working pages (slots). Drives both rendering and export. */
  pages: PageSlot[];
  /** Page currently centered in the viewport (1-indexed slot position). */
  currentPage: number;
  zoom: number;
  fitMode: FitMode;
  /** Intrinsic size of page 1, used to estimate placeholder heights. */
  defaultPageSize: PageSize | null;
  /** Intrinsic size (points) per page, populated as pages render. */
  pageSizes: Record<number, PageSize>;
  /** Parsed document handle for text extraction (AI/OCR). */
  pdfProxy: PDFDocumentProxy | null;
  /** User-edited metadata, applied on export. Null until edited. */
  metadata: PdfMetadata | null;
  /** Filled AcroForm field values, applied on export. */
  formValues: Record<string, string | boolean>;
  sidebarOpen: boolean;
  /** Set when navigation should scroll the viewer; consumed by the viewer. */
  scrollRequest: ScrollRequest | null;

  // --- actions ---
  openFile: (file: File) => void;
  closeFile: () => void;
  setNumPages: (n: number) => void;
  setDefaultPageSize: (size: PageSize) => void;
  setPageSize: (page: number, size: PageSize) => void;
  setPdfProxy: (proxy: PDFDocumentProxy | null) => void;
  setMetadata: (metadata: PdfMetadata) => void;
  setFormValues: (values: Record<string, string | boolean>) => void;

  // --- page operations (low-level; coordinate annotation effects via
  //     lib/pdf/page-operations) ---
  reorderPages: (fromIndex: number, toIndex: number) => void;
  setRotation: (id: string, rotation: number) => void;
  deleteSlot: (id: string) => void;
  /** Insert a copy of a slot right after it; returns the new slot id. */
  duplicateSlot: (id: string) => string | null;
  /** Insert a blank page after the given slot index; returns the new slot id. */
  insertBlankAfter: (index: number) => string;
  /** Update the centered page WITHOUT requesting a scroll (driven by scroll). */
  setCurrentPage: (page: number) => void;
  /** Navigate to a page AND request the viewer scroll to it. */
  goToPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setFitMode: (mode: FitMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

let scrollRequestId = 0;

export const useDocumentStore = create<DocumentState>((set, get) => ({
  file: null,
  numPages: 0,
  currentPage: 1,
  zoom: DEFAULT_ZOOM,
  fitMode: "custom",
  defaultPageSize: null,
  pageSizes: {},
  pdfProxy: null,
  metadata: null,
  formValues: {},
  pages: [],
  sidebarOpen: true,
  scrollRequest: null,

  openFile: (file) => {
    // A fresh document must not inherit the previous file's annotations,
    // undo/redo history, or search matches (their slot ids won't line up).
    resetDependentStores();
    set({
      file,
      numPages: 0,
      currentPage: 1,
      defaultPageSize: null,
      pageSizes: {},
      pdfProxy: null,
      metadata: null,
      formValues: {},
      pages: [],
      scrollRequest: null,
    });
  },

  closeFile: () => {
    resetDependentStores();
    set({
      file: null,
      numPages: 0,
      currentPage: 1,
      defaultPageSize: null,
      pageSizes: {},
      pdfProxy: null,
      metadata: null,
      formValues: {},
      pages: [],
      scrollRequest: null,
      zoom: DEFAULT_ZOOM,
      fitMode: "custom",
    });
  },

  setNumPages: (n) =>
    set((s) => ({
      numPages: n,
      // Build one slot per source page on first load; preserve edits otherwise.
      pages:
        s.pages.length === 0
          ? Array.from({ length: n }, (_, i) => ({
              id: nanoid(8),
              src: i + 1,
              rotation: 0,
            }))
          : s.pages,
    })),
  setDefaultPageSize: (size) => set({ defaultPageSize: size }),
  setPageSize: (page, size) =>
    set((s) => ({ pageSizes: { ...s.pageSizes, [page]: size } })),
  setPdfProxy: (proxy) => set({ pdfProxy: proxy }),
  setMetadata: (metadata) => set({ metadata }),
  setFormValues: (formValues) => set({ formValues }),

  reorderPages: (from, to) =>
    set((s) => {
      if (from === to) return {};
      const next = [...s.pages];
      const [moved] = next.splice(from, 1);
      if (!moved) return {};
      next.splice(to, 0, moved);
      return { pages: next, currentPage: clamp(to + 1, 1, next.length) };
    }),

  setRotation: (id, rotation) =>
    set((s) => ({
      pages: s.pages.map((p) => (p.id === id ? { ...p, rotation } : p)),
    })),

  deleteSlot: (id) =>
    set((s) => {
      if (s.pages.length <= 1) return {}; // never delete the last page
      const pages = s.pages.filter((p) => p.id !== id);
      return { pages, currentPage: clamp(s.currentPage, 1, pages.length) };
    }),

  duplicateSlot: (id) => {
    const idx = get().pages.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    const newId = nanoid(8);
    const pages = [...get().pages];
    pages.splice(idx + 1, 0, { ...pages[idx], id: newId });
    set({ pages });
    return newId;
  },

  insertBlankAfter: (index) => {
    const newId = nanoid(8);
    set((s) => {
      const pages = [...s.pages];
      pages.splice(index + 1, 0, { id: newId, src: 0, rotation: 0 });
      return { pages };
    });
    return newId;
  },

  setCurrentPage: (page) => {
    const { numPages, currentPage } = get();
    const next = clamp(page, 1, Math.max(numPages, 1));
    if (next !== currentPage) set({ currentPage: next });
  },

  goToPage: (page) => {
    const { numPages } = get();
    const next = clamp(page, 1, Math.max(numPages, 1));
    scrollRequestId += 1;
    set({ currentPage: next, scrollRequest: { page: next, id: scrollRequestId } });
  },

  setZoom: (zoom) =>
    set({ zoom: clamp(zoom, MIN_ZOOM, MAX_ZOOM), fitMode: "custom" }),

  zoomIn: () =>
    set((s) => ({ zoom: getNextZoom(s.zoom, 1), fitMode: "custom" })),

  zoomOut: () =>
    set((s) => ({ zoom: getNextZoom(s.zoom, -1), fitMode: "custom" })),

  setFitMode: (mode) => set({ fitMode: mode }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
