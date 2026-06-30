"use client";

import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/store/document-store";

const SPINNER =
  "size-7 animate-spin rounded-full border-2 border-muted-foreground/20";

/** Neutral pre-mount skeleton (identical on server + client to avoid mismatch). */
export function EditorBoot() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className={`${SPINNER} border-t-muted-foreground/60`} />
    </div>
  );
}

/** Shown while react-pdf parses the document. */
export function DocumentLoading() {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
      <div className={`${SPINNER} border-t-primary`} />
      <p className="text-muted-foreground text-sm">Opening your PDF…</p>
    </div>
  );
}

/** Shown when the document fails to parse. */
export function DocumentError() {
  const closeFile = useDocumentStore((s) => s.closeFile);
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <TriangleAlert className="text-destructive size-8" />
      <div>
        <p className="font-medium">We couldn&apos;t open this PDF</p>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          The file may be corrupted, password-protected, or not a valid PDF.
        </p>
      </div>
      <Button variant="outline" onClick={closeFile}>
        Choose another file
      </Button>
    </div>
  );
}
