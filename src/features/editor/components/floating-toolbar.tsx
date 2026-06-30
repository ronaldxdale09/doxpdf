"use client";

import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minus,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ZOOM_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/store/document-store";

/** Floating bottom control bar: page navigation and zoom. */
export function FloatingToolbar() {
  const numPages = useDocumentStore((s) => s.numPages);
  const currentPage = useDocumentStore((s) => s.currentPage);
  const zoom = useDocumentStore((s) => s.zoom);
  const fitMode = useDocumentStore((s) => s.fitMode);
  const goToPage = useDocumentStore((s) => s.goToPage);
  const zoomIn = useDocumentStore((s) => s.zoomIn);
  const zoomOut = useDocumentStore((s) => s.zoomOut);
  const setZoom = useDocumentStore((s) => s.setZoom);
  const setFitMode = useDocumentStore((s) => s.setFitMode);

  if (numPages === 0) return null;

  const zoomLabel =
    fitMode === "width"
      ? "Fit width"
      : fitMode === "page"
        ? "Fit page"
        : `${Math.round(zoom * 100)}%`;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <div className="bg-background/90 pointer-events-auto flex items-center gap-1 rounded-full border p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/70">
        {/* Page navigation */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          disabled={currentPage <= 1}
          onClick={() => goToPage(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <span className="text-muted-foreground min-w-[4.5rem] text-center text-xs tabular-nums">
          <span className="text-foreground font-semibold">{currentPage}</span>
          {" / "}
          {numPages}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          disabled={currentPage >= numPages}
          onClick={() => goToPage(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        {/* Zoom */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          onClick={zoomOut}
          aria-label="Zoom out"
        >
          <Minus className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 min-w-[5.5rem] rounded-full text-xs"
              />
            }
          >
            {zoomLabel}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-[8rem]">
            <DropdownMenuItem onClick={() => setFitMode("width")}>
              Fit width
              {fitMode === "width" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFitMode("page")}>
              Fit page
              {fitMode === "page" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {ZOOM_LEVELS.map((level) => (
              <DropdownMenuItem
                key={level}
                onClick={() => setZoom(level)}
                className={cn(
                  fitMode === "custom" &&
                    Math.abs(zoom - level) < 0.001 &&
                    "font-semibold",
                )}
              >
                {Math.round(level * 100)}%
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          onClick={zoomIn}
          aria-label="Zoom in"
        >
          <Plus className="size-4" />
        </Button>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => setFitMode("width")}
                aria-label="Fit to width"
              />
            }
          >
            <Maximize className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Fit to width</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
