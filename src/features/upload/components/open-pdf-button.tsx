"use client";

import { FileUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/store/document-store";

import { usePdfDropzone } from "../hooks/use-pdf-dropzone";

interface OpenPdfButtonProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * A pill button that opens the native file picker (or accepts a dropped PDF)
 * and jumps straight into the editor with the file loaded. Marketing-page CTA;
 * shares the headless dropzone logic with {@link UploadDropzone}.
 */
export function OpenPdfButton({
  className,
  children = "Open a PDF",
}: OpenPdfButtonProps) {
  const router = useRouter();
  const openFile = useDocumentStore((s) => s.openFile);
  const [loading, setLoading] = useState(false);

  const handleFile = (file: File) => {
    openFile(file);
    setLoading(true);
    router.push("/editor");
  };

  const { isDragging, openFilePicker, dropzoneProps, inputProps } =
    usePdfDropzone({ onFile: handleFile, onError: (m) => toast.error(m) });

  return (
    <button
      type="button"
      {...dropzoneProps}
      onClick={openFilePicker}
      className={cn(
        "bg-signal text-signal-foreground focus-visible:ring-signal/50 focus-visible:ring-offset-background inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold whitespace-nowrap transition-transform outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0",
        isDragging && "ring-signal ring-2 ring-offset-2",
        className,
      )}
    >
      <input {...inputProps} />
      {loading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <FileUp className="size-5" />
      )}
      {loading ? "Opening…" : isDragging ? "Drop to open" : children}
    </button>
  );
}
