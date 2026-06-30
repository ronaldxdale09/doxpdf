import Link from "next/link";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** The DoxPDF logo mark — a document with an amber highlighter stroke. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-foreground text-background relative grid size-8 shrink-0 place-items-center rounded-[0.5rem]",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-[1.05rem]"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M16 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7z" />
      </svg>
      <span className="bg-signal absolute top-[57%] left-1/2 h-[3px] w-[11px] -translate-x-1/2 rounded-full" />
    </span>
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
      <BrandMark />
      {showWordmark && (
        <span className="font-display text-[1.05rem] leading-none font-semibold tracking-tight">
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
