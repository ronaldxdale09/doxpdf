"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  deletePage,
  duplicatePage,
  insertBlankPage,
  reorderPages,
  rotatePage,
} from "@/lib/annotations/page-operations";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/store/document-store";

import { LazyThumbnail } from "./lazy-thumbnail";

const THUMB_WIDTH = 116;

/** Collapsible left sidebar: page thumbnails + page operations. */
export function ThumbnailSidebar() {
  const open = useDocumentStore((s) => s.sidebarOpen);
  const pages = useDocumentStore((s) => s.pages);
  const currentPage = useDocumentStore((s) => s.currentPage);
  const goToPage = useDocumentStore((s) => s.goToPage);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Keep the active thumbnail in view as the centered page changes.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    root
      .querySelector<HTMLElement>(`[data-thumb-pos="${currentPage}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [currentPage]);

  return (
    <aside
      className={cn(
        "bg-sidebar hidden h-full shrink-0 overflow-hidden border-r transition-[width] duration-200 md:flex md:flex-col",
        open ? "w-[148px]" : "w-0 border-r-0",
      )}
    >
      <div className="flex h-full w-[148px] flex-col">
        <div className="text-muted-foreground flex h-9 shrink-0 items-center justify-between px-3 text-[11px] font-semibold tracking-wide uppercase">
          <span>Pages</span>
          <span className="font-mono normal-case">{pages.length}</span>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {pages.length > 0
            ? pages.map((slot, i) => (
                <div
                  key={slot.id}
                  data-thumb-pos={i + 1}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (overIndex !== i) setOverIndex(i);
                  }}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== i) {
                      reorderPages(dragIndex, i);
                    }
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={cn(
                    "rounded-md border-y-2 border-transparent",
                    overIndex === i &&
                      dragIndex !== null &&
                      dragIndex !== i &&
                      "border-t-signal",
                    dragIndex === i && "opacity-40",
                  )}
                >
                  <LazyThumbnail
                    slot={slot}
                    position={i + 1}
                    width={THUMB_WIDTH}
                    active={currentPage === i + 1}
                    canDelete={pages.length > 1}
                    onSelect={() => goToPage(i + 1)}
                    onRotate={() => rotatePage(slot.id, 1)}
                    onDuplicate={() => duplicatePage(slot.id)}
                    onDelete={() => deletePage(slot.id)}
                  />
                </div>
              ))
            : Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="bg-muted mx-auto my-2 animate-pulse rounded"
                  style={{ width: THUMB_WIDTH, height: THUMB_WIDTH * 1.32 }}
                />
              ))}
        </div>

        <div className="shrink-0 border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => insertBlankPage(currentPage - 1)}
          >
            <Plus className="size-4" />
            Insert blank page
          </Button>
        </div>
      </div>
    </aside>
  );
}
