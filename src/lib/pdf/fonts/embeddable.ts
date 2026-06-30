/**
 * Embeddable metric-compatible fonts for the export path.
 *
 * For inline text edits we want the baked replacement to occupy the *same*
 * advance widths as the original so the layout never shifts. The base-14
 * Helvetica family used elsewhere is close but not metric-identical to Arial /
 * Calibri / Verdana etc. PDF.js ships **Liberation Sans** (metric-compatible
 * with Arial/Helvetica) and the project copies it to `public/pdf/standard_fonts`,
 * so the sans category can be embedded for an exact-width match with zero extra
 * bundle weight.
 *
 * Serif/mono fall back to base-14 Times/Courier (the canonical substitutes);
 * dropping Tinos/Cousine (or Liberation Serif/Mono) TTFs here is the only step
 * needed to make those metric-exact too. See `docs/inline-text-editing.md`.
 */
import type { FontCategory } from "./classify";

/** Liberation Sans faces served from the copied PDF.js standard-fonts dir. */
const SANS_FACES: Record<"regular" | "bold" | "italic" | "boldItalic", string> = {
  regular: "/pdf/standard_fonts/LiberationSans-Regular.ttf",
  bold: "/pdf/standard_fonts/LiberationSans-Bold.ttf",
  italic: "/pdf/standard_fonts/LiberationSans-Italic.ttf",
  boldItalic: "/pdf/standard_fonts/LiberationSans-BoldItalic.ttf",
};

// url → bytes (or null once we know the fetch failed), to avoid refetching.
const cache = new Map<string, Uint8Array | null>();

async function fetchFont(url: string): Promise<Uint8Array | null> {
  if (cache.has(url)) return cache.get(url)!;
  let bytes: Uint8Array | null = null;
  try {
    const res = await fetch(url);
    if (res.ok) bytes = new Uint8Array(await res.arrayBuffer());
  } catch {
    bytes = null; // offline / blocked — caller falls back to base-14
  }
  cache.set(url, bytes);
  return bytes;
}

/**
 * Bytes of a metric-compatible font to embed for a classified text run, or null
 * when none is bundled for that category (caller should use base-14 instead).
 */
export async function loadEmbeddableFont(
  category: FontCategory | undefined,
  bold: boolean,
  italic: boolean,
): Promise<Uint8Array | null> {
  if (category !== "sans") return null; // serif/mono → base-14 Times/Courier
  const face = bold && italic ? "boldItalic" : bold ? "bold" : italic ? "italic" : "regular";
  return fetchFont(SANS_FACES[face]);
}

/** Stable key for an embedded-font cache, by category + style. */
export function fontKey(
  category: FontCategory | undefined,
  bold: boolean,
  italic: boolean,
): string {
  return `${category ?? "sans"}-${bold ? "b" : ""}-${italic ? "i" : ""}`;
}
