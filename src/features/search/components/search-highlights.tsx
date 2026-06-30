"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { displaySize } from "@/lib/annotations/geometry";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/store/document-store";
import { useSearchStore } from "@/store/search-store";

/** Transient yellow highlight overlay for search matches on a page slot. */
export function SearchHighlights({
  slotId,
  src,
  rotation,
}: {
  slotId: string;
  src: number;
  rotation: number;
}) {
  const matches = useSearchStore((s) => s.matches);
  const activeIndex = useSearchStore((s) => s.activeIndex);
  const pageSizes = useDocumentStore((s) => s.pageSizes);
  const defaultPageSize = useDocumentStore((s) => s.defaultPageSize);

  const containerRef = useRef<HTMLDivElement>(null);
  const [pxWidth, setPxWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setPxWidth(entry.contentRect.width),
    );
    ro.observe(el);
    setPxWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const srcSize = (src > 0 ? pageSizes[src] : null) ?? defaultPageSize;
  const display = srcSize
    ? displaySize(rotation, srcSize.width, srcSize.height)
    : null;
  const scale = display && pxWidth > 0 ? pxWidth / display.width : 0;
  const activeId = matches[activeIndex]?.id;
  const slotMatches = matches.filter((m) => m.slotId === slotId);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-[9]">
      {scale > 0 &&
        slotMatches.map((m) => (
          <div
            key={m.id}
            className={cn(
              "absolute rounded-[1px]",
              m.id === activeId
                ? "bg-orange-400/55 ring-1 ring-orange-600"
                : "bg-yellow-300/45",
            )}
            style={{
              left: m.x * scale,
              top: m.y * scale,
              width: m.width * scale,
              height: m.height * scale,
            }}
          />
        ))}
    </div>
  );
}
