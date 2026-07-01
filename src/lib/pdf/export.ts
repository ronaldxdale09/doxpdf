/**
 * PDF export pipeline (pdf-lib): assemble the output document from the current
 * page slots (order, rotation, blanks, duplicates), bake annotations onto each
 * page, stamp DoxPDF metadata, and serialize.
 */
import { PDFDocument, type PDFFont, degrees } from "pdf-lib";

import { rotateAnnotationGeometry } from "@/lib/annotations/geometry";
import { APP_NAME } from "@/lib/constants";
import type { Annotation } from "@/types/annotations";
import type { PageSize, PageSlot, PdfMetadata } from "@/types/pdf";

import { getFontOption, loadCatalogFontBytes } from "@/lib/fonts/catalog";

import { drawAnnotation, embedFonts } from "./bake";
import { downloadBytes, fileToBytes, getBaseName } from "./file";
import { fontKey, loadEmbeddableFont } from "./fonts/embeddable";
import { applyFormValues, type FormValues } from "./forms";
import { applyRedactions, type RedactRegion } from "./redact";
import { getReflowFontBytes } from "./reflow/fonts";

/**
 * Embed the custom faces a bake needs, keyed for `drawAnnotation`:
 *  - inline edits → metric-compatible Liberation Sans, keyed by `fontKey`
 *  - reflow paragraphs → their exact resolved bytes, keyed by `reflowFontId`
 * Returns an empty map when nothing needs one (so the common export never even
 * loads fontkit).
 */
async function buildCustomFonts(
  doc: PDFDocument,
  annotations: Annotation[],
): Promise<Map<string, PDFFont>> {
  const map = new Map<string, PDFFont>();
  const combos = new Map<string, { bold: boolean; italic: boolean; category: Annotation["fontCategory"] }>();
  const reflowIds = new Set<string>();
  const catalogIds = new Set<string>();
  for (const a of annotations) {
    if (a.type !== "text") continue;
    // A bundled font chosen from the picker (free text, or a re-fonted edit).
    if (a.fontId && getFontOption(a.fontId)?.file) catalogIds.add(a.fontId);
    if (!a.coverColor) continue; // the rest applies to inline edits only
    if (a.reflow) {
      if (a.reflowFontId) reflowIds.add(a.reflowFontId);
      continue;
    }
    const key = fontKey(a.fontCategory, !!a.bold, !!a.italic);
    if (!combos.has(key))
      combos.set(key, { bold: !!a.bold, italic: !!a.italic, category: a.fontCategory });
  }
  if (combos.size === 0 && reflowIds.size === 0 && catalogIds.size === 0)
    return map;

  let registered = false;
  const ensureFontkit = async () => {
    if (registered) return;
    const mod = await import("@pdf-lib/fontkit");
    doc.registerFontkit((mod.default ?? mod) as Parameters<PDFDocument["registerFontkit"]>[0]);
    registered = true;
  };

  for (const [key, c] of combos) {
    const bytes = await loadEmbeddableFont(c.category, c.bold, c.italic);
    if (!bytes) continue; // serif/mono or unavailable → base-14 in bake
    await ensureFontkit();
    try {
      map.set(key, await doc.embedFont(bytes, { subset: true }));
    } catch {
      // Embedding failed — bake falls back to base-14.
    }
  }

  for (const id of reflowIds) {
    const bytes = getReflowFontBytes(id);
    if (!bytes) continue;
    await ensureFontkit();
    try {
      map.set(id, await doc.embedFont(bytes, { subset: true }));
    } catch {
      // Embedding failed — that reflow block falls back to a plain draw.
    }
  }

  for (const id of catalogIds) {
    const bytes = await loadCatalogFontBytes(id);
    if (!bytes) continue;
    await ensureFontkit();
    try {
      map.set(id, await doc.embedFont(bytes, { subset: true }));
    } catch {
      // Embedding failed — that text falls back to a base-14 face in bake.
    }
  }
  return map;
}

const A4: PageSize = { width: 595.28, height: 841.89 };

export interface ExportPdfOptions {
  fileName?: string;
  pages?: PageSlot[];
  annotations?: Annotation[];
  defaultSize?: PageSize | null;
  metadata?: PdfMetadata | null;
  formValues?: FormValues;
}

/** True when the page list is the untouched 1:1 order (no page operations). */
function isDefaultOrder(pages: PageSlot[], srcCount: number): boolean {
  return (
    pages.length === srcCount &&
    pages.every((p, i) => p.src === i + 1 && p.rotation === 0)
  );
}

/** Output page indices (0-based) that carry at least one redaction. */
export function redactedPageIndices(
  pages: PageSlot[],
  annotations: Annotation[],
): number[] {
  const idx: number[] = [];
  pages.forEach((slot, i) => {
    if (annotations.some((a) => a.type === "redaction" && a.pageId === slot.id))
      idx.push(i);
  });
  return idx;
}

/** Redaction regions per output page index, from the redaction annotations. */
function collectRedactions(
  slots: PageSlot[],
  annotations: Annotation[],
): Map<number, RedactRegion[]> {
  const map = new Map<number, RedactRegion[]>();
  slots.forEach((slot, i) => {
    const regs = annotations
      .filter((a) => a.type === "redaction" && a.pageId === slot.id)
      .map((a) => ({
        x: a.x,
        y: a.y,
        width: a.width,
        height: a.height,
        color: a.color,
      }));
    if (regs.length) map.set(i, regs);
  });
  return map;
}

