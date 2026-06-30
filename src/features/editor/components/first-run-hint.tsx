"use client";

import { Type, X } from "lucide-react";
import { useState } from "react";

const KEY = "dox:hint:inline-edit:v1";

/**
 * A one-time, dismissible nudge that surfaces inline text editing — the feature
 * is invisible otherwise. Persisted in localStorage so it shows only once.
 * Mounted inside the editor (so a document is already open).
 */
export function FirstRunHint() {
  const [show, setShow] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== "1";
    } catch {
      return false;
    }
  });

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore — private mode / blocked storage
    }
    setShow(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 bg-background/95 supports-[backdrop-filter]:bg-background/80 absolute bottom-4 left-4 z-30 flex max-w-xs items-start gap-2.5 rounded-xl border p-3 pr-2.5 shadow-lg backdrop-blur duration-500">
      <span className="bg-signal/15 text-signal mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg">
        <Type className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">Edit text in place</p>
        <p className="text-muted-foreground text-xs">
          Double-click any text on the page to edit it.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="text-muted-foreground hover:bg-accent hover:text-foreground -mr-0.5 grid size-6 shrink-0 place-items-center rounded-md transition-colors"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
