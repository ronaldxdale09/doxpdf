/**
 * Font classification — turn a PDF font's name (and, when available, its
 * FontDescriptor flags) into the few facts we need to reproduce it: a generic
 * category, plus bold/italic.
 *
 * The name logic mirrors Mozilla pdf.js (`src/core/font_substitutions.js`,
 * `fonts_utils.js`); the `/Flags` bit positions follow ISO 32000-1:2008 §9.8.2
 * (Table 121). Pure and dependency-free so it can be unit-tested in isolation.
 */

export type FontCategory = "sans" | "serif" | "mono";

export interface FontClass {
  category: FontCategory;
  bold: boolean;
  italic: boolean;
  /** The font name with subset tag and foundry suffixes stripped (for display). */
  cleanName: string;
}

/** FontDescriptor `/Flags` bits we use (1-indexed in the spec; value = 1<<(n-1)). */
export const FontFlags = {
  FixedPitch: 1 << 0, // bit 1
  Serif: 1 << 1, // bit 2
  Symbolic: 1 << 2, // bit 3
  Script: 1 << 3, // bit 4
  Nonsymbolic: 1 << 5, // bit 6
  Italic: 1 << 6, // bit 7
  ForceBold: 1 << 18, // bit 19
} as const;

/** Optional descriptor hints, when the caller has parsed the FontDescriptor. */
export interface FontDescriptorHints {
  flags?: number | null;
  /** /FontWeight, 100–900 (400 normal, 700 bold). */
  weight?: number | null;
  /** /ItalicAngle in degrees (0 upright; negative for right-leaning italics). */
  italicAngle?: number | null;
  /** PDF.js name-heuristic booleans, when read off the font object. */
  pdfjsBold?: boolean;
  pdfjsItalic?: boolean;
  pdfjsSerif?: boolean;
  pdfjsMono?: boolean;
}

const SUBSET_TAG = /^[A-Z]{6}\+/;
/** Monotype (`MT`)/PostScript (`PS`) format suffixes — not style tokens. */
const FOUNDRY_SUFFIX = /(PSMT|MT|PS|BT)$/;

const MONO_RE = /courier|mono|consol|menlo|monaco|typewriter/i;
const SERIF_RE =
  /times|roman|georgia|garamond|cambria|minion|palatino|book\s?antiqua|serif|mincho|song/i;
const SANS_RE =
  /arial|helvetica|verdana|tahoma|calibri|segoe|sans|grotesk|gothic|trebuchet|hei/i;

/** Normalize a BaseFont/PostScript name: drop subset tag, unify separators. */
export function normalizeFontName(name: string): string {
  let n = name.trim();
  if (SUBSET_TAG.test(n)) n = n.slice(7); // "ABCDEF+Arial" → "Arial"
  // pdf.js: commas and underscores are equivalent to hyphens; drop whitespace.
  n = n.replace(/[,_]/g, "-").replace(/\s/g, "");
  return n;
}

/** The family root, with style and foundry/format suffixes removed. */
function familyRoot(normalized: string): string {
  // Take the part before the first style separator, then strip foundry tags.
  const head = normalized.split("-")[0] || normalized;
  return head.replace(FOUNDRY_SUFFIX, "");
}

/**
 * Classify a font from its (raw) PostScript/BaseFont name, optionally refined by
 * FontDescriptor hints. Resolution order is name → numeric hints → flags, so an
 * explicit style token in the name always wins.
 */
export function classifyFont(
  rawName: string | undefined | null,
  hints: FontDescriptorHints = {},
): FontClass {
  const name = rawName ? normalizeFontName(rawName) : "";
  const lower = name.toLowerCase();

  // --- bold ---
  let bold = /bold|black|heavy|extrabold|semibold|demibold/i.test(name);
  if (!bold && typeof hints.weight === "number") bold = hints.weight >= 600;
  if (!bold && hints.flags != null) bold ||= !!(hints.flags & FontFlags.ForceBold);
  if (!bold && hints.pdfjsBold) bold = true;

  // --- italic ---
  let italic = /italic|oblique/i.test(name);
  if (!italic && typeof hints.italicAngle === "number")
    italic = hints.italicAngle !== 0;
  if (!italic && hints.flags != null) italic ||= !!(hints.flags & FontFlags.Italic);
  if (!italic && hints.pdfjsItalic) italic = true;

  // --- category: flags first (authoritative), then name, then pdf.js hints ---
  let category: FontCategory;
  if (hints.flags != null && hints.flags & FontFlags.FixedPitch) category = "mono";
  else if (MONO_RE.test(lower)) category = "mono";
  else if (hints.pdfjsMono) category = "mono";
  else if (hints.flags != null && hints.flags & FontFlags.Serif) category = "serif";
  else if (SERIF_RE.test(lower)) category = "serif";
  else if (hints.pdfjsSerif) category = "serif";
  else if (SANS_RE.test(lower)) category = "sans";
  else category = "sans"; // safe default

  return { category, bold, italic, cleanName: familyRoot(name) || name };
}
