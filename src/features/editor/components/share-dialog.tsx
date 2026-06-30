"use client";

import { Clock, Download, Loader2, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildPdfBytes, exportPdf } from "@/lib/pdf/export";
import { getBaseName } from "@/lib/pdf/file";
import { useAnnotationStore } from "@/store/annotation-store";
import { useDocumentStore } from "@/store/document-store";

const EXPIRY_OPTIONS = ["1 hour", "24 hours", "7 days"];

export function ShareDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const exportOptions = () => {
    const doc = useDocumentStore.getState();
    return {
      pages: doc.pages,
      annotations: useAnnotationStore.getState().annotations,
      defaultSize: doc.defaultPageSize,
      metadata: doc.metadata,
      formValues: doc.formValues,
    };
  };

  const shareFile = async () => {
    const doc = useDocumentStore.getState();
    if (!doc.file) return;
    setBusy(true);
    try {
      const bytes = await buildPdfBytes(
        doc.file,
        doc.pages,
        useAnnotationStore.getState().annotations,
        doc.defaultPageSize,
        doc.metadata,
        doc.formValues,
      );
      const fileName = `${getBaseName(doc.file.name)}.pdf`;
      const out = new File([bytes.slice().buffer], fileName, {
        type: "application/pdf",
      });

      if (
        typeof navigator !== "undefined" &&
        navigator.canShare?.({ files: [out] })
      ) {
        await navigator.share({ files: [out], title: fileName });
        onClose();
      } else {
        await exportPdf(doc.file, exportOptions());
        toast.message("Direct sharing isn't available here — downloaded instead.");
        onClose();
      }
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        toast.error("Couldn't share the file.");
      }
    } finally {
      setBusy(false);
    }
  };

  const downloadCopy = async () => {
    const file = useDocumentStore.getState().file;
    if (!file) return;
    setBusy(true);
    try {
      await exportPdf(file, exportOptions());
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>
            DoxPDF is local-first — your file never touches a server. Send it
            directly from your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Button
            className="w-full justify-start gap-2"
            onClick={shareFile}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Share2 className="size-4" />
            )}
            Share file…
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={downloadCopy}
            disabled={busy}
          >
            <Download className="size-4" />
            Download a copy
          </Button>
        </div>

        <div className="bg-muted/40 rounded-lg border p-3">
          <div className="text-muted-foreground mb-2 flex items-center gap-1.5 font-mono text-[10px] tracking-wide uppercase">
            <Clock className="size-3" />
            Expiring links
          </div>
          <div className="mb-2 flex gap-1.5">
            {EXPIRY_OPTIONS.map((o) => (
              <span
                key={o}
                className="text-muted-foreground rounded-md border px-2 py-1 text-xs opacity-60"
              >
                {o}
              </span>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Temporary read-only links arrive when you connect optional cloud
            storage — kept separate so the default stays fully private.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
