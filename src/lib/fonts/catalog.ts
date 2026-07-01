/**
 * The text-font catalog: three always-available base-14 faces plus a bundled
 * library served from `/fonts` (see `scripts/fetch-fonts.mjs`). Every bundled
 * face is rendered on screen via `@font-face` and embedded (subset) into the PDF
 * on export, so what you type is what you get — fully offline, no CDN.
 */

export type FontCategory = "sans" | "serif" | "mono";

export interface FontOption {
  /** Stable id — stored on the annotation and used to key the embedded font. */
  id: string;
  label: string;
  /** Base-14 category used as the export fallback if a bundled face is missing. */
  category: FontCategory;
  /** Picker group heading. */
  group: string;
  /** TTF filename under `/fonts`; undefined for the base-14 faces. */
  file?: string;
  /** CSS `font-family` stack for on-screen rendering. */
  cssFamily: string;
}

const FALLBACK: Record<FontCategory, string> = {
  sans: "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'Courier New', monospace",
};

/** The `@font-face` family name for a bundled font id. */
export function fontFamilyName(id: string): string {
  return `Dox ${id}`;
}

function bundled(
  id: string,
  label: string,
  category: FontCategory,
  group: string,
): FontOption {
  return {
    id,
    label,
    category,
    group,
    file: `${id}.ttf`,
    cssFamily: `"${fontFamilyName(id)}", ${FALLBACK[category]}`,
  };
}

export const FONT_OPTIONS: FontOption[] = [
  // Standard — base-14, always present, need no download.
  { id: "sans", label: "Helvetica", category: "sans", group: "Standard", cssFamily: `Helvetica, Arial, ${FALLBACK.sans}` },
  { id: "serif", label: "Times", category: "serif", group: "Standard", cssFamily: `"Times New Roman", Times, ${FALLBACK.serif}` },
  { id: "mono", label: "Courier", category: "mono", group: "Standard", cssFamily: `"Courier New", Courier, ${FALLBACK.mono}` },

  // Sans
  bundled("inter", "Inter", "sans", "Sans"),
  bundled("sourcesans", "Source Sans", "sans", "Sans"),
  bundled("opensans", "Open Sans", "sans", "Sans"),
  bundled("lato", "Lato", "sans", "Sans"),
  bundled("montserrat", "Montserrat", "sans", "Sans"),
  bundled("poppins", "Poppins", "sans", "Sans"),
  bundled("worksans", "Work Sans", "sans", "Sans"),
  bundled("raleway", "Raleway", "sans", "Sans"),
  bundled("nunito", "Nunito", "sans", "Sans"),
  bundled("dmsans", "DM Sans", "sans", "Sans"),

  // Serif
  bundled("lora", "Lora", "serif", "Serif"),
  bundled("merriweather", "Merriweather", "serif", "Serif"),
  bundled("playfairdisplay", "Playfair Display", "serif", "Serif"),
  bundled("domine", "Domine", "serif", "Serif"),
  bundled("crimsontext", "Crimson Text", "serif", "Serif"),
  bundled("ebgaramond", "EB Garamond", "serif", "Serif"),
  bundled("sourceserif", "Source Serif", "serif", "Serif"),
  bundled("bitter", "Bitter", "serif", "Serif"),

  // Mono
  bundled("jetbrainsmono", "JetBrains Mono", "mono", "Mono"),
  bundled("spacemono", "Space Mono", "mono", "Mono"),
  bundled("ibmplexmono", "IBM Plex Mono", "mono", "Mono"),

  // Display
  bundled("oswald", "Oswald", "sans", "Display"),
  bundled("bebasneue", "Bebas Neue", "sans", "Display"),
  bundled("abrilfatface", "Abril Fatface", "serif", "Display"),

  // Handwriting
  bundled("caveat", "Caveat", "sans", "Handwriting"),
  bundled("dancingscript", "Dancing Script", "sans", "Handwriting"),
  bundled("pacifico", "Pacifico", "sans", "Handwriting"),
];

const BY_ID = new Map(FONT_OPTIONS.map((f) => [f.id, f]));

export function getFontOption(id?: string | null): FontOption | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** Resolve the option for an annotation from its `fontId`, else by category. */
export function resolveFontOption(
  fontId?: string,
  category?: FontCategory,
): FontOption {
  return (
    getFontOption(fontId) ??
    FONT_OPTIONS.find((f) => f.group === "Standard" && f.category === category) ??
    FONT_OPTIONS[0]
  );
}

export const DEFAULT_FONT_OPTION = FONT_OPTIONS[0]; // Helvetica

/** Picker groups in display order. */
export const FONT_GROUPS: { group: string; fonts: FontOption[] }[] = (() => {
  const order = ["Standard", "Sans", "Serif", "Mono", "Display", "Handwriting"];
  return order.map((group) => ({
    group,
    fonts: FONT_OPTIONS.filter((f) => f.group === group),
  }));
})();

// Cache of fetched TTF bytes (for export embedding), keyed by font id.
const catalogBytes = new Map<string, Uint8Array | null>();

/** Fetch a bundled font's TTF bytes (for pdf-lib embedding). Null for base-14. */
export async function loadCatalogFontBytes(id: string): Promise<Uint8Array | null> {
  const opt = getFontOption(id);
  if (!opt?.file) return null; // base-14 (or unknown) → exporter uses a base-14 face
  const hit = catalogBytes.get(id);
  if (hit !== undefined) return hit;
  let bytes: Uint8Array | null = null;
  try {
    const res = await fetch(`/fonts/${opt.file}`);
    if (res.ok) bytes = new Uint8Array(await res.arrayBuffer());
  } catch {
    bytes = null; // offline/missing → base-14 fallback in bake
  }
  catalogBytes.set(id, bytes);
  return bytes;
}

/** `@font-face` rules for every bundled face (browser loads each lazily on use). */
export function bundledFontFaceCss(): string {
  return FONT_OPTIONS.filter((f) => f.file)
    .map(
      (f) =>
        `@font-face{font-family:"${fontFamilyName(f.id)}";` +
        `src:url("/fonts/${f.file}") format("truetype");` +
        `font-display:swap;font-weight:100 900;}`,
    )
    .join("");
}
