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
import {
  type FormField,
  type FormValues,
  readFormFields,
} from "@/lib/pdf/forms";
import { useDocumentStore } from "@/store/document-store";

export function FormsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const file = useDocumentStore((s) => s.file);
  const storeValues = useDocumentStore((s) => s.formValues);
  const setFormValues = useDocumentStore((s) => s.setFormValues);

  const [fields, setFields] = useState<FormField[] | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !file) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const found = await readFormFields(file);
        if (cancelled) return;
        setFields(found);
        const init: FormValues = {};
        for (const f of found) init[f.name] = storeValues[f.name] ?? f.value;
        setValues(init);
      } catch {
        if (!cancelled) setFields([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [open, file, storeValues]);

  const set = (name: string, value: string | boolean) =>
    setValues((v) => ({ ...v, [name]: value }));

  const save = () => {
    setFormValues(values);
    toast.success("Form values saved — applied on download.");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fill form</DialogTitle>
          <DialogDescription>
            Complete the document&apos;s fields — applied when you download.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : fields && fields.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            This PDF has no fillable form fields.
          </p>
        ) : (
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {fields?.map((f) => (
              <div key={f.name}>
                <label className="text-muted-foreground mb-1 flex items-center gap-2 font-mono text-[10px] tracking-wide uppercase">
                  {f.name}
                </label>
                {f.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="accent-signal size-4"
                      checked={!!values[f.name]}
                      onChange={(e) => set(f.name, e.target.checked)}
                    />
                    Checked
                  </label>
                ) : f.options && f.options.length > 0 ? (
                  <select
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => set(f.name, e.target.value)}
                    className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
                  >
                    <option value="">—</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => set(f.name, e.target.value)}
                    className="h-8"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {fields && fields.length > 0 && (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={save}>
              Save
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
