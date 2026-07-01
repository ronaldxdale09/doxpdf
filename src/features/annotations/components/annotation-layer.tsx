"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import {
  DRAW_PRESETS,
  STAMP_PRESETS,
  createAnnotation,
} from "@/lib/annotations/defaults";
import {
  bboxFromPoints,
  computeSnap,
  displaySize,
  type Guide,
  rectFromCorners,
} from "@/lib/annotations/geometry";
import { clamp } from "@/lib/constants";
import { useAnnotationStore } from "@/store/annotation-store";
import { useDocumentStore } from "@/store/document-store";
import { useEditorStore } from "@/store/editor-store";
import { useToolSettingsStore } from "@/store/tool-settings-store";
import type { Annotation, AnnotationType } from "@/types/annotations";

import { AnnotationItem } from "./annotation-item";

const CREATION_TOOLS = new Set([
  "text",
  "draw",
  "highlight",
  "shape",
  "note",
  "stamp",
]);

interface AnnotationLayerProps {
  /** Slot id this layer belongs to (annotation key). */
  slotId: string;
  /** Source page number (for intrinsic size); 0 for blank. */
  src: number;
  /** Slot rotation in degrees. */
  rotation: number;
}

/** Per-page interactive overlay: creates and renders annotations over a slot. */
export function AnnotationLayer({ slotId, src, rotation }: AnnotationLayerProps) {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const settings = useToolSettingsStore();

  const pageSizes = useDocumentStore((s) => s.pageSizes);
  const defaultPageSize = useDocumentStore((s) => s.defaultPageSize);

  // Subscribe only to THIS slot's annotations (shallow-compared) so a freehand
  // stroke — which updates the store ~60×/s — re-renders just the page being
  // drawn on, not every other visible page's layer.
  const pageAnnotations = useAnnotationStore(
    useShallow((s) => s.annotations.filter((a) => a.pageId === slotId)),
  );
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const editingId = useAnnotationStore((s) => s.editingId);
  const add = useAnnotationStore((s) => s.add);
  const update = useAnnotationStore((s) => s.update);
  const remove = useAnnotationStore((s) => s.remove);
  const select = useAnnotationStore((s) => s.select);
  const setEditingId = useAnnotationStore((s) => s.setEditing);
  const commit = useAnnotationStore((s) => s.commit);

  const containerRef = useRef<HTMLDivElement>(null);
  const [pxWidth, setPxWidth] = useState(0);
  const [guides, setGuides] = useState<Guide[]>([]);
  const creatingRef = useRef<{
    id: string;
    type: AnnotationType;
    start: { x: number; y: number };
  } | null>(null);

  const srcSize = (src > 0 ? pageSizes[src] : null) ?? defaultPageSize;
  const display = srcSize
    ? displaySize(rotation, srcSize.width, srcSize.height)
    : null;
  const pageWidthPt = display?.width ?? 0;
  const pageHeightPt = display?.height ?? 0;
  const scale = pageWidthPt > 0 && pxWidth > 0 ? pxWidth / pageWidthPt : 0;

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

  const isCreation = CREATION_TOOLS.has(activeTool);

  const toPagePoint = (clientX: number, clientY: number) => {
    const r = containerRef.current!.getBoundingClientRect();
    return {
      x: clamp((clientX - r.left) / scale, 0, pageWidthPt),
      y: clamp((clientY - r.top) / scale, 0, pageHeightPt),
    };
  };

  const resolveType = (): AnnotationType | null => {
    if (activeTool === "shape") return settings.shapeKind;
    if (["text", "draw", "highlight", "note", "stamp"].includes(activeTool)) {
      return activeTool as AnnotationType;
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!isCreation || scale <= 0 || e.button !== 0) return;
    const type = resolveType();
    if (!type) return;
    e.preventDefault();
    try {
      containerRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // ignore — pointer capture is best-effort
    }
    const start = toPagePoint(e.clientX, e.clientY);

    if (type === "text") {
      const a = createAnnotation("text", slotId, {
        x: start.x,
        y: start.y,
        width: 180,
        height: 30,
        color: settings.color,
        fontSize: settings.fontSize,
        fontId: settings.fontId,
        fontFamily: settings.fontFamily,
        fontCategory: settings.fontCategory,
      });
      add(a);
      setEditingId(a.id);
      setActiveTool("select");
      return;
    }
    if (type === "note") {
      const a = createAnnotation("note", slotId, {
        x: start.x - 12,
        y: start.y - 12,
        color: "#F59E0B",
      });
      add(a);
      setActiveTool("select");
      return;
    }
    if (type === "stamp") {
      const preset = STAMP_PRESETS.find((p) => p.id === settings.stampVariant);
      const w = 150;
      const h = 48;
      const a = createAnnotation("stamp", slotId, {
        x: clamp(start.x - w / 2, 0, pageWidthPt - w),
        y: clamp(start.y - h / 2, 0, pageHeightPt - h),
        width: w,
        height: h,
        stampVariant: settings.stampVariant,
        color: preset?.color ?? "#22A06B",
      });
      add(a);
      setActiveTool("select");
      return;
    }
    if (type === "draw") {
      const preset = DRAW_PRESETS[settings.drawMode];
      const color =
        settings.drawMode === "highlighter"
          ? settings.highlightColor
          : settings.color;
      const a = createAnnotation("draw", slotId, {
        points: [start],
        x: start.x,
        y: start.y,
        width: 0,
        height: 0,
        color,
        strokeWidth: preset.strokeWidth,
        opacity: preset.opacity,
        drawMode: settings.drawMode,
      });
      add(a);
      creatingRef.current = { id: a.id, type, start };
      return;
    }
    if (type === "highlight") {
      const a = createAnnotation("highlight", slotId, {
        x: start.x,
        y: start.y,
        width: 0,
        height: 0,
        color: settings.highlightColor,
        opacity: 0.4,
      });
      add(a);
      creatingRef.current = { id: a.id, type, start };
      return;
    }
    if (type === "rect" || type === "ellipse") {
      const a = createAnnotation(type, slotId, {
        x: start.x,
        y: start.y,
        width: 0,
        height: 0,
        color: settings.color,
        strokeWidth: settings.strokeWidth,
        fill: settings.shapeFilled ? settings.color : null,
        opacity: settings.opacity,
      });
      add(a);
      creatingRef.current = { id: a.id, type, start };
      return;
    }
    if (type === "line" || type === "arrow") {
      const a = createAnnotation(type, slotId, {
        points: [start, start],
        x: start.x,
        y: start.y,
        width: 0,
        height: 0,
        color: settings.color,
        strokeWidth: settings.strokeWidth,
      });
      add(a);
      creatingRef.current = { id: a.id, type, start };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const c = creatingRef.current;
    if (!c || scale <= 0) return;
    const cur = toPagePoint(e.clientX, e.clientY);
    if (c.type === "draw") {
      // Read live state — the closure's `annotations` may be a render behind,
      // which would drop points during a fast stroke.
      const a = useAnnotationStore
        .getState()
        .annotations.find((x) => x.id === c.id);
      const points = [...(a?.points ?? []), cur];
      update(c.id, { points, ...bboxFromPoints(points) });
    } else if (c.type === "line" || c.type === "arrow") {
      const points = [c.start, cur];
      update(c.id, { points, ...bboxFromPoints(points) });
    } else {
      update(c.id, rectFromCorners(c.start, cur));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const c = creatingRef.current;
    if (!c) return;
    try {
      containerRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
    const a = useAnnotationStore.getState().annotations.find(
      (x) => x.id === c.id,
    );
    creatingRef.current = null;
    if (a) {
      const tiny =
        c.type === "draw"
          ? (a.points?.length ?? 0) < 2
          : a.width < 3 && a.height < 3;
      if (tiny) {
        remove(c.id);
        return;
      }
    }
    select(c.id);
  };

  const endEdit = (a: Annotation) => {
    setEditingId(null);
    // Drop empty notes and empty free text boxes. An inline edit (has a cover)
    // is kept even when emptied — the cover then simply erases the original.
    if (a.type === "note" && !a.text?.trim()) remove(a.id);
    else if (a.type === "text" && !a.coverColor && !a.text?.trim()) remove(a.id);
  };

  // Snap a dragged annotation to the page's edges/center and other annotations,
  // surfacing alignment guides. ~6px snap radius (converted to points).
  const resolveSnap = (box: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    const others = useAnnotationStore
      .getState()
      .annotations.filter((o) => o.pageId === slotId && o.id !== selectedId)
      .map((o) => ({ x: o.x, y: o.y, width: o.width, height: o.height }));
    const snap = computeSnap(box, others, pageWidthPt, pageHeightPt, 6 / scale);
    setGuides(snap.guides);
    return { x: snap.x, y: snap.y };
  };
  const clearGuides = () => setGuides([]);

  const cursor = isCreation
    ? activeTool === "text"
      ? "text"
      : "crosshair"
    : "default";

  return (
    <div
      ref={containerRef}
      // z-10 keeps the overlay above react-pdf's text layer (z-index 2), which
      // otherwise escapes the page's (non-)stacking context and intercepts clicks.
      className="absolute inset-0 z-10"
      style={{
        pointerEvents: isCreation ? "auto" : "none",
        // Stop the browser from panning/scrolling the page mid-stroke on touch
        // devices, so a freehand/shape drag actually draws.
        touchAction: isCreation ? "none" : undefined,
        cursor,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {scale > 0 &&
        pageAnnotations.map((a) => (
          <AnnotationItem
            key={a.id}
            annotation={a}
            scale={scale}
            selected={selectedId === a.id}
            editing={editingId === a.id && a.type === "text"}
            interactive={activeTool === "select"}
            onSelect={() => select(a.id)}
            onStartEdit={() => setEditingId(a.id)}
            onEndEdit={() => endEdit(a)}
            onCommit={commit}
            onChange={(patch) => update(a.id, patch)}
            onSnap={resolveSnap}
            onSnapEnd={clearGuides}
          />
        ))}

      {/* Alignment guides shown while dragging a selection. */}
      {scale > 0 &&
        guides.map((g, i) =>
          g.axis === "x" ? (
            <div
              key={i}
              className="bg-signal pointer-events-none absolute top-0 bottom-0 z-[60] w-px"
              style={{ left: g.pos * scale }}
            />
          ) : (
            <div
              key={i}
              className="bg-signal pointer-events-none absolute right-0 left-0 z-[60] h-px"
              style={{ top: g.pos * scale }}
            />
          ),
        )}
    </div>
  );
}
