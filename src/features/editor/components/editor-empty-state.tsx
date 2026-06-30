"use client";

import { Brand } from "@/components/brand";
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
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[24rem] w-[44rem] max-w-[130vw] -translate-x-1/2 -translate-y-[60%] rounded-full bg-[radial-gradient(closest-side,oklch(0.8_0.16_75/0.14),transparent)]"
        />

        <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-md text-center duration-700">
          <span className="text-muted-foreground inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase">
            <span className="bg-signal size-1.5 rounded-full" />
            Local-first PDF editor
          </span>
          <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
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
