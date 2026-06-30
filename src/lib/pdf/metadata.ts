import { PDFDocument } from "pdf-lib";

import type { PdfMetadata } from "@/types/pdf";

import { fileToBytes } from "./file";

/** Read the document's existing metadata. */
export async function readMetadata(file: File): Promise<PdfMetadata> {
  const doc = await PDFDocument.load(await fileToBytes(file), {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  return {
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    keywords: doc.getKeywords() ?? "",
    creator: doc.getCreator() ?? "",
  };
}
