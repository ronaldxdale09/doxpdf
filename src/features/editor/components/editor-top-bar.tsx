"use client";

import {
  ChevronDown,
  Download,
  FileText,
  FileType,
  Image as ImageIcon,
  Info,
  Keyboard,
  Loader2,
  PanelLeft,
  Redo2,
  Search,
  Share2,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Brand } from "@/components/brand";
import { DocumentPropertiesDialog } from "./document-properties-dialog";
import { FormsDialog } from "./forms-dialog";
import { ShareDialog } from "./share-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { buildPdfBytes, exportPdf } from "@/lib/pdf/export";
import {
  exportImages,
  exportMarkdown,
  exportText,
} from "@/lib/pdf/export-formats";
import { getBaseName } from "@/lib/pdf/file";
import { useAnnotationStore } from "@/store/annotation-store";
import { useDocumentStore } from "@/store/document-store";
import { useEditorStore } from "@/store/editor-store";
import { useSearchStore } from "@/store/search-store";

type ExportFormat = "pdf" | "png" | "jpeg" | "txt" | "md";

/** The editor's top app bar: navigation, file info, and primary actions. */
export function EditorTopBar() {
  const file = useDocumentStore((s) => s.file);
  const numPages = useDocumentStore((s) => s.numPages);
  const toggleSidebar = useDocumentStore((s) => s.toggleSidebar);
  const undo = useAnnotationStore((s) => s.undo);
  const redo = useAnnotationStore((s) => s.redo);
  const canUndo = useAnnotationStore((s) => s.past.length > 0);
  const canRedo = useAnnotationStore((s) => s.future.length > 0);
  const [exporting, setExporting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const [formsOpen, setFormsOpen] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (!file) return;
    try {
      setExporting(true);
      const doc = useDocumentStore.getState();
      const annotations = useAnnotationStore.getState().annotations;
      const base = getBaseName(file.name);

      if (format === "pdf") {
        await exportPdf(file, {
          pages: doc.pages,
          annotations,
          defaultSize: doc.defaultPageSize,
          metadata: doc.metadata,
          formValues: doc.formValues,
        });
      } else {
        const bytes = await buildPdfBytes(
          file,
          doc.pages,
          annotations,
          doc.defaultPageSize,
          doc.metadata,
          doc.formValues,
        );
        if (format === "png" || format === "jpeg") {
          await exportImages(bytes, base, format);
        } else if (format === "txt") {
          await exportText(bytes, base);
        } else {
          await exportMarkdown(bytes, base);
        }
      }
      toast.success("Your download is ready.");
    } catch (error) {
      console.error("[DoxPDF] export failed", error);
      toast.error("Sorry — we couldn't export that.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
    <header className="bg-background z-20 flex h-14 shrink-0 items-center gap-1 border-b px-2 sm:gap-2 sm:px-3">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label="Toggle page thumbnails"
            />
          }
        >
          <PanelLeft className="size-[1.15rem]" />
        </TooltipTrigger>
        <TooltipContent>Toggle pages</TooltipContent>
      </Tooltip>

      <Brand showWordmark={false} />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={file?.name}>
          {file?.name ?? "Untitled.pdf"}
        </p>
        {numPages > 0 && (
          <p className="text-muted-foreground font-mono text-[11px] tracking-wide">
            {numPages} page{numPages > 1 ? "s" : ""} · local
          </p>
        )}
      </div>

      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={undo}
        >
          <Undo2 className="size-[1.15rem]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={redo}
        >
          <Redo2 className="size-[1.15rem]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Find"
          onClick={() => useSearchStore.getState().setOpen(true)}
        >
          <Search className="size-[1.1rem]" />
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Keyboard shortcuts"
                onClick={() => useEditorStore.getState().setShortcutsOpen(true)}
              />
            }
          >
            <Keyboard className="size-[1.15rem]" />
          </TooltipTrigger>
          <TooltipContent>
            Shortcuts <span className="text-muted-foreground">·</span> ?
          </TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="ghost"
        size="sm"
        className="hidden sm:inline-flex"
        onClick={() => setShareOpen(true)}
        disabled={!file}
      >
        <Share2 className="size-4" />
        Share
      </Button>

      <div className="flex items-center">
        <Button
          onClick={() => handleExport("pdf")}
          disabled={!file || exporting}
          size="sm"
          className="rounded-r-none"
        >
          {exporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Download
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="sm"
                disabled={!file || exporting}
                aria-label="Export format"
                className="border-primary-foreground/20 rounded-l-none border-l px-1.5"
              />
            }
          >
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              <Download className="size-4" />
              PDF document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("png")}>
              <ImageIcon className="size-4" />
              Images (PNG)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("jpeg")}>
              <ImageIcon className="size-4" />
              Images (JPEG)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("txt")}>
              <FileText className="size-4" />
              Text (.txt)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("md")}>
              <FileType className="size-4" />
              Markdown (.md)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFormsOpen(true)}>
              <FileText className="size-4" />
              Fill form…
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPropsOpen(true)}>
              <Info className="size-4" />
              Document properties…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ThemeToggle />
    </header>
    <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
    <DocumentPropertiesDialog
      open={propsOpen}
      onClose={() => setPropsOpen(false)}
    />
    <FormsDialog open={formsOpen} onClose={() => setFormsOpen(false)} />
    </>
  );
}
