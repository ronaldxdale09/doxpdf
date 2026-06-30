import { create } from "zustand";

import type { EditorTool } from "@/types/pdf";

interface EditorState {
  /** Currently active tool. Annotation tools are wired up in later phases. */
  activeTool: EditorTool;
  setActiveTool: (tool: EditorTool) => void;
  /** Whether the keyboard-shortcuts cheatsheet is open. */
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),
  shortcutsOpen: false,
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
}));
