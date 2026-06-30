"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useAnnotationStore } from "@/store/annotation-store";
import { useDocumentStore } from "@/store/document-store";
import { useEditorStore } from "@/store/editor-store";

import { LazyPage } from "./lazy-page";

/** CSS px to reserve around the page column. */
const H_PADDING = 56;
const V_PADDING = 32;
/** Fallback aspect ratio (A4 portrait) before page 1's real size is known. */
const FALLBACK_ASPECT = 1.4142;
const CSS_PER_POINT = 96 / 72;

/**
 * Scrollable, vertically-stacked PDF page viewport. Renders inside a react-pdf
 * <Document> (provided by the editor shell), windows page canvases for
 * performance, tracks the centered page, and responds to zoom + scroll
 * navigation requests from the store.
 */
export function PdfViewer() {
  const pages = useDocumentStore((s) => s.pages);
  const zoom = useDocumentStore((s) => s.zoom);
  const fitMode = useDocumentStore((s) => s.fitMode);
  const defaultPageSize = useDocumentStore((s) => s.defaultPageSize);
  const scrollRequest = useDocumentStore((s) => s.scrollRequest);
  const setCurrentPage = useDocumentStore((s) => s.setCurrentPage);
  const zoomIn = useDocumentStore((s) => s.zoomIn);
  const zoomOut = useDocumentStore((s) => s.zoomOut);
  const activeTool = useEditorStore((s) => s.activeTool);
  const isHand = activeTool === "hand";

  const containerRef = useRef<HTMLDivElement>(null);
  const pageEls = useRef<Map<number, HTMLElement>>(new Map());
  const centered = useRef<Map<number, number>>(new Map());
  const pan = useRef<{ x: number; y: number; left: number; top: number } | null>(
    null,
  );

  const [size, setSize] = useState({ width: 0, height: 0 });

  // Measure the viewport.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Derive the rendered page width from fit mode + zoom.
  const aspect = defaultPageSize
    ? defaultPageSize.height / defaultPageSize.width
    : FALLBACK_ASPECT;
  const naturalWidth = defaultPageSize
    ? defaultPageSize.width * CSS_PER_POINT
    : 816;

  const pageWidth = useMemo(() => {
    const available = Math.max(size.width - H_PADDING, 240);
    if (fitMode === "width") return Math.round(available);
    if (fitMode === "page") {
      const availableH = Math.max(size.height - V_PADDING * 2, 240);
      return Math.round(Math.min(available, availableH / aspect));
    }
    return Math.round(Math.min(naturalWidth * zoom, available * 3));
  }, [fitMode, size.width, size.height, aspect, naturalWidth, zoom]);

  const estimatedHeight = Math.round(pageWidth * aspect);

  // Stable ref registration for child pages.
  const registerRef = useCallback(
    (pageNumber: number, el: HTMLElement | null) => {
      if (el) pageEls.current.set(pageNumber, el);
      else pageEls.current.delete(pageNumber);
    },
    [],
  );

  // Track the centered page using a narrow center band.
  useEffect(() => {
    const root = containerRef.current;
    if (!root || pages.length === 0) return;

    centered.current.clear();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const page = Number(
            entry.target.getAttribute("data-slot-position"),
          );
          if (!page) continue;
          if (entry.isIntersecting) {
            centered.current.set(page, entry.intersectionRect.height);
          } else {
            centered.current.delete(page);
          }
        }
        let best = -1;
        let bestArea = -1;
        for (const [page, area] of centered.current) {
          if (area > bestArea) {
            bestArea = area;
            best = page;
          }
        }
        if (best > 0) setCurrentPage(best);
      },
      { root, rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    for (const el of pageEls.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [pages.length, setCurrentPage]);

  // Scroll to a requested page.
  useEffect(() => {
    if (!scrollRequest) return;
    const el = pageEls.current.get(scrollRequest.page);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scrollRequest]);

  // Ctrl/⌘ + wheel to zoom (also fires on trackpad pinch).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomIn, zoomOut]);

  // Hand-tool drag panning.
  const onPointerDown = (e: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el) return;
    // Deselect when clicking page content (not an annotation) in select mode.
    if (activeTool === "select") {
      const t = e.target as HTMLElement;
      if (t.closest(".react-pdf__Page") && !t.closest("[data-annotation]")) {
        useAnnotationStore.getState().select(null);
      }
    }
    if (!isHand || e.button !== 0) return;
    pan.current = {
      x: e.clientX,
      y: e.clientY,
      left: el.scrollLeft,
      top: el.scrollTop,
    };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = containerRef.current;
    if (!pan.current || !el) return;
    el.scrollLeft = pan.current.left - (e.clientX - pan.current.x);
    el.scrollTop = pan.current.top - (e.clientY - pan.current.y);
  };

  const endPan = (e: React.PointerEvent) => {
    const el = containerRef.current;
    if (pan.current && el) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore — pointer may already be released
      }
    }
    pan.current = null;
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Document pages"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      className={cn(
        "bg-muted/30 dot-grid focus-visible:ring-ring/40 relative h-full flex-1 overflow-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset",
        isHand && "cursor-grab select-none active:cursor-grabbing",
      )}
    >
      <div
        className="flex flex-col items-center gap-5"
        style={{ paddingTop: V_PADDING, paddingBottom: V_PADDING * 3 }}
      >
        {pageWidth > 0
          ? pages.map((slot, i) => (
              <LazyPage
                key={slot.id}
                position={i + 1}
                slot={slot}
                width={pageWidth}
                estimatedHeight={estimatedHeight}
                registerRef={registerRef}
              />
            ))
          : null}
      </div>
    </div>
  );
}
