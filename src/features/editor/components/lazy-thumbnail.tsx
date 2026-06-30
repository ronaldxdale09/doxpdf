"use client";

import { Copy, RotateCw, Trash2, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Thumbnail } from "react-pdf";

import { cn } from "@/lib/utils";
import type { PageSlot } from "@/types/pdf";

interface LazyThumbnailProps {
  slot: PageSlot;
  position: number;
  active: boolean;
  width: number;
  canDelete: boolean;
  onSelect: () => void;
  onRotate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/** A windowed page thumbnail with hover actions for page operations. */
export function LazyThumbnail({
  slot,
  position,
  active,
  width,
  canDelete,
  onSelect,
  onRotate,
  onDuplicate,
  onDelete,
}: LazyThumbnailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = Math.round(width * 1.32);

  return (
    <div
      ref={ref}
      className="group/thumb flex flex-col items-center gap-1 py-1"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSelect();
        }}
        className={cn(
          "relative block cursor-pointer overflow-hidden rounded bg-white shadow-sm ring-1 transition outline-none",
          active
            ? "ring-signal ring-2"
            : "ring-black/10 hover:ring-signal/40",
        )}
        style={{ width, minHeight: height }}
      >
        {slot.src === 0 ? (
          <div
            className="grid place-items-center font-mono text-[10px] text-zinc-400"
            style={{ width, height }}
          >
            BLANK
          </div>
        ) : visible ? (
          <Thumbnail
            pageNumber={slot.src}
            width={width}
            rotate={slot.rotation}
            loading={<div style={{ height }} />}
          />
        ) : (
          <div style={{ height }} />
        )}

        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 transition group-hover/thumb:opacity-100">
          <ThumbAction icon={RotateCw} label="Rotate" onClick={onRotate} />
          <ThumbAction icon={Copy} label="Duplicate" onClick={onDuplicate} />
          {canDelete && (
            <ThumbAction
              icon={Trash2}
              label="Delete"
              onClick={onDelete}
              danger
            />
          )}
        </div>
      </div>
      <span
        className={cn(
          "font-mono text-[11px] tabular-nums",
          active ? "text-signal font-semibold" : "text-muted-foreground",
        )}
      >
        {position}
      </span>
    </div>
  );
}

function ThumbAction({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "grid size-6 place-items-center rounded-md bg-zinc-900/85 text-white backdrop-blur transition hover:bg-zinc-900",
        danger && "hover:bg-red-600",
      )}
    >
      <Icon className="size-3" />
    </button>
  );
}
