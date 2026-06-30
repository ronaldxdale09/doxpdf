"use client";

import { useCallback, useRef, useState } from "react";

import { MAX_FILE_SIZE, formatFileSize } from "@/lib/constants";
import { isPdfFile } from "@/lib/pdf/file";

export interface UsePdfDropzoneOptions {
  onFile: (file: File) => void;
  onError?: (message: string) => void;
}

/**
 * Headless drag-and-drop + file-picker logic for PDFs. Returns props to spread
 * onto a drop target and a hidden <input>, plus the live drag state.
 *
 * Uses a drag counter so nested children don't cause the highlight to flicker.
 */
export function usePdfDropzone({ onFile, onError }: UsePdfDropzoneOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      if (!isPdfFile(file)) {
        onError?.("That doesn't look like a PDF. Please choose a .pdf file.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        onError?.(
          `That file is ${formatFileSize(file.size)} — the limit is ${formatFileSize(MAX_FILE_SIZE)}.`,
        );
        return;
      }
      onFile(file);
    },
    [onFile, onError],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current = 0;
      setIsDragging(false);
      validateAndEmit(e.dataTransfer.files?.[0]);
    },
    [validateAndEmit],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      validateAndEmit(e.target.files?.[0]);
      // Reset so selecting the same file again re-fires change.
      e.target.value = "";
    },
    [validateAndEmit],
  );

  const openFilePicker = useCallback(() => inputRef.current?.click(), []);

  return {
    isDragging,
    inputRef,
    openFilePicker,
    /** Spread onto the drop target element. */
    dropzoneProps: { onDrop, onDragOver, onDragEnter, onDragLeave },
    /** Spread onto a hidden file <input>. */
    inputProps: {
      ref: inputRef,
      type: "file" as const,
      accept: "application/pdf,.pdf",
      onChange: onInputChange,
      hidden: true,
    },
  };
}
