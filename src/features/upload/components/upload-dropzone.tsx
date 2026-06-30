"use client";

import { FileUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/store/document-store";

import { usePdfDropzone } from "../hooks/use-pdf-dropzone";

type Variant = "hero" | "compact" | "invert";

interface UploadDropzoneProps {
  className?: string;
  variant?: Variant;
  /** Adds an amber glow + extra size to make it the page's focal CTA. */
  highlighted?: boolean;
  /** Where to navigate after a file is chosen. Pass null to stay in place. */
  redirectTo?: string | null;
}

export function UploadDropzone({
  className,
  variant = "hero",
  highlighted = false,
  redirectTo = "/editor",
}: UploadDropzoneProps) {
  const router = useRouter();
  const openFile = useDocumentStore((s) => s.openFile);
  const [loading, setLoading] = useState(false);

  const handleFile = (file: File) => {
    openFile(file);
    if (redirectTo) {
      setLoading(true);
      router.push(redirectTo);
    } else {
      toast.success(`Opened ${file.name}`);
    }
  };

  const { isDragging, openFilePicker, dropzoneProps, inputProps } =
    usePdfDropzone({ onFile: handleFile, onError: (m) => toast.error(m) });

  const invert = variant === "invert";
  const big = variant === "hero";

  return (
    <div
      {...dropzoneProps}
      role="button"
      tabIndex={0}
      aria-label="Upload a PDF — drop it here or press Enter to browse"
      onClick={openFilePicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openFilePicker();
        }
      }}
      className={cn(
        "group focus-visible:ring-ring/60 relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-all duration-200 outline-none focus-visible:ring-2",
        big ? "gap-3 px-8 py-12" : "gap-2.5 px-6 py-8",
        highlighted &&
          "rounded-2xl px-7 py-9 ring-1 shadow-[0_16px_46px_-24px] sm:px-10 sm:py-11",
        invert
          ? isDragging
            ? "border-signal bg-background/10"
            : "border-background/30 hover:border-background/60 hover:bg-background/5"
          : isDragging
            ? "border-signal bg-signal/10 ring-signal/30 shadow-signal/30"
            : highlighted
              ? "border-signal/45 bg-signal/[0.04] ring-signal/15 shadow-signal/25 hover:border-signal/70 hover:bg-signal/[0.07]"
              : "border-border hover:border-signal/50 hover:bg-accent/40",
        className,
      )}
    >
      <input {...inputProps} />

      <span
        className={cn(
          "grid place-items-center rounded-xl transition-colors",
          highlighted ? "size-14" : big ? "size-12" : "size-11",
          isDragging
            ? "bg-signal text-signal-foreground"
            : invert
              ? "bg-background/10 text-background"
              : highlighted
                ? "bg-signal text-signal-foreground shadow-sm"
                : "bg-foreground text-background",
        )}
      >
        {loading ? (
          <Loader2 className={cn("animate-spin", highlighted ? "size-6" : "size-5")} />
        ) : (
          <FileUp className={highlighted ? "size-6" : "size-5"} />
        )}
      </span>

      <div className="space-y-0.5">
        <p
          className={cn(
            "font-medium",
            highlighted ? "text-lg sm:text-xl" : big ? "text-lg" : "",
            invert && "text-background",
          )}
        >
          {isDragging ? "Drop to open" : "Drop your PDF here"}
        </p>
        <p
          className={cn(
            "text-sm",
            invert ? "text-background/60" : "text-muted-foreground",
          )}
        >
          or{" "}
          <span
            className={cn(
              "font-medium underline-offset-4 group-hover:underline",
              invert ? "text-background" : "text-foreground",
            )}
          >
            browse files
          </span>
        </p>
      </div>

      <p
        className={cn(
          "mt-1 font-mono text-[10px] tracking-wider uppercase",
          invert ? "text-background/50" : "text-muted-foreground/70",
        )}
      >
        PDF · up to 100MB · stays on your device
      </p>
    </div>
  );
}
