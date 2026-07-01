"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowUpRight,
  Bold,
  ChevronDown,
  Circle,
  Copy,
  Italic,
  Minus,
  Pen,
  PenLine,
  Slash,
  Square,
  Trash2,
  Underline,
} from "lucide-react";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  ANNOTATION_COLORS,
  HIGHLIGHT_COLORS,
  STAMP_PRESETS,
} from "@/lib/annotations/defaults";
import {
  FONT_GROUPS,
  type FontOption,
  getFontOption,
} from "@/lib/fonts/catalog";
import { cn } from "@/lib/utils";
import { useAnnotationStore } from "@/store/annotation-store";
import { useEditorStore } from "@/store/editor-store";
import { useToolSettingsStore } from "@/store/tool-settings-store";
import type { Annotation, AnnotationType, DrawMode } from "@/types/annotations";
import type { EditorTool, ShapeKind } from "@/types/pdf";

function toolType(tool: EditorTool, shapeKind: ShapeKind): AnnotationType | null {
  if (tool === "shape") return shapeKind;
  if (["text", "draw", "highlight", "note", "stamp"].includes(tool)) {
    return tool as AnnotationType;
  }
  return null;
}

const HAS_STROKE = new Set<AnnotationType>([
  "draw",
  "rect",
  "ellipse",
  "line",
  "arrow",
]);

