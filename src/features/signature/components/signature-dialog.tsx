"use client";

import { Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { createAnnotation } from "@/lib/annotations/defaults";
import { displaySize } from "@/lib/annotations/geometry";
import { cn } from "@/lib/utils";
import { useAnnotationStore } from "@/store/annotation-store";
import { useDocumentStore } from "@/store/document-store";
import { useEditorStore } from "@/store/editor-store";
import {
  type SignatureKind,
  useSignatureStore,
} from "@/store/signature-store";

import { fileToImageDataUrl, typedSignatureToDataUrl } from "../lib/render";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";

const FONTS = [
  { var: "var(--font-sign-1)", label: "Signature" },
  { var: "var(--font-sign-2)", label: "Casual" },
  { var: "var(--font-sign-3)", label: "Formal" },
];

const INK_COLORS = ["#16182e", "#1d4ed8", "#b91c1c"];

/** Place a signature/initials PNG as an image annotation on the current page. */
function placeSignature(dataUrl: string, kind: SignatureKind) {
  const { currentPage, pages, pageSizes, defaultPageSize } =
    useDocumentStore.getState();
  const slot = pages[currentPage - 1];
  if (!slot) return;
  const srcSize =
    (slot.src > 0 ? pageSizes[slot.src] : null) ?? defaultPageSize;
  if (!srcSize) return;
  const size = displaySize(slot.rotation, srcSize.width, srcSize.height);

  const img = new Image();
  img.onload = () => {
    const w = size.width * (kind === "initials" ? 0.16 : 0.34);
    const h = w * (img.height / img.width || 0.4);
    useAnnotationStore.getState().add(
      createAnnotation("image", slot.id, {
        x: (size.width - w) / 2,
        y: (size.height - h) / 2,
        width: w,
        height: h,
        imageSrc: dataUrl,
      }),
    );
    useEditorStore.getState().setActiveTool("select");
  };
  img.src = dataUrl;
}

export function SignatureDialog() {
  const open = useSignatureStore((s) => s.dialogOpen);
  const closeDialog = useSignatureStore((s) => s.closeDialog);
  const signatures = useSignatureStore((s) => s.signatures);
  const addSignature = useSignatureStore((s) => s.add);
  const removeSignature = useSignatureStore((s) => s.remove);

  const padRef = useRef<SignaturePadHandle>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");
  const [fontIndex, setFontIndex] = useState(0);
  const [ink, setInk] = useState(INK_COLORS[0]);
  const [kind, setKind] = useState<SignatureKind>("signature");

  const commit = (dataUrl: string | null) => {
    if (!dataUrl) {
      toast.error("Nothing to add yet — draw, type, or upload first.");
      return;
    }
    addSignature(dataUrl, kind);
    placeSignature(dataUrl, kind);
    closeDialog();
  };

  const handleDraw = () => commit(padRef.current?.getDataUrl() ?? null);

  const handleType = async () => {
    const family = previewRef.current
      ? getComputedStyle(previewRef.current).fontFamily
      : FONTS[fontIndex].var;
    commit(await typedSignatureToDataUrl(typed, family, ink));
  };

  const handleUpload = async (file: File) => {
    try {
      commit(await fileToImageDataUrl(file));
    } catch {
      toast.error("Couldn't read that image.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o: boolean) => {
        if (!o) closeDialog();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add your signature</DialogTitle>
          <DialogDescription>
            Created on your device — never uploaded.
          </DialogDescription>
        </DialogHeader>

        {/* Saved signatures */}
        {signatures.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {signatures.map((sig) => (
              <div key={sig.id} className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    placeSignature(sig.dataUrl, sig.kind);
                    closeDialog();
                  }}
                  className="hover:border-signal grid h-12 w-24 place-items-center rounded-md border bg-white p-1"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sig.dataUrl}
                    alt="signature"
                    className="max-h-full max-w-full object-contain"
                  />
                </button>
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => removeSignature(sig.id)}
                  className="bg-background absolute -top-1.5 -right-1.5 hidden rounded-full border p-0.5 group-hover:block"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Kind toggle */}
        <div className="bg-muted flex w-fit items-center rounded-full p-0.5 text-xs">
          {(["signature", "initials"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "rounded-full px-3 py-1 capitalize transition-colors",
                kind === k
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {k}
            </button>
          ))}
        </div>

        <Tabs defaultValue="draw">
          <TabsList className="w-full">
            <TabsTrigger value="draw" className="flex-1">
              Draw
            </TabsTrigger>
            <TabsTrigger value="type" className="flex-1">
              Type
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">
              Upload
            </TabsTrigger>
          </TabsList>

          {/* Draw */}
          <TabsContent value="draw" className="space-y-3">
            <SignaturePad ref={padRef} color={ink} />
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {INK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    onClick={() => setInk(c)}
                    className={cn(
                      "size-6 rounded-full ring-1 ring-black/10",
                      ink === c && "ring-foreground ring-2",
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => padRef.current?.clear()}
              >
                Clear
              </Button>
            </div>
            <Button className="w-full" onClick={handleDraw}>
              Add to document
            </Button>
          </TabsContent>

          {/* Type */}
          <TabsContent value="type" className="space-y-3">
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type your name"
              autoFocus
            />
            <div className="flex gap-2">
              {FONTS.map((f, i) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setFontIndex(i)}
                  className={cn(
                    "flex-1 rounded-md border py-2 text-xl",
                    fontIndex === i
                      ? "border-signal bg-accent"
                      : "hover:bg-accent/50",
                  )}
                  style={{ fontFamily: f.var, color: ink }}
                >
                  {typed.trim() ? typed.slice(0, 8) : "Abc"}
                </button>
              ))}
            </div>
            <div
              ref={previewRef}
              className="grid h-20 place-items-center overflow-hidden rounded-lg border bg-white text-4xl"
              style={{ fontFamily: FONTS[fontIndex].var, color: ink }}
            >
              {typed.trim() || (
                <span className="text-muted-foreground text-base">
                  Preview
                </span>
              )}
            </div>
            <Button className="w-full" onClick={handleType}>
              Add to document
            </Button>
          </TabsContent>

          {/* Upload */}
          <TabsContent value="upload" className="space-y-3">
            <label className="hover:border-signal flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
              <Upload className="text-muted-foreground size-6" />
              <span className="text-muted-foreground text-sm">
                Choose an image of your signature
              </span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
