/**
 * Bakes interactive annotations into a PDF using pdf-lib.
 *
 * Annotations are stored in **page points, top-left origin (y-down)**. PDF user
 * space is **bottom-left origin (y-up)**, so every y is flipped against the
 * page height here. Vector annotations stay vector; images are embedded.
 */
import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  StandardFonts,
  degrees,
  rgb,
} from "pdf-lib";

import { STAMP_PRESETS } from "@/lib/annotations/defaults";
import type { Annotation } from "@/types/annotations";

import { fontKey } from "./fonts/embeddable";
import { type Align, layoutParagraph } from "./reflow/layout";

interface Fonts {
  normal: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
  mono: PDFFont;
  monoBold: PDFFont;
  monoItalic: PDFFont;
  monoBoldItalic: PDFFont;
  serif: PDFFont;
  serifBold: PDFFont;
  serifItalic: PDFFont;
  serifBoldItalic: PDFFont;
}

/** Pick the closest standard-14 face for a classified font category + style. */
function pickFont(
  fonts: Fonts,
  category: "sans" | "serif" | "mono" | undefined,
  bold: boolean,
  italic: boolean,
): PDFFont {
  if (category === "serif") {
    return bold && italic
      ? fonts.serifBoldItalic
      : bold
        ? fonts.serifBold
        : italic
          ? fonts.serifItalic
          : fonts.serif;
  }
  if (category === "mono") {
    return bold && italic
      ? fonts.monoBoldItalic
      : bold
        ? fonts.monoBold
        : italic
          ? fonts.monoItalic
          : fonts.mono;
  }
  return bold && italic
    ? fonts.boldItalic
    : bold
      ? fonts.bold
      : italic
        ? fonts.italic
        : fonts.normal;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return rgb(
    Number.isNaN(r) ? 0 : r,
    Number.isNaN(g) ? 0 : g,
    Number.isNaN(b) ? 0 : b,
  );
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; isPng: boolean } {
  const [meta, b64] = dataUrl.split(",");
  const isPng = meta.includes("image/png");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, isPng };
}

/**
 * Embed the standard-14 font set used when baking annotations. These reference
 * the base-14 fonts by name (no glyph bytes embedded), so the full set is cheap
 * and lets inline edits match the original's serif/sans/mono category + style.
 */
export async function embedFonts(pdfDoc: PDFDocument): Promise<Fonts> {
  return {
    normal: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
    mono: await pdfDoc.embedFont(StandardFonts.Courier),
    monoBold: await pdfDoc.embedFont(StandardFonts.CourierBold),
    monoItalic: await pdfDoc.embedFont(StandardFonts.CourierOblique),
    monoBoldItalic: await pdfDoc.embedFont(StandardFonts.CourierBoldOblique),
    serif: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    serifBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    serifItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
    serifBoldItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
  };
}

/**
 * Draw a single annotation onto a page. The annotation's geometry must already
 * be in the page's **base** coordinate space (display→base rotation handled by
 * the caller).
 */
