"use client";

import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";

import { STAMP_PRESETS } from "@/lib/annotations/defaults";
import { translatePoints } from "@/lib/annotations/geometry";
import { ReflowBlock } from "@/features/text-edit/reflow-block";
import type { Annotation, AnnotationType } from "@/types/annotations";

const RESIZABLE: Record<AnnotationType, boolean> = {
  text: true,
  rect: true,
  ellipse: true,
  highlight: true,
  stamp: true,
  image: true,
  note: false,
  draw: false,
  line: false,
  arrow: false,
};

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AnnotationItemProps {
  annotation: Annotation;
  scale: number; // px per point
  selected: boolean;
  editing: boolean;
  interactive: boolean; // select tool active
  onSelect: () => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onCommit: () => void;
  onChange: (patch: Partial<Annotation>) => void;
  /** Snap a dragged box (page points) to alignment targets; shows guides. */
  onSnap?: (box: Box) => { x: number; y: number };
  /** Drag ended — clear any guides. */
  onSnapEnd?: () => void;
}

export function AnnotationItem({
  annotation: a,
  scale,
  selected,
  editing,
  interactive,
  onSelect,
  onStartEdit,
  onEndEdit,
  onCommit,
  onChange,
  onSnap,
  onSnapEnd,
}: AnnotationItemProps) {
  const px = (v: number) => v * scale;
  // Live drag position (px) while snapping; null when not dragging.
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  // Raw (un-snapped) pointer position (px), tracked via deltas so snapping never
  // drifts the way react-draggable's controlled `position` otherwise would.
  const rawRef = useRef<{ x: number; y: number } | null>(null);
  const visual = <AnnotationVisual a={a} scale={scale} editing={editing} onChange={onChange} onEndEdit={onEndEdit} />;

  // Plain (non-selected) annotation: positioned div, selectable on click.
  if (!selected || !interactive) {
    return (
      <div
        data-annotation
        className="absolute"
        style={{
          left: px(a.x),
          top: px(a.y),
          width: px(a.width),
          height: px(a.height),
          transform: a.rotation ? `rotate(${a.rotation}deg)` : undefined,
          opacity: a.opacity,
          pointerEvents: interactive ? "auto" : "none",
          cursor: interactive ? "pointer" : "default",
        }}
        onPointerDown={
          interactive
            ? (e) => {
                e.stopPropagation();
                onSelect();
              }
            : undefined
        }
        onDoubleClick={
          interactive && a.type === "text" ? () => onStartEdit() : undefined
        }
      >
        {visual}
      </div>
    );
  }

  // Selected: draggable / resizable.
  const resizable = RESIZABLE[a.type] && !editing;
  return (
    <Rnd
      size={{ width: px(a.width), height: px(a.height) }}
      position={dragPos ?? { x: px(a.x), y: px(a.y) }}
      bounds="parent"
      disableDragging={editing}
      enableResizing={resizable}
      onDragStart={() => {
        onCommit();
        rawRef.current = { x: px(a.x), y: px(a.y) };
      }}
      onDrag={(_e, d) => {
        if (!rawRef.current) return;
        // Accumulate the raw pointer delta, then snap that (not the rendered pos).
        rawRef.current = {
          x: rawRef.current.x + d.deltaX,
          y: rawRef.current.y + d.deltaY,
        };
        const raw = rawRef.current;
        if (onSnap) {
          const s = onSnap({
            x: raw.x / scale,
            y: raw.y / scale,
            width: a.width,
            height: a.height,
          });
          setDragPos({ x: s.x * scale, y: s.y * scale });
        } else {
          setDragPos({ ...raw });
        }
      }}
      onDragStop={(_e, d) => {
        const raw = rawRef.current ?? { x: d.x, y: d.y };
        let nx = raw.x / scale;
        let ny = raw.y / scale;
        if (onSnap) {
          const s = onSnap({ x: nx, y: ny, width: a.width, height: a.height });
          nx = s.x;
          ny = s.y;
        }
        const patch: Partial<Annotation> = { x: nx, y: ny };
        if (a.points) patch.points = translatePoints(a.points, nx - a.x, ny - a.y);
        onChange(patch);
        rawRef.current = null;
        setDragPos(null);
        onSnapEnd?.();
      }}
      onResizeStart={onCommit}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        onChange({
          width: ref.offsetWidth / scale,
          height: ref.offsetHeight / scale,
          x: pos.x / scale,
          y: pos.y / scale,
        });
      }}
      style={{ opacity: a.opacity, zIndex: 5, pointerEvents: "auto" }}
      className="group"
      resizeHandleStyles={resizable ? HANDLE_STYLES : undefined}
    >
      <div
        data-annotation
        className="ring-signal relative size-full ring-2"
        onDoubleClick={a.type === "text" ? () => onStartEdit() : undefined}
      >
        {visual}
      </div>
    </Rnd>
  );
}

