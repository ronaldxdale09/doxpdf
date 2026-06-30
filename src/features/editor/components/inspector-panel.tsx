"use client";

import {
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { translatePoints } from "@/lib/annotations/geometry";
import { cn } from "@/lib/utils";
import { useAnnotationStore } from "@/store/annotation-store";
import type { Annotation } from "@/types/annotations";

const TYPE_LABEL: Record<Annotation["type"], string> = {
  text: "Text",
  draw: "Drawing",
  rect: "Rectangle",
  ellipse: "Ellipse",
  line: "Line",
  arrow: "Arrow",
  highlight: "Highlight",
  note: "Sticky note",
  stamp: "Stamp",
  image: "Image",
};

const RESIZABLE = new Set<Annotation["type"]>([
  "text",
  "rect",
  "ellipse",
  "highlight",
  "stamp",
  "image",
]);

/**
 * Right-side inspector for the selected annotation. Complements the top style
 * pill with structure: z-order arrangement, precise geometry, and actions.
 */
export function InspectorPanel() {
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const annotation = useAnnotationStore((s) =>
    s.selectedId ? (s.annotations.find((x) => x.id === s.selectedId) ?? null) : null,
  );
  const open = !!annotation;

  return (
    <aside
      className={cn(
        "bg-sidebar hidden h-full shrink-0 overflow-hidden border-l transition-[width] duration-200 md:flex md:flex-col",
        open ? "w-[252px]" : "w-0 border-l-0",
      )}
      aria-hidden={!open}
    >
      <div className="flex h-full w-[252px] flex-col">
        {annotation && <Body key={selectedId} a={annotation} />}
      </div>
    </aside>
  );
}

function Body({ a }: { a: Annotation }) {
  const reorder = useAnnotationStore((s) => s.reorder);
  const duplicate = useAnnotationStore((s) => s.duplicate);
  const remove = useAnnotationStore((s) => s.remove);
  const update = useAnnotationStore((s) => s.update);
  const commit = useAnnotationStore((s) => s.commit);

  const resizable = RESIZABLE.has(a.type);

  const setPos = (axis: "x" | "y", value: number) => {
    commit();
    const delta = value - a[axis];
    const patch: Partial<Annotation> = { [axis]: value };
    if (a.points) {
      patch.points = translatePoints(
        a.points,
        axis === "x" ? delta : 0,
        axis === "y" ? delta : 0,
      );
    }
    update(a.id, patch);
  };
  const setSize = (key: "width" | "height", value: number) => {
    commit();
    update(a.id, { [key]: Math.max(4, value) });
  };

  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4 text-sm font-medium">
        {TYPE_LABEL[a.type]}
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {/* Arrange */}
        <Section title="Arrange">
          <div className="grid grid-cols-4 gap-1.5">
            <ArrangeButton label="To front" onClick={() => reorder(a.id, "front")}>
              <ChevronsUp className="size-4" />
            </ArrangeButton>
            <ArrangeButton label="Forward" onClick={() => reorder(a.id, "forward")}>
              <ChevronUp className="size-4" />
            </ArrangeButton>
            <ArrangeButton label="Backward" onClick={() => reorder(a.id, "backward")}>
              <ChevronDown className="size-4" />
            </ArrangeButton>
            <ArrangeButton label="To back" onClick={() => reorder(a.id, "back")}>
              <ChevronsDown className="size-4" />
            </ArrangeButton>
          </div>
        </Section>

        {/* Geometry */}
        <Section title="Position">
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="X" value={a.x} onChange={(v) => setPos("x", v)} />
            <NumberField label="Y" value={a.y} onChange={(v) => setPos("y", v)} />
          </div>
        </Section>
        <Section title="Size">
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="W"
              value={a.width}
              onChange={(v) => setSize("width", v)}
              disabled={!resizable}
            />
            <NumberField
              label="H"
              value={a.height}
              onChange={(v) => setSize("height", v)}
              disabled={!resizable}
            />
          </div>
        </Section>
      </div>

      <div className="flex shrink-0 gap-2 border-t p-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => duplicate(a.id)}
        >
          <Copy className="size-4" />
          Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive flex-1"
          onClick={() => remove(a.id)}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground mb-2 font-mono text-[10px] tracking-[0.12em] uppercase">
        {title}
      </div>
      {children}
    </div>
  );
}

function ArrangeButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="border-border hover:border-signal hover:bg-accent grid h-9 place-items-center rounded-md border transition-colors"
    >
      {children}
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "border-input bg-background flex items-center rounded-md border pl-2 text-sm focus-within:ring-2 focus-within:ring-ring/50",
        disabled && "opacity-50",
      )}
    >
      <span className="text-muted-foreground w-3 font-mono text-xs">{label}</span>
      <input
        type="number"
        disabled={disabled}
        value={Math.round(value)}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v)) onChange(v);
        }}
        className="h-8 w-full bg-transparent px-2 text-right tabular-nums outline-none"
      />
    </label>
  );
}
