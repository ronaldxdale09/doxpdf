import { create } from "zustand";

export interface SearchMatch {
  id: string;
  slotId: string;
  /** Slot position (0-indexed) for ordering + navigation. */
  order: number;
  /** Box in the slot's display point space, top-left origin. */
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SearchState {
  open: boolean;
  query: string;
  caseSensitive: boolean;
  matches: SearchMatch[];
  activeIndex: number;
  searching: boolean;

  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  setCaseSensitive: (v: boolean) => void;
  setMatches: (matches: SearchMatch[]) => void;
  setSearching: (v: boolean) => void;
  setActiveIndex: (i: number) => void;
  next: () => void;
  prev: () => void;
  clear: () => void;

  matchesForSlot: (slotId: string) => SearchMatch[];
}

export const useSearchStore = create<SearchState>((set, get) => ({
  open: false,
  query: "",
  caseSensitive: false,
  matches: [],
  activeIndex: 0,
  searching: false,

  setOpen: (open) => set({ open }),
  setQuery: (query) => set({ query }),
  setCaseSensitive: (caseSensitive) => set({ caseSensitive }),
  setMatches: (matches) => set({ matches, activeIndex: 0 }),
  setSearching: (searching) => set({ searching }),
  setActiveIndex: (activeIndex) => set({ activeIndex }),
  next: () =>
    set((s) =>
      s.matches.length
        ? { activeIndex: (s.activeIndex + 1) % s.matches.length }
        : {},
    ),
  prev: () =>
    set((s) =>
      s.matches.length
        ? {
            activeIndex:
              (s.activeIndex - 1 + s.matches.length) % s.matches.length,
          }
        : {},
    ),
  clear: () => set({ query: "", matches: [], activeIndex: 0 }),

  matchesForSlot: (slotId) => get().matches.filter((m) => m.slotId === slotId),
}));
