"use client";

import Link from "next/link";
import { useEffect } from "react";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

/** Route-level error page for the editor and landing segments. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DoxPDF] route error", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="animate-in fade-in slide-in-from-bottom-4 max-w-md duration-500">
        <BrandMark className="text-signal mx-auto size-9" />
        <h1 className="font-display mt-6 text-3xl font-medium tracking-[-0.01em]">
          Something went wrong.
        </h1>
        <p className="text-muted-foreground mt-3 text-pretty">
          An unexpected error interrupted the editor. Your file was never
          uploaded, so nothing left your device. You can try again or start over.
        </p>
        <div className="mt-8 flex items-center justify-center gap-2.5">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Go home
          </Button>
        </div>
      </div>
    </main>
  );
}
