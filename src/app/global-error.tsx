"use client";

import { useEffect } from "react";

import "./globals.css";

/**
 * Last-resort boundary for errors thrown in the root layout itself. Must render
 * its own <html>/<body>. Kept dependency-light so it can't fail to render.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DoxPDF] global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans antialiased">
        <main className="grid min-h-dvh place-items-center px-6 text-center">
          <div className="max-w-md">
            <h1 className="font-display text-3xl font-medium tracking-[-0.01em]">
              Something went wrong.
            </h1>
            <p className="text-muted-foreground mt-3">
              Please reload the page to continue. Your files stay on your device.
            </p>
            <button
              onClick={reset}
              className="bg-primary text-primary-foreground mt-8 inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium"
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
