"use client";

import { useEffect, useRef, useState } from "react";
import { Page } from "react-pdf";

import { AnnotationLayer } from "@/features/annotations/components/annotation-layer";
import { SearchHighlights } from "@/features/search/components/search-highlights";
import { useInlineTextEdit } from "@/features/text-edit/use-inline-text-edit";
import { useDocumentStore } from "@/store/document-store";
import type { PageSlot } from "@/types/pdf";

import { PagePlaceholder } from "./page-placeholder";

interface LazyPageProps {
  /** 1-indexed position of this slot in the document. */
  position: number;
  slot: PageSlot;
  width: number;
  estimatedHeight: number;
  registerRef: (position: number, el: HTMLElement | null) => void;
}

/**
 * Renders a single page slot, mounting the (expensive) react-pdf <Page> canvas
 * only when near the viewport. Blank slots render as empty pages.
 */
export function LazyPage({
  position,
  slot,
  width,
  estimatedHeight,
  registerRef,
}: LazyPageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const setPageSize = useDocumentStore((s) => s.setPageSize);
  const onDoubleClick = useInlineTextEdit(slot);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerRef(position, el);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "1200px 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      registerRef(position, null);
    };
  }, [position, registerRef]);

  const isBlank = slot.src === 0;

  return (
    <div
      ref={ref}
      data-slot-position={position}
      onDoubleClick={onDoubleClick}
      className="relative isolate mx-auto rounded-md bg-white shadow-[0_10px_34px_-14px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.07] dark:ring-white/10"
      style={{ width, minHeight: estimatedHeight }}
    >
      {visible ? (
        <>
          {isBlank ? (
            <div style={{ width, height: estimatedHeight }} />
          ) : (
            <Page
              pageNumber={slot.src}
              width={width}
              rotate={slot.rotation}
              renderTextLayer
              renderAnnotationLayer
              onLoadSuccess={(page) =>
                setPageSize(slot.src, {
                  width: page.originalWidth,
                  height: page.originalHeight,
                })
              }
              loading={
                <PagePlaceholder height={estimatedHeight} pageNumber={position} />
              }
              error={
                <PagePlaceholder height={estimatedHeight} pageNumber={position} />
              }
            />
          )}
          <SearchHighlights
            slotId={slot.id}
            src={slot.src}
            rotation={slot.rotation}
          />
          <AnnotationLayer
            slotId={slot.id}
            src={slot.src}
            rotation={slot.rotation}
          />
        </>
      ) : (
        <PagePlaceholder height={estimatedHeight} pageNumber={position} />
      )}
    </div>
  );
}
