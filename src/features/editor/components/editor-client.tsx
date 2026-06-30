"use client";

import dynamic from "next/dynamic";

/**
 * Loads the editor client-side only. react-pdf / pdf.js reference browser-only
 * globals (e.g. DOMMatrix) at module evaluation, so they must never be bundled
 * into the server render. `ssr: false` (only valid inside a Client Component)
 * keeps the entire editor chunk off the server.
 */
const EditorShell = dynamic(
  () => import("./editor-shell").then((m) => m.EditorShell),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-dvh place-items-center">
        <div className="border-muted-foreground/20 border-t-muted-foreground/60 size-7 animate-spin rounded-full border-2" />
      </div>
    ),
  },
);

export function EditorClient() {
  return <EditorShell />;
}
