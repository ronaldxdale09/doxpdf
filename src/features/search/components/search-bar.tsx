"use client";

import { CaseSensitive, ChevronDown, ChevronUp, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { runSearch } from "@/lib/pdf/search";
import { useDocumentStore } from "@/store/document-store";
import { useSearchStore } from "@/store/search-store";

/** Floating find bar with match navigation and case sensitivity. */
export function SearchBar() {
  const open = useSearchStore((s) => s.open);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const caseSensitive = useSearchStore((s) => s.caseSensitive);
  const setCaseSensitive = useSearchStore((s) => s.setCaseSensitive);
  const matches = useSearchStore((s) => s.matches);
  const activeIndex = useSearchStore((s) => s.activeIndex);
  const searching = useSearchStore((s) => s.searching);
  const next = useSearchStore((s) => s.next);
  const prev = useSearchStore((s) => s.prev);
  const setOpen = useSearchStore((s) => s.setOpen);
  const clear = useSearchStore((s) => s.clear);
  const goToPage = useDocumentStore((s) => s.goToPage);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void runSearch(query, caseSensitive), 180);
    return () => clearTimeout(t);
  }, [query, caseSensitive, open]);

  useEffect(() => {
    const m = matches[activeIndex];
    if (m) goToPage(m.order + 1);
  }, [activeIndex, matches, goToPage]);

  if (!open) return null;

  const count = matches.length;

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 absolute top-3 right-4 z-30 flex items-center gap-1 rounded-full border p-1 shadow-lg backdrop-blur">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) prev();
            else next();
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Find in document"
        className="h-8 w-44 bg-transparent px-3 text-sm outline-none"
      />
      <span className="text-muted-foreground min-w-[3.25rem] px-1 text-center font-mono text-xs tabular-nums">
        {searching ? "…" : count ? `${activeIndex + 1}/${count}` : query ? "0/0" : ""}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        disabled={!count}
        onClick={prev}
        aria-label="Previous match"
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        disabled={!count}
        onClick={next}
        aria-label="Next match"
      >
        <ChevronDown className="size-4" />
      </Button>
      <Button
        variant={caseSensitive ? "secondary" : "ghost"}
        size="icon"
        className="size-7 rounded-full"
        onClick={() => setCaseSensitive(!caseSensitive)}
        aria-label="Match case"
      >
        <CaseSensitive className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        onClick={() => {
          setOpen(false);
          clear();
        }}
        aria-label="Close search"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