const dot: React.CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: 9,
  background: "var(--signal)",
  border: "1.5px solid white",
  boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
};
const HANDLE_STYLES = {
  topLeft: dot,
  topRight: dot,
  bottomLeft: dot,
  bottomRight: dot,
};

/* ------------------------------- visuals -------------------------------- */

function AnnotationVisual({
  a,
  scale,
  editing,
  onChange,
  onEndEdit,
}: {
  a: Annotation;
  scale: number;
  editing: boolean;
  onChange: (patch: Partial<Annotation>) => void;
  onEndEdit: () => void;
}) {
  switch (a.type) {
    case "text":
      return a.reflow ? (
        <ReflowBlock a={a} scale={scale} editing={editing} onChange={onChange} onEndEdit={onEndEdit} />
      ) : (
        <TextVisual a={a} scale={scale} editing={editing} onChange={onChange} onEndEdit={onEndEdit} />
      );
    case "draw":
      return <PathVisual a={a} scale={scale} />;
    case "line":
    case "arrow":
      return <LineVisual a={a} scale={scale} />;
    case "rect":
      return (
        <div
          className="size-full"
          style={{
            border: `${(a.strokeWidth ?? 2) * scale}px solid ${a.color}`,
            background: a.fill ?? "transparent",
          }}
        />
      );
    case "ellipse":
      return (
        <div
          className="size-full rounded-full"
          style={{
            border: `${(a.strokeWidth ?? 2) * scale}px solid ${a.color}`,
            background: a.fill ?? "transparent",
          }}
        />
      );
    case "highlight":
      return (
        <div
          className="size-full"
          style={{ background: a.color, mixBlendMode: "multiply" }}
        />
      );
    case "note":
      return <NoteVisual a={a} />;
    case "stamp":
      return <StampVisual a={a} scale={scale} />;
    case "image":
      return a.imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={a.imageSrc}
          alt=""
          className="size-full object-contain"
          draggable={false}
        />
      ) : null;
    default:
      return null;
  }
}

// Reused offscreen canvas for measuring inline-edit text width.
let measureCanvas: HTMLCanvasElement | null = null;

/** Width (points) of the widest line of `text` in the annotation's font. */
function measureInlineWidthPt(text: string, a: Annotation, scale: number): number {
  if (scale <= 0) return a.width;
  measureCanvas ??= document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  if (!ctx) return a.width;
  const px = (a.fontSize ?? 16) * scale;
  ctx.font = `${a.italic ? "italic " : ""}${a.bold ? "700" : "400"} ${px}px ${a.fontFamily ?? "sans-serif"}`;
  let max = 0;
  for (const line of text.split("\n")) max = Math.max(max, ctx.measureText(line).width);
  return max / scale;
}

