"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatFileSize } from "@/lib/constants";
import { readMetadata } from "@/lib/pdf/metadata";
import { useDocumentStore } from "@/store/document-store";
import type { PdfMetadata } from "@/types/pdf";

const EMPTY: PdfMetadata = {
  title: "",
  author: "",
  subject: "",
  keywords: "",
  creator: "",
};

export function DocumentPropertiesDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const file = useDocumentStore((s) => s.file);
  const numPages = useDocumentStore((s) => s.numPages);
  const metadata = useDocumentStore((s) => s.metadata);
  const setMetadata = useDocumentStore((s) => s.setMetadata);

  const [form, setForm] = useState<PdfMetadata>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !file) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const existing = metadata ?? (await readMetadata(file));
        if (!cancelled) setForm(existing);
      } catch {
        if (!cancelled) setForm(metadata ?? EMPTY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [open, file, metadata]);

  const update =
    (key: keyof PdfMetadata) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = () => {
    setMetadata(form);
    toast.success("Saved — applied on your next download.");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Document properties</DialogTitle>
          <DialogDescription>
            Edit metadata — applied when you download.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {(
              [
                ["title", "Title"],
                ["author", "Author"],
                ["subject", "Subject"],
                ["keywords", "Keywords (comma separated)"],
                ["creator", "Creator"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-muted-foreground mb-1 block font-mono text-[10px] tracking-wide uppercase">
                  {label}
                </label>
                <Input value={form[key]} onChange={update(key)} className="h-8" />
              </div>
            ))}

            <div className="text-muted-foreground border-t pt-3 font-mono text-[11px]">
              {file?.name} · {numPages} page{numPages === 1 ? "" : "s"}
              {file ? ` · ${formatFileSize(file.size)}` : ""}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={loading}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
