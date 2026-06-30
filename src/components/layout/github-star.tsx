"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const REPO = "ronaldxdale09/doxpdf";
const REPO_URL = `https://github.com/${REPO}`;

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.298-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.209.96-.262 1.98-.392 3-.398 1.02.006 2.04.136 3 .398 2.28-1.525 3.285-1.209 3.285-1.209.645 1.624.24 2.823.12 3.121.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.182 0 1.578-.015 2.846-.015 3.229 0 .309.21.678.825.561C20.565 21.917 24 17.495 24 12.292 24 5.78 18.627.5 12 .5z" />
    </svg>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 9950 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(n);
}

/** "Star on GitHub" button with a live star count (fetched client-side). */
export function GitHubStar({ className }: { className?: string }) {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    // Public, no-auth call. Soft-fails on rate limit — the button still works.
    fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && typeof d.stargazers_count === "number") {
          setStars(d.stargazers_count);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Star DoxPDF on GitHub"
      className={cn(
        "border-border hover:border-foreground/25 hover:bg-accent group inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm font-medium transition-colors",
        className,
      )}
    >
      <GitHubMark className="size-[1.05rem]" />
      <Star className="size-3.5 transition-colors group-hover:fill-signal group-hover:text-signal" />
      <span className="hidden sm:inline">Star</span>
      {stars !== null && (
        <span className="flex items-center gap-1.5">
          <span className="bg-border h-3.5 w-px" />
          <span className="tabular-nums">{formatCount(stars)}</span>
        </span>
      )}
    </a>
  );
}