function TextVisual({
  a,
  scale,
  editing,
  onChange,
  onEndEdit,
}: {
  a: Annotation;
  scale: number;
  editing: boolean;
  onChange: (patch: Partial<Annotation>) => void;
  onEndEdit: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!editing) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    // Select existing text so a double-click-to-edit can be replaced by typing.
    if (el.value) el.select();
  }, [editing]);

  const style: React.CSSProperties = {
    fontSize: (a.fontSize ?? 16) * scale,
    color: a.color,
    fontFamily: a.fontFamily ?? "Helvetica, Arial, sans-serif",
    fontWeight: a.bold ? 700 : 400,
    fontStyle: a.italic ? "italic" : "normal",
    textDecoration: a.underline ? "underline" : "none",
    textAlign: a.align ?? "left",
    lineHeight: 1.25,
    // Inline edits use ~no padding so replacement text aligns with the original;
    // free-floating text boxes keep a small inset.
    padding: (a.coverColor ? 0 : 2) * scale,
    // Opaque cover hides the original PDF glyphs beneath an inline edit.
    backgroundColor: a.coverColor,
  };

  // Inline edits stay on one line (matching the original run) and may extend
  // past the box; free text boxes wrap and clip to their bounds.
  const inline = !!a.coverColor;

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={a.text ?? ""}
        wrap={inline ? "off" : "soft"}
        onChange={(e) => {
          const text = e.target.value;
          // Grow inline edits to fit (never below the original cover width), so
          // longer replacements stay fully visible while typing.
          if (inline) {
            const needed = measureInlineWidthPt(text, a, scale) + 8;
            onChange(needed > a.width ? { text, width: needed } : { text });
          } else {
            onChange({ text });
          }
        }}
        onBlur={onEndEdit}
        onKeyDown={(e) => {
          if (e.key === "Escape") onEndEdit();
          e.stopPropagation();
        }}
        className="size-full resize-none border-none bg-transparent whitespace-nowrap outline-none"
        style={style}
        placeholder="Type…"
      />
    );
  }

  return (
    <div
      className={
        inline
          ? "size-full whitespace-nowrap"
          : "size-full overflow-hidden break-words whitespace-pre-wrap"
      }
      style={style}
    >
      {a.text || <span className="opacity-40">Text</span>}
    </div>
  );
}

function PathVisual({ a, scale }: { a: Annotation; scale: number }) {
  const points = a.points ?? [];
  if (points.length < 2) return null;
  const d = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${(p.x - a.x) * scale} ${(p.y - a.y) * scale}`,
    )
    .join(" ");
  return (
    <svg className="pointer-events-none size-full overflow-visible">
      <path
        d={d}
        fill="none"
        stroke={a.color}
        strokeWidth={(a.strokeWidth ?? 2) * scale}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LineVisual({ a, scale }: { a: Annotation; scale: number }) {
  const points = a.points ?? [];
  if (points.length < 2) return null;
  const [p1, p2] = points;
  const x1 = (p1.x - a.x) * scale;
  const y1 = (p1.y - a.y) * scale;
  const x2 = (p2.x - a.x) * scale;
  const y2 = (p2.y - a.y) * scale;
  const sw = (a.strokeWidth ?? 2) * scale;

  let head = null;
  if (a.type === "arrow") {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.max(8 * scale, sw * 3);
    const a1 = angle - Math.PI / 6;
    const a2 = angle + Math.PI / 6;
    head = (
      <path
        d={`M ${x2} ${y2} L ${x2 - len * Math.cos(a1)} ${y2 - len * Math.sin(a1)} M ${x2} ${y2} L ${x2 - len * Math.cos(a2)} ${y2 - len * Math.sin(a2)}`}
        stroke={a.color}
        strokeWidth={sw}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  return (
    <svg className="pointer-events-none size-full overflow-visible">
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={a.color}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {head}
    </svg>
  );
}

function NoteVisual({ a }: { a: Annotation }) {
  return (
    <div
      className="grid size-full place-items-center rounded-md rounded-tl-none shadow-md"
      style={{ background: a.color }}
      title={a.text || "Note"}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-1/2 text-black/70"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
      >
        <path d="M7 8h10M7 12h6" />
      </svg>
    </div>
  );
}

function StampVisual({ a, scale }: { a: Annotation; scale: number }) {
  const preset = STAMP_PRESETS.find((p) => p.id === a.stampVariant);
  const label = preset?.label ?? a.stampVariant ?? "STAMP";
  const color = a.color ?? preset?.color ?? "#22A06B";
  return (
    <div
      className="grid size-full place-items-center rounded-md border-[3px] font-bold tracking-[0.15em] uppercase"
      style={{
        borderColor: color,
        color,
        fontSize: Math.max(a.height * scale * 0.34, 8),
        fontFamily: "var(--font-mono), monospace",
      }}
    >
      {label}
    </div>
  );
}
