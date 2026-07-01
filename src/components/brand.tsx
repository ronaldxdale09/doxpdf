import Link from "next/link";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The DoxPDF mark — a leaf with a folded corner. Reads as a page at 14px next
 * to text and as a bold, singular silhouette blown up to a 500px watermark.
 * Inherits `currentColor`, so callers set the color (terracotta by default in
 * the wordmark).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-7", className)}
      stroke="currentColor"
      strokeWidth={1.55}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 3H14L18 7V21H6V3Z" />
      <path d="M14 3V7H18" />
    </svg>
  );
}

/** Logo + wordmark, optionally linking home. */
export function Brand({
  className,
  href = "/",
  showWordmark = true,
}: {
  className?: string;
  href?: string | null;
  showWordmark?: boolean;
}) {
  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="text-signal" />
      {showWordmark && (
        <span className="font-sans text-[1.15rem] leading-none font-semibold tracking-[-0.01em]">
          Dox<span className="text-muted-foreground">PDF</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={APP_NAME}
        className="transition-opacity hover:opacity-80"
      >
        {content}
      </Link>
    );
  }
  return content;
}
