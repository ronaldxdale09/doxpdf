"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback } from "react";
import { Document } from "react-pdf";

import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/features/search/components/search-bar";
import { SignatureDialog } from "@/features/signature/components/signature-dialog";
import { PdfViewer } from "@/features/viewer/components/pdf-viewer";
import { PDF_OPTIONS } from "@/lib/pdf/setup";
import { useDocumentStore } from "@/store/document-store";

import { useEditorShortcuts } from "../hooks/use-editor-shortcuts";
import { useUnsavedGuard } from "../hooks/use-unsaved-guard";
import { EditorEmptyState } from "./editor-empty-state";
import { FontFaces } from "./font-faces";
import { EditorTopBar } from "./editor-top-bar";
import { FirstRunHint } from "./first-run-hint";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { DocumentError, DocumentLoading } from "./editor-states";
import { FloatingToolbar } from "./floating-toolbar";
import { PropertiesBar } from "./properties-bar";
import { RedactionControls } from "./redaction-controls";
import { ThumbnailSidebar } from "./thumbnail-sidebar";
import { ToolRail } from "./tool-rail";

/**
 * Top-level editor composition. Owns the single react-pdf <Document> so the
 * page viewer and the thumbnail sidebar share one parsed copy of the file.
 */
export function EditorShell() {
  const file = useDocumentStore((s) => s.file);
  const setNumPages = useDocumentStore((s) => s.setNumPages);
  const setDefaultPageSize = useDocumentStore((s) => s.setDefaultPageSize);
  const setPdfProxy = useDocumentStore((s) => s.setPdfProxy);

  useEditorShortcuts();
  useUnsavedGuard();

  const onLoadSuccess = useCallback(
    async (pdf: PDFDocumentProxy) => {
      setNumPages(pdf.numPages);
      setPdfProxy(pdf);
      try {
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        setDefaultPageSize({ width: viewport.width, height: viewport.height });
      } catch {
        // Non-fatal: placeholder sizing falls back to A4.
      }
    },
    [setNumPages, setDefaultPageSize, setPdfProxy],
  );

  if (!file) return <EditorEmptyState />;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <FontFaces />
      <EditorTopBar />
      <Document
        file={file}
        options={PDF_OPTIONS}
        onLoadSuccess={onLoadSuccess}
        loading={<DocumentLoading />}
        error={<DocumentError />}
        noData={<DocumentLoading />}
        className="flex min-h-0 flex-1"
      >
        <ErrorBoundary
          fallback={(reset) => (
            <div className="grid flex-1 place-items-center p-6 text-center">
              <div className="max-w-sm">
                <h2 className="font-display text-2xl font-medium tracking-[-0.01em]">
                  This view hit a snag.
                </h2>
                <p className="text-muted-foreground mt-2 text-sm text-pretty">
                  Something in the editor failed to render. Your document and
                  edits are still here — try again.
                </p>
                <Button className="mt-6" onClick={reset}>
                  Try again
                </Button>
              </div>
            </div>
          )}
        >
          <ThumbnailSidebar />
          <main className="relative min-w-0 flex-1">
            <PdfViewer />
            <ToolRail />
            <PropertiesBar />
            <RedactionControls />
            <SearchBar />
            <FloatingToolbar />
            <FirstRunHint />
          </main>
        </ErrorBoundary>
      </Document>
      <SignatureDialog />
      <ShortcutsDialog />
    </div>
  );
}
