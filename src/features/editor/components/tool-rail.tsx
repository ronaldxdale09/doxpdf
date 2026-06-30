"use client";

import {
  Hand,
  Highlighter,
  ImagePlus,
  MousePointer2,
  PenLine,
  Shapes,
  Signature,
  Stamp,
  StickyNote,
  Type,
  type LucideIcon,
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createAnnotation } from "@/lib/annotations/defaults";
import { displaySize } from "@/lib/annotations/geometry";
import { cn } from "@/lib/utils";
import { useAnnotationStore } from "@/store/annotation-store";
import { useDocumentStore } from "@/store/document-store";
import { useEditorStore } from "@/store/editor-store";
import { useSignatureStore } from "@/store/signature-store";
import type { EditorTool } from "@/types/pdf";

interface ToolDef {
  tool: EditorTool;
  icon: LucideIcon;
  label: string;
  available: boolean;
  shortcut?: string;
}

const GROUPS: ToolDef[][] = [
  [
    { tool: "select", icon: MousePointer2, label: "Select", available: true, shortcut: "V" },
    { tool: "hand", icon: Hand, label: "Hand · pan", available: true, shortcut: "H" },
  ],
  [
    { tool: "text", icon: Type, label: "Text", available: true, shortcut: "T" },
    { tool: "draw", icon: PenLine, label: "Draw", available: true, shortcut: "D" },
    { tool: "highlight", icon: Highlighter, label: "Highlight", available: true, shortcut: "E" },
    { tool: "shape", icon: Shapes, label: "Shapes", available: true, shortcut: "S" },
  ],
  [
    { tool: "note", icon: StickyNote, label: "Sticky note", available: true, shortcut: "N" },
    { tool: "stamp", icon: Stamp, label: "Stamp", available: true, shortcut: "K" },
    { tool: "image", icon: ImagePlus, label: "Image", available: true },
    { tool: "signature", icon: Signature, label: "Signature", available: true },
  ],
];

/** Vertical tool palette floating over the canvas. */
export function ToolRail() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const inputRef = useRef<HTMLInputElement>(null);

  const insertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const { currentPage, pages, pageSizes, defaultPageSize } =
          useDocumentStore.getState();
        const slot = pages[currentPage - 1];
        if (!slot) return;
        const srcSize =
          (slot.src > 0 ? pageSizes[slot.src] : null) ?? defaultPageSize;
        if (!srcSize) return;
        const size = displaySize(slot.rotation, srcSize.width, srcSize.height);
        const w = Math.min(size.width * 0.5, img.width * 0.75);
        const h = w * (img.height / img.width || 1);
        useAnnotationStore.getState().add(
          createAnnotation("image", slot.id, {
            x: (size.width - w) / 2,
            y: (size.height - h) / 2,
            width: w,
            height: h,
            imageSrc: src,
          }),
        );
        setActiveTool("select");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const openSignature = useSignatureStore((s) => s.openDialog);

  const onToolClick = (tool: EditorTool, available: boolean, label: string) => {
    if (!available) {
      toast(`${label} is coming soon`);
      return;
    }
    if (tool === "image") {
      inputRef.current?.click();
      return;
    }
    if (tool === "signature") {
      openSignature();
      return;
    }
    setActiveTool(tool);
  };

  return (
    <div className="bg-background/90 supports-[backdrop-filter]:bg-background/70 absolute top-1/2 left-3 z-20 flex -translate-y-1/2 flex-col gap-1 rounded-2xl border p-1 shadow-lg backdrop-blur">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) insertImage(file);
          e.target.value = "";
        }}
      />
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-1">
          {gi > 0 && <div className="bg-border mx-2 my-0.5 h-px" />}
          {group.map(({ tool, icon: Icon, label, available, shortcut }) => {
            const active = activeTool === tool;
            return (
              <Tooltip key={tool}>
                <TooltipTrigger
                  type="button"
                  aria-label={label}
                  aria-pressed={active}
                  onClick={() => onToolClick(tool, available, label)}
                  className={cn(
                    "grid size-9 place-items-center rounded-xl transition-all",
                    active
                      ? "bg-signal text-signal-foreground shadow-sm ring-1 ring-black/5"
                      : available
                        ? "hover:bg-accent text-foreground/80 hover:scale-105"
                        : "text-muted-foreground/40 hover:bg-accent/50",
                  )}
                >
                  <Icon className="size-[1.05rem]" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  {label}
                  {shortcut && <span className="ml-1.5 opacity-60">{shortcut}</span>}
                  {!available && " · soon"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
}
