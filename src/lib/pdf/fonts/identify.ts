/**
 * Font identification — given PDF.js's internal font reference for a text run,
 * recover the real font and make it reusable for editing.
 *
 * After a page renders, PDF.js registers the font it actually painted in
 * `document.fonts` under a family equal to its `loadedName` — for *embedded*
 * fonts (`g_dN_fM`) and for *substituted* standard fonts (`g_dN_sfM`) alike. So
 * the most reliable way to render editable text identically to the page is to
 * reference that `loadedName` directly. When the font is embedded we also copy
 * its bytes into our own stable `FontFace`, so the match survives page cleanup
 * (our viewer unmounts off-screen pages). See `docs/inline-text-editing.md`.
 */
import type { PDFPageProxy } from "pdfjs-dist";

import { classifyFont, type FontClass } from "./classify";

export interface FontIdentity extends FontClass {
  /** Real PostScript name, e.g. "ABCDEF+Helvetica-Bold" (empty if unknown). */
  realName: string;
  /**
   * CSS `font-family` stack that renders the editable text as close to the
   * original as possible, most-faithful first. Safe to assign straight to
   * `style.fontFamily`; unresolved families are skipped by the browser.
   */
  cssFamily: string;
  /** The embedded font program (OpenType) if any — for reflow measure + embed. */
  embeddedBytes?: Uint8Array;
}

/** Shape of the bits we read off a PDF.js font object (loosely typed upstream). */
interface PdfFontObject {
  name?: string;
  fallbackName?: string;
  data?: Uint8Array;
  isType3Font?: boolean;
  bold?: boolean;
  italic?: boolean;
  black?: boolean;
  isSerifFont?: boolean;
  isMonospace?: boolean;
  systemFontInfo?: { css?: string } | null;
}

interface CommonObjs {
  has(id: string): boolean;
  get(id: string): unknown;
}

const GENERIC: Record<FontClass["category"], string> = {
  sans: "sans-serif",
  serif: "serif",
  mono: "monospace",
};

// loadedName → registered stable CSS family (or null once we know we can't copy).
const faceCache = new Map<string, string | null>();

/** Best-effort: copy PDF.js's reconstructed (embedded) program into our FontFace. */
async function registerStableFace(
  loadedName: string,
  font: PdfFontObject,
): Promise<string | null> {
  if (faceCache.has(loadedName)) return faceCache.get(loadedName)!;
  // Type3 fonts are operator lists; substituted/non-embedded fonts have no bytes.
  if (font.isType3Font || !font.data || font.data.byteLength === 0) {
    faceCache.set(loadedName, null);
    return null;
  }
  const family = `dox-${loadedName}`;
  try {
    const bytes = font.data.slice(); // copy — the page may be cleaned up
    const face = new FontFace(family, bytes.buffer);
    await face.load();
    document.fonts.add(face);
    faceCache.set(loadedName, family);
    return family;
  } catch {
    faceCache.set(loadedName, null);
    return null;
  }
}

/**
 * Identify the font behind a text run. `loadedName` is the `fontName` reported
 * by `getTextContent()`. Requires the page to have rendered (so the font object
 * and FontFace exist); degrades gracefully to classification-only otherwise.
 */
export async function identifyFont(
  page: PDFPageProxy,
  loadedName: string,
): Promise<FontIdentity> {
  let font: PdfFontObject | null = null;
  try {
    const objs = (page as unknown as { commonObjs: CommonObjs }).commonObjs;
    if (objs && objs.has(loadedName)) font = objs.get(loadedName) as PdfFontObject;
  } catch {
    font = null; // not resolved yet — fall back to generic classification
  }

  const realName = font?.name ?? "";
  const cls = classifyFont(realName, {
    pdfjsBold: font?.bold || font?.black,
    pdfjsItalic: font?.italic,
    pdfjsSerif: font?.isSerifFont,
    pdfjsMono: font?.isMonospace,
  });
  const generic = GENERIC[cls.category];

  const families: string[] = [];
  // 1. Stable copy of the embedded program (survives page cleanup).
  if (font) {
    const stable = await registerStableFace(loadedName, font);
    if (stable) families.push(`"${stable}"`);
  }
  // 2. The exact face PDF.js painted, by loadedName (embedded or substituted).
  if (loadedName) families.push(`"${loadedName}"`);
  // 3. PDF.js's own substitute chain. NOTE: `systemFontInfo.css` is already a
  //    full CSS family *list* (e.g. `"Helvetica",g_d0_sf2,sans-serif`), so it is
  //    appended verbatim — quoting it would nest quotes and void the rule.
  const systemCss = font?.systemFontInfo?.css;
  if (systemCss) families.push(systemCss);
  // 4. Generic, always last.
  families.push(generic);

  // De-duplicate while preserving order, then join into one valid stack.
  const seen = new Set<string>();
  const stack = families.filter((f) => f && !seen.has(f) && seen.add(f));

  const embeddedBytes =
    font && !font.isType3Font && font.data && font.data.byteLength > 0
      ? font.data.slice()
      : undefined;

  return { ...cls, realName, cssFamily: stack.join(", "), embeddedBytes };
}