/**
 * Stamp metadata and serialize. If any pages carry redactions, rebuild them as
 * rasterized images first so the removed content genuinely can't be recovered.
 */
async function finalize(
  doc: PDFDocument,
  regionsByPage: Map<number, RedactRegion[]>,
  metadata: PdfMetadata | null,
): Promise<Uint8Array> {
  applyMetadata(doc, metadata);
  if (regionsByPage.size === 0) return doc.save({ useObjectStreams: true });
  const bytes = await doc.save({ useObjectStreams: true });
  const redacted = await applyRedactions(bytes, regionsByPage);
  applyMetadata(redacted, metadata);
  return redacted.save({ useObjectStreams: true });
}

function applyMetadata(out: PDFDocument, metadata: PdfMetadata | null) {
  if (metadata) {
    if (metadata.title) out.setTitle(metadata.title);
    if (metadata.author) out.setAuthor(metadata.author);
    if (metadata.subject) out.setSubject(metadata.subject);
    if (metadata.keywords)
      out.setKeywords(metadata.keywords.split(/[,;]\s*/).filter(Boolean));
    if (metadata.creator) out.setCreator(metadata.creator);
  }
  out.setProducer(APP_NAME);
  if (!metadata?.creator) out.setCreator(APP_NAME);
  out.setModificationDate(new Date());
}

/** Assemble + bake the output document and return its bytes. */
export async function buildPdfBytes(
  file: File,
  pages: PageSlot[],
  annotations: Annotation[] = [],
  defaultSize: PageSize | null = null,
  metadata: PdfMetadata | null = null,
  formValues: FormValues = {},
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(await fileToBytes(file), {
    ignoreEncryption: true,
  });
  const srcSizes = srcDoc.getPages().map((p) => p.getSize());

  // Filling AcroForm fields requires the original document (slot rebuild drops
  // the form). When there are no page operations, fill + bake in place.
  if (
    Object.keys(formValues).length > 0 &&
    isDefaultOrder(pages, srcDoc.getPageCount())
  ) {
    applyFormValues(srcDoc.getForm(), formValues);
    const inplaceFonts = await embedFonts(srcDoc);
    const inplaceCustom = await buildCustomFonts(srcDoc, annotations);
    const srcPages = srcDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = srcPages[i];
      for (const a of annotations) {
        if (a.pageId !== pages[i].id) continue;
        try {
          await drawAnnotation(srcDoc, page, a, inplaceFonts, inplaceCustom);
        } catch {
          // skip a bad annotation
        }
      }
    }
    return finalize(srcDoc, collectRedactions(pages, annotations), metadata);
  }

  // Page operations rebuild the document from copied pages, which drops the
  // AcroForm (and the values the user entered). Fill + flatten on the source
  // first so those values are baked into the page content and survive the copy.
  if (Object.keys(formValues).length > 0) {
    try {
      applyFormValues(srcDoc.getForm(), formValues);
      srcDoc.getForm().flatten();
    } catch (error) {
      console.error("[DoxPDF] could not preserve form values across page ops", error);
    }
  }

  const out = await PDFDocument.create();
  const fonts = await embedFonts(out);
  const customFonts = await buildCustomFonts(out, annotations);

  // Fall back to a single 1:1 slot list if none was provided.
  const slots: PageSlot[] =
    pages.length > 0
      ? pages
      : srcDoc.getPageIndices().map((i) => ({
          id: `p${i}`,
          src: i + 1,
          rotation: 0,
        }));

  for (const slot of slots) {
    let page;
    let srcW: number;
    let srcH: number;

    if (slot.src > 0) {
      const [copied] = await out.copyPages(srcDoc, [slot.src - 1]);
      page = out.addPage(copied);
      const s = srcSizes[slot.src - 1] ?? defaultSize ?? A4;
      srcW = s.width;
      srcH = s.height;
    } else {
      const s = defaultSize ?? A4;
      srcW = s.width;
      srcH = s.height;
      page = out.addPage([srcW, srcH]);
    }
    if (slot.rotation) page.setRotation(degrees(slot.rotation));

    for (const a of annotations) {
      if (a.pageId !== slot.id) continue;
      const based = slot.rotation
        ? { ...a, ...rotateAnnotationGeometry(a, slot.rotation, 0, srcW, srcH) }
        : a;
      try {
        await drawAnnotation(out, page, based, fonts, customFonts);
      } catch {
        // Skip a single bad annotation rather than failing the export.
      }
    }
  }

  return finalize(out, collectRedactions(slots, annotations), metadata);
}

/** Build the document and trigger a browser download. */
export async function exportPdf(
  file: File,
  options: ExportPdfOptions = {},
): Promise<void> {
  const out = await buildPdfBytes(
    file,
    options.pages ?? [],
    options.annotations ?? [],
    options.defaultSize ?? null,
    options.metadata ?? null,
    options.formValues ?? {},
  );
  const base = getBaseName(options.fileName ?? file.name);
  downloadBytes(out, `${base}.pdf`);
}
