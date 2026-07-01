"use client";

import { Loader2, ScanSearch, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createAnnotation } from "@/lib/annotations/defaults";
import { scanPdfForPii, type PiiRegion } from "@/lib/pdf/pii";
import { useAnnotationStore } from "@/store/annotation-store";
import { useDocumentStore } from "@/store/document-store";
import { useEditorStore } from "@/store/editor-store";

/** Mask a value so screenshots/shared screens don't expose it in full. */
function mask(v: string): string {
  const s = v.trim();
  if (s.length <= 6) return s;
  return `${s.slice(0, 2)}••••${s.slice(-2)}`;
}

/**
 * The Redact tool's companion: a "Find sensitive info" scan (fully on-device)
 * that turns detected PII into redaction marks. Shown top-center while the redact
 * tool is active and nothing is selected (so it never overlaps the style bar).
 */
export function RedactionControls() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const [scanning, setScanning] = useState(false);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<PiiRegion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const pages = useDocumentStore((s) => s.pages);

  const grouped = useMemo(() => {
    const byType = new Map<string, { label: string; items: { r: PiiRegion; i: number }[] }>();
    results.forEach((r, i) => {
      const g = byType.get(r.type) ?? { label: r.label, items: [] };
      g.items.push({ r, i });
      byType.set(r.type, g);
    });
    return [...byType.values()];
  }, [results]);

  const pageNoOf = (pageId: string) =>
    pages.findIndex((p) => p.id === pageId) + 1;

  const runScan = async () => {
    const { pdfProxy, pages: slots } = useDocumentStore.getState();
    if (!pdfProxy) return;
    setScanning(true);
    try {
      const found = await scanPdfForPii(pdfProxy, slots);
      setResults(found);
      setSelected(new Set(found.map((_, i) => i)));
      setOpen(true);
      if (found.length === 0) toast.message("No sensitive info detected.");
    } catch (error) {
      console.error("[DoxPDF] PII scan failed", error);
      toast.error("Couldn't scan the document.");
    } finally {
      setScanning(false);
    }
  };

  const redactSelected = () => {
    const add = useAnnotationStore.getState().add;
    let n = 0;
    results.forEach((r, i) => {
      if (!selected.has(i)) return;
      add(
        createAnnotation("redaction", r.pageId, {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          color: "#000000",
          text: r.value, // enables export-time verification of this string
        }),
      );
      n++;
    });
    useEditorStore.getState().setActiveTool("select");
    useAnnotationStore.getState().select(null);
    setOpen(false);
    if (n > 0)
      toast.success(
        `Marked ${n} item${n > 1 ? "s" : ""} for redaction — Download to apply.`,
      );
  };

  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <>
      {activeTool === "redaction" && !selectedId && (
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-3.5 shadow-lg backdrop-blur">
          <span className="text-muted-foreground text-sm">
            Drag to mask, or
          </span>
          <Button size="sm" onClick={runScan} disabled={scanning}>
            {scanning ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ScanSearch className="size-3.5" />
            )}
            Find sensitive info
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={(o: boolean) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sensitive information</DialogTitle>
            <DialogDescription>
              Scanned entirely on your device. Choose what to redact — marks are
              applied (and permanently removed) when you download.
            </DialogDescription>
          </DialogHeader>

          {results.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Nothing sensitive was detected.
            </p>
          ) : (
            <div className="max-h-[22rem] space-y-4 overflow-y-auto">
              {grouped.map((g) => (
                <div key={g.label}>
                  <div className="text-muted-foreground mb-1.5 font-mono text-[10px] tracking-[0.14em] uppercase">
                    {g.label} · {g.items.length}
                  </div>
                  <div className="space-y-1">
                    {g.items.map(({ r, i }) => (
                      <label
                        key={i}
                        className="hover:bg-accent/50 flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(i)}
                          onChange={() => toggle(i)}
                          className="accent-signal size-4"
                        />
                        <span className="font-mono text-sm">{mask(r.value)}</span>
                        <span className="text-muted-foreground ml-auto text-xs">
                          page {pageNoOf(r.pageId)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t pt-3">
            <button
              type="button"
              className="text-muted-foreground text-sm underline-offset-4 hover:underline"
              onClick={() =>
                setSelected(
                  selected.size === results.length
                    ? new Set()
                    : new Set(results.map((_, i) => i)),
                )
              }
            >
              {selected.size === results.length ? "Clear all" : "Select all"}
            </button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={redactSelected}
                disabled={selected.size === 0}
              >
                <ShieldCheck className="size-3.5" />
                Redact {selected.size} selected
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
