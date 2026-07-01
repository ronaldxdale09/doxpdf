"use client";

import { Brand, BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { UploadDropzone } from "@/features/upload/components/upload-dropzone";

const TRUST = "No account · No upload · No watermark · Open source";

/** Rendered in the editor route when no document is loaded (e.g. on refresh). */
export function EditorEmptyState() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-5">
        <Brand />
        <ThemeToggle />
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_55%_55%_at_50%_42%,black,transparent_75%)]"
        />
        <BrandMark
          aria-hidden
          className="text-signal/[0.05] pointer-events-none absolute top-1/2 left-1/2 size-[24rem] -translate-x-1/2 -translate-y-[125%] rotate-12"
        />

        <div className="animate-in fade-in slide-in-from-bottom-4 relative w-full max-w-md text-center duration-700">
          <span className="text-muted-foreground inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase">
            <BrandMark className="text-signal size-3.5" />
            Local-first PDF editor
          </span>
          <h1 className="font-display mt-5 text-3xl font-medium tracking-[-0.01em] text-balance sm:text-4xl">
            Open a PDF to start editing.
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-sm text-pretty">
            Highlight, annotate, sign, and edit text — all on your device.
          </p>

          <div className="mt-8">
            <UploadDropzone variant="hero" highlighted redirectTo={null} />
          </div>

          <p className="text-muted-foreground/80 mt-5 font-mono text-[10.5px] tracking-[0.12em] uppercase">
            {TRUST}
          </p>
        </div>
      </div>
    </div>
  );
}
