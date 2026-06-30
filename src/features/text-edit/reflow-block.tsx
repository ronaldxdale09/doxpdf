"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getReflowFontBytes } from "@/lib/pdf/reflow/fonts";
import { layoutParagraph, type Align } from "@/lib/pdf/reflow/layout";
import { createMeasurer, type Measurer } from "@/lib/pdf/reflow/measure";
import type { Annotation } from "@/types/annotations";

// Measurers are keyed by font + size; built once and reused across edits.
const measurerCache = new Map<string, Measurer>();

interface ReflowBlockProps {
  a: Annotation;
  scale: number; // px per point
  editing: boolean;
  onChange: (patch: Partial<Annotation>) => void;
  onEndEdit: () => void;
}

/**
 * A reflowable paragraph: self-rendered wrapped words (laid out by our shared
 * engine, so they match the export exactly) with a transparent <textarea> on top
 * for caret / selection / IME. See `docs/reflow-text-editing.md`.
 */
export function ReflowBlock({ a, scale, editing, onChange, onEndEdit }: ReflowBlockProps) {
  const fontSize = a.fontSize ?? 12;
  const lineHeight = a.lineHeight ?? fontSize * 1.2;
  const align: Align = (a.align as Align) ?? "left";
  const cacheKey = `${a.reflowFontId}:${fontSize}`;

  const ref = useRef<HTMLTextAreaElement>(null);
  const [measurer, setMeasurer] = useState<Measurer | null>(
    () => measurerCache.get(cacheKey) ?? null,
  );

  // Build the fontkit measurer (async — fontkit is lazy-loaded).
  useEffect(() => {
    if (!a.reflowFontId || measurerCache.has(cacheKey)) return;
    const bytes = getReflowFontBytes(a.reflowFontId);
    if (!bytes) return;
    let active = true;
    createMeasurer(bytes, fontSize).then((m) => {
      measurerCache.set(cacheKey, m);
      if (active) setMeasurer(m);
    });
    return () => {
      active = false;
    };
  }, [a.reflowFontId, fontSize, cacheKey]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const layout = useMemo(
    () => (measurer ? layoutParagraph(a.text ?? "", measurer.measure, a.width, align) : null),
    [measurer, a.text, a.width, align],
  );

  const px = (v: number) => v * scale;

  // Keep the block height in sync with the wrapped line count (grows downward).
  const handleInput = (text: string) => {
    const patch: Partial<Annotation> = { text };
    if (measurer) {
      const lo = layoutParagraph(text, measurer.measure, a.width, align);
      patch.height = lo.lineCount * lineHeight + fontSize * 0.3;
    }
    onChange(patch);
  };

  return (
    <div className="relative size-full" style={{ backgroundColor: a.coverColor }}>
      {layout ? (
        layout.placements.map((p, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: px(p.x),
              top: px(p.line * lineHeight),
              fontSize: px(fontSize),
              lineHeight: 1,
              fontFamily: a.fontFamily,
              color: a.color,
              whiteSpace: "pre",
            }}
          >
            {p.word}
          </span>
        ))
      ) : (
        // Fallback while the measurer loads — plain wrapped text.
        <div
          className="size-full whitespace-pre-wrap"
          style={{
            fontSize: px(fontSize),
            fontFamily: a.fontFamily,
            color: a.color,
            lineHeight: lineHeight / fontSize,
          }}
        >
          {a.text}
        </div>
      )}

      {editing && (
        <textarea
          ref={ref}
          value={a.text ?? ""}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={onEndEdit}
          onKeyDown={(e) => {
            if (e.key === "Escape") onEndEdit();
            e.stopPropagation();
          }}
          spellCheck={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            background: "transparent",
            color: "transparent",
            caretColor: a.color,
            border: "none",
            outline: "none",
            resize: "none",
            padding: 0,
            margin: 0,
            overflow: "hidden",
            fontSize: px(fontSize),
            fontFamily: a.fontFamily,
            lineHeight: `${px(lineHeight)}px`,
            textAlign: align === "justify" ? "left" : align,
          }}
        />
      )}
    </div>
  );
}
