"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEditorStore } from "@/store/editor-store";

interface Shortcut {
  keys: string[];
  label: string;
}
interface Group {
  title: string;
  items: Shortcut[];
}

/** `$mod` is swapped for ⌘ or Ctrl per platform at render time. */
const GROUPS: Group[] = [
  {
    title: "Tools",
    items: [
      { keys: ["V"], label: "Select" },
      { keys: ["H"], label: "Hand / pan" },
      { keys: ["T"], label: "Text" },
      { keys: ["D"], label: "Draw" },
      { keys: ["E"], label: "Highlight" },
      { keys: ["S"], label: "Shapes" },
      { keys: ["N"], label: "Sticky note" },
      { keys: ["K"], label: "Stamp" },
    ],
  },
  {
    title: "Editing",
    items: [
      { keys: ["Double-click"], label: "Edit PDF text in place" },
      { keys: ["$mod", "Z"], label: "Undo" },
      { keys: ["$mod", "⇧", "Z"], label: "Redo" },
      { keys: ["$mod", "D"], label: "Duplicate selection" },
      { keys: ["Del"], label: "Delete selection" },
      { keys: ["Esc"], label: "Deselect" },
    ],
  },
  {
    title: "View & file",
    items: [
      { keys: ["$mod", "F"], label: "Find in document" },
      { keys: ["$mod", "S"], label: "Download" },
      { keys: ["$mod", "+"], label: "Zoom in" },
      { keys: ["$mod", "−"], label: "Zoom out" },
      { keys: ["$mod", "0"], label: "Fit width" },
      { keys: ["PgUp", "PgDn"], label: "Previous / next page" },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="border-border bg-muted text-foreground/80 inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 font-mono text-[11px] font-medium shadow-[0_1px_0_var(--border)]">
      {children}
    </kbd>
  );
}

export function ShortcutsDialog() {
  const open = useEditorStore((s) => s.shortcutsOpen);
  const setOpen = useEditorStore((s) => s.setShortcutsOpen);
  // Client-only (the editor is `ssr:false`), so navigator is available at render.
  const [mod] = useState(() =>
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
      ? "⌘"
      : "Ctrl",
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Work faster — every tool and action has a key.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="text-muted-foreground mb-2.5 font-mono text-[10px] tracking-[0.14em] uppercase">
                {group.title}
              </div>
              <ul className="space-y-2">
                {group.items.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-foreground/90">{s.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {s.keys.map((k, i) => (
                        <Kbd key={i}>{k === "$mod" ? mod : k}</Kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground border-t pt-3 text-xs">
          Press <Kbd>?</Kbd> any time to open this panel.
        </p>
      </DialogContent>
    </Dialog>
  );
}