export function PropertiesBar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const settings = useToolSettingsStore();
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const annotations = useAnnotationStore((s) => s.annotations);
  const update = useAnnotationStore((s) => s.update);
  const commit = useAnnotationStore((s) => s.commit);
  const remove = useAnnotationStore((s) => s.remove);
  const duplicate = useAnnotationStore((s) => s.duplicate);

  const target = selectedId
    ? (annotations.find((a) => a.id === selectedId) ?? null)
    : null;
  const type = target?.type ?? toolType(activeTool, settings.shapeKind);
  if (!type) return null;

  const isHi =
    type === "highlight" ||
    (type === "draw" && (target?.drawMode ?? settings.drawMode) === "highlighter");
  const palette = isHi ? HIGHLIGHT_COLORS : ANNOTATION_COLORS;
  const color = target?.color ?? (isHi ? settings.highlightColor : settings.color);
  const opacity = target?.opacity ?? settings.opacity;
  const strokeWidth = target?.strokeWidth ?? settings.strokeWidth;
  const fontSize = target?.fontSize ?? settings.fontSize;

  const setColor = (c: string) => {
    if (target) {
      commit();
      update(target.id, { color: c });
    } else if (isHi) settings.setHighlightColor(c);
    else settings.setColor(c);
  };
  const setOpacity = (o: number) => {
    if (target) update(target.id, { opacity: o });
    else settings.setOpacity(o);
  };
  const setStroke = (w: number) => {
    if (target) update(target.id, { strokeWidth: w });
    else settings.setStrokeWidth(w);
  };
  const setFontSize = (s: number) => {
    if (target) {
      commit();
      update(target.id, { fontSize: s });
    } else settings.setFontSize(s);
  };
  const toggle = (key: keyof Annotation) => {
    if (!target) return;
    commit();
    update(target.id, { [key]: !target[key] });
  };

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 absolute top-3 left-1/2 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 flex-wrap items-center gap-1 rounded-full border p-1 shadow-lg backdrop-blur">
      {/* Color */}
      {type !== "image" && (
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                aria-label="Color"
                className="hover:bg-accent flex items-center gap-1.5 rounded-full px-2 py-1.5"
              />
            }
          >
            <span
              className="size-4 rounded-full ring-1 ring-black/15"
              style={{ background: color }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-4 gap-1.5">
              {palette.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full ring-1 ring-black/10 transition hover:scale-110",
                    color === c && "ring-foreground ring-2",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Draw mode */}
      {type === "draw" && !target && (
        <Segmented
          value={settings.drawMode}
          onChange={(m) => settings.setDrawMode(m as DrawMode)}
          options={[
            { value: "pen", icon: Pen, label: "Pen" },
            { value: "marker", icon: PenLine, label: "Marker" },
            { value: "highlighter", icon: Minus, label: "Highlighter" },
          ]}
        />
      )}

      {/* Shape kind */}
      {activeTool === "shape" && !target && (
        <Segmented
          value={settings.shapeKind}
          onChange={(k) => settings.setShapeKind(k as ShapeKind)}
          options={[
            { value: "rect", icon: Square, label: "Rectangle" },
            { value: "ellipse", icon: Circle, label: "Ellipse" },
            { value: "line", icon: Slash, label: "Line" },
            { value: "arrow", icon: ArrowUpRight, label: "Arrow" },
          ]}
        />
      )}

      {/* Stroke width */}
      {HAS_STROKE.has(type) && (
        <RangePopover
          label="Stroke"
          value={strokeWidth}
          min={1}
          max={40}
          step={1}
          onChange={setStroke}
          display={`${Math.round(strokeWidth)}`}
        />
      )}

      {/* Text controls */}
      {type === "text" && (
        <>
          {/* Font face — hidden for reflow paragraphs, whose font follows the
              source text and is embedded on export. */}
          {!target?.reflow && (
            <>
              <FontFacePicker
                value={target?.fontId ?? settings.fontId}
                onChange={(face) => {
                  if (target) {
                    commit();
                    update(target.id, {
                      fontId: face.id,
                      fontFamily: face.cssFamily,
                      fontCategory: face.category,
                    });
                  } else settings.setFontFace(face);
                }}
              />
              <span className="bg-border mx-0.5 h-5 w-px" />
            </>
          )}
          <div className="flex items-center">
            <IconToggle
              active={!!target?.bold}
              onClick={() => toggle("bold")}
              label="Bold"
              icon={Bold}
            />
            <IconToggle
              active={!!target?.italic}
              onClick={() => toggle("italic")}
              label="Italic"
              icon={Italic}
            />
            <IconToggle
              active={!!target?.underline}
              onClick={() => toggle("underline")}
              label="Underline"
              icon={Underline}
            />
            <IconToggle
              active={false}
              onClick={() => {
                if (!target) return;
                const order = ["left", "center", "right"] as const;
                const cur = order.indexOf(
                  (target.align ?? "left") as (typeof order)[number],
                );
                const next = order[(cur + 1) % 3];
                commit();
                update(target.id, { align: next });
              }}
              label="Align"
              icon={
                target?.align === "center"
                  ? AlignCenter
                  : target?.align === "right"
                    ? AlignRight
                    : AlignLeft
              }
            />
          </div>
          <div className="text-muted-foreground flex items-center gap-0.5 font-mono text-xs">
            <button
              type="button"
              className="hover:bg-accent rounded px-1"
              onClick={() => setFontSize(Math.max(6, fontSize - 2))}
            >
              −
            </button>
            <span className="w-6 text-center tabular-nums">
              {Math.round(fontSize)}
            </span>
            <button
              type="button"
              className="hover:bg-accent rounded px-1"
              onClick={() => setFontSize(Math.min(120, fontSize + 2))}
            >
              +
            </button>
          </div>
        </>
      )}

      {/* Stamp variant */}
      {type === "stamp" && (
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="hover:bg-accent rounded-full px-2.5 py-1.5 font-mono text-xs"
              />
            }
          >
            {(
              STAMP_PRESETS.find(
                (p) => p.id === (target?.stampVariant ?? settings.stampVariant),
              )?.label ?? "STAMP"
            )}
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1.5">
            <div className="grid gap-0.5">
              {STAMP_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (target) {
                      commit();
                      update(target.id, {
                        stampVariant: p.id,
                        color: p.color,
                      });
                    } else settings.setStampVariant(p.id);
                  }}
                  className="hover:bg-accent flex items-center justify-between rounded-md px-2 py-1.5 font-mono text-xs"
                  style={{ color: p.color }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Sticky-note text — authored here now that the side inspector is gone. */}
      {type === "note" && target && (
        <NotePopover
          value={target.text ?? ""}
          onFocus={commit}
          onChange={(text) => update(target.id, { text })}
        />
      )}

      {/* Opacity */}
      {type !== "text" && (
        <RangePopover
          label="Opacity"
          value={opacity}
          min={0.1}
          max={1}
          step={0.05}
          onChange={setOpacity}
          display={`${Math.round(opacity * 100)}%`}
        />
      )}

      {/* Selected actions */}
      {target && (
        <>
          <Separator orientation="vertical" className="mx-0.5 h-5" />
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            aria-label="Duplicate"
            onClick={() => duplicate(target.id)}
          >
            <Copy className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive size-8 rounded-full"
            aria-label="Delete"
            onClick={() => remove(target.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      )}
    </div>
  );
}

function NotePopover({
  value,
  onFocus,
  onChange,
}: {
  value: string;
  onFocus: () => void;
  onChange: (text: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Note text"
            className="hover:bg-accent rounded-full px-2.5 py-1.5 text-sm"
          />
        }
      >
        Note
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <textarea
          autoFocus
          value={value}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="Write a note…"
          className="border-input bg-background focus:ring-ring/50 w-full resize-none rounded-md border p-2 text-sm outline-none focus:ring-2"
        />
      </PopoverContent>
    </Popover>
  );
}

function FontFacePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (face: FontOption) => void;
}) {
  const [query, setQuery] = useState("");
  const current = getFontOption(value) ?? FONT_GROUPS[0].fonts[0];

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FONT_GROUPS;
    return FONT_GROUPS.map((g) => ({
      group: g.group,
      fonts: g.fonts.filter((f) => f.label.toLowerCase().includes(q)),
    })).filter((g) => g.fonts.length > 0);
  }, [query]);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Font"
            className="hover:bg-accent flex items-center gap-1.5 rounded-full py-1.5 pr-2 pl-2.5 text-sm"
          />
        }
      >
        <span
          className="max-w-[7rem] truncate"
          style={{ fontFamily: current.cssFamily }}
        >
          {current.label}
        </span>
        <ChevronDown className="size-3 shrink-0 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <div className="border-b p-1.5">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fonts…"
            className="bg-muted/50 focus:ring-ring/40 h-8 w-full rounded-md px-2.5 text-sm outline-none focus:ring-2"
          />
        </div>
        <div className="max-h-[19rem] overflow-y-auto p-1">
          {groups.length === 0 && (
            <div className="text-muted-foreground px-2 py-6 text-center text-sm">
              No fonts found
            </div>
          )}
          {groups.map((g) => (
            <div key={g.group} className="mb-1">
              <div className="text-muted-foreground px-2 pt-1.5 pb-1 font-mono text-[10px] tracking-[0.14em] uppercase">
                {g.group}
              </div>
              {g.fonts.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChange(f)}
                  className={cn(
                    "hover:bg-accent flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left",
                    current.id === f.id && "bg-accent",
                  )}
                  style={{ fontFamily: f.cssFamily }}
                >
                  <span className="truncate text-[15px]">{f.label}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    Ag
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; icon: React.ComponentType<{ className?: string }>; label: string }[];
}) {
  return (
    <div className="bg-muted flex items-center rounded-full p-0.5">
      {options.map((o) => {
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            aria-label={o.label}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "grid size-7 place-items-center rounded-full transition-colors",
              value === o.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}

function IconToggle({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-full transition-colors",
        active ? "bg-accent text-foreground" : "hover:bg-accent text-foreground/80",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

function RangePopover({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="hover:bg-accent text-muted-foreground rounded-full px-2.5 py-1.5 font-mono text-xs"
          />
        }
      >
        {label} {display}
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground font-mono text-xs">
            {label}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="accent-signal flex-1"
          />
          <span className="w-9 text-right font-mono text-xs tabular-nums">
            {display}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