export async function drawAnnotation(
  pdfDoc: PDFDocument,
  page: PDFPage,
  a: Annotation,
  fonts: Fonts,
  /** Embedded metric-compatible fonts keyed by `fontKey` (inline edits). */
  customFonts?: Map<string, PDFFont>,
) {
  const H = page.getHeight();
  const color = hexToRgb(a.color);
  const opacity = a.opacity ?? 1;
  // Box top-left (a.x, a.y) → PDF bottom-left
  const boxY = H - a.y - a.height;

  switch (a.type) {
    case "rect": {
      page.drawRectangle({
        x: a.x,
        y: boxY,
        width: a.width,
        height: a.height,
        borderColor: color,
        borderWidth: a.strokeWidth ?? 2,
        color: a.fill ? hexToRgb(a.fill) : undefined,
        opacity: a.fill ? opacity : undefined,
        borderOpacity: opacity,
      });
      break;
    }
    case "highlight": {
      page.drawRectangle({
        x: a.x,
        y: boxY,
        width: a.width,
        height: a.height,
        color,
        opacity,
      });
      break;
    }
    case "ellipse": {
      page.drawEllipse({
        x: a.x + a.width / 2,
        y: H - (a.y + a.height / 2),
        xScale: a.width / 2,
        yScale: a.height / 2,
        borderColor: color,
        borderWidth: a.strokeWidth ?? 2,
        color: a.fill ? hexToRgb(a.fill) : undefined,
        opacity: a.fill ? opacity : undefined,
        borderOpacity: opacity,
      });
      break;
    }
    case "line":
    case "arrow": {
      const pts = a.points ?? [];
      if (pts.length < 2) break;
      const p1 = { x: pts[0].x, y: H - pts[0].y };
      const p2 = { x: pts[1].x, y: H - pts[1].y };
      const thickness = a.strokeWidth ?? 2;
      page.drawLine({ start: p1, end: p2, thickness, color, opacity });
      if (a.type === "arrow") {
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const len = Math.max(8, thickness * 3);
        for (const da of [-Math.PI / 6, Math.PI / 6]) {
          page.drawLine({
            start: p2,
            end: {
              x: p2.x - len * Math.cos(angle + da),
              y: p2.y - len * Math.sin(angle + da),
            },
            thickness,
            color,
            opacity,
          });
        }
      }
      break;
    }
    case "draw": {
      const pts = a.points ?? [];
      if (pts.length < 2) break;
      const d = pts
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");
      page.drawSvgPath(d, {
        x: 0,
        y: H,
        borderColor: color,
        borderWidth: a.strokeWidth ?? 2,
        borderOpacity: opacity,
      });
      break;
    }
    case "text": {
      // Inline edits cover the original glyphs with a sampled background first.
      if (a.coverColor) {
        page.drawRectangle({
          x: a.x,
          y: boxY,
          width: a.width,
          height: a.height,
          color: hexToRgb(a.coverColor),
        });
      }
      // Lay out the reflow engine on the RAW text (matching the on-screen
      // ReflowBlock, which also uses the untrimmed value) so wrap/line count and
      // the cover height stay in sync; use the trimmed value only to skip empties.
      const rawText = a.text ?? "";
      const text = rawText.trim();
      if (!text) break;
      const size = a.fontSize ?? 16;

      // Reflowable paragraph: lay out with the shared engine and draw word-by-word.
      // Prefer the embedded reflow font; if it failed to embed, fall back to the
      // closest base-14 face — still wrapped through the engine, never a single
      // overflowing line.
      if (a.reflow) {
        const rfont =
          (a.reflowFontId ? customFonts?.get(a.reflowFontId) : undefined) ??
          pickFont(fonts, a.fontCategory, !!a.bold, !!a.italic);
        const lineHeight = a.lineHeight ?? size * 1.2;
        const align = (a.align ?? "left") as Align;
        const ascent = rfont.heightAtSize(size, { descender: false });
        const firstBaseline = H - a.y - ascent;
        const lo = layoutParagraph(
          rawText,
          (s) => rfont.widthOfTextAtSize(s, size),
          a.width,
          align,
        );
        for (const p of lo.placements) {
          page.drawText(p.word, {
            x: a.x + p.x,
            y: firstBaseline - p.line * lineHeight,
            size,
            font: rfont,
            color,
            opacity,
          });
        }
        break;
      }

      // Prefer the chosen bundled font (embedded by id), then an embedded
      // metric-compatible face (inline edits), then base-14.
      const font =
        (a.fontId ? customFonts?.get(a.fontId) : undefined) ??
        customFonts?.get(fontKey(a.fontCategory, !!a.bold, !!a.italic)) ??
        pickFont(fonts, a.fontCategory, !!a.bold, !!a.italic);
      // Inline edits align to the glyph box (no inset) and stay on one line to
      // match the original run; free text boxes inset and wrap to their width.
      const inset = a.coverColor ? 0 : 2;
      page.drawText(text, {
        x: a.x + inset,
        y: H - a.y - size,
        size,
        font,
        color,
        opacity,
        lineHeight: size * 1.25,
        maxWidth: a.coverColor ? undefined : Math.max(a.width - inset * 2, 8),
      });
      break;
    }
    case "note": {
      // Sticky-note marker.
      page.drawRectangle({
        x: a.x,
        y: boxY,
        width: a.width,
        height: a.height,
        color,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
        opacity,
      });
      // Preserve the note's text on flatten: draw it as a wrapped caption to the
      // right of the marker so the comment isn't silently dropped on export.
      const noteText = a.text?.trim();
      if (noteText) {
        const ns = Math.min(Math.max(a.height * 0.5, 8), 11);
        const lo = layoutParagraph(
          noteText,
          (s) => fonts.normal.widthOfTextAtSize(s, ns),
          168,
          "left",
        );
        const capX = a.x + a.width + 5;
        const capTop = H - a.y - fonts.normal.heightAtSize(ns, { descender: false });
        const capLine = ns * 1.28;
        for (const p of lo.placements) {
          page.drawText(p.word, {
            x: capX + p.x,
            y: capTop - p.line * capLine,
            size: ns,
            font: fonts.normal,
            color: rgb(0.11, 0.11, 0.12),
            opacity,
          });
        }
      }
      break;
    }
    case "stamp": {
      const preset = STAMP_PRESETS.find((p) => p.id === a.stampVariant);
      const label = (preset?.label ?? a.stampVariant ?? "STAMP").toUpperCase();
      page.drawRectangle({
        x: a.x,
        y: boxY,
        width: a.width,
        height: a.height,
        borderColor: color,
        borderWidth: 3,
        opacity,
      });
      const fontSize = Math.min(a.height * 0.4, (a.width * 1.6) / Math.max(label.length, 1));
      const textWidth = fonts.monoBold.widthOfTextAtSize(label, fontSize);
      page.drawText(label, {
        x: a.x + (a.width - textWidth) / 2,
        y: H - a.y - a.height / 2 - fontSize / 3,
        size: fontSize,
        font: fonts.monoBold,
        color,
        opacity,
      });
      break;
    }
    case "image": {
      if (!a.imageSrc) break;
      const { bytes, isPng } = dataUrlToBytes(a.imageSrc);
      const img = isPng
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);
      page.drawImage(img, {
        x: a.x,
        y: boxY,
        width: a.width,
        height: a.height,
        opacity,
        rotate: a.rotation ? degrees(-a.rotation) : undefined,
      });
      break;
    }
  }
}
