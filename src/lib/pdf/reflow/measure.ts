/**
 * fontkit-backed text measurement — the single oracle shared by the on-screen
 * reflow editor and the pdf-lib bake. We measure with fontkit on the exact bytes
 * pdf-lib embeds, and pdf-lib measures embedded fonts the same way, so widths
 * match to the float. See `docs/reflow-text-editing.md`.
 */

interface FontkitFont {
  unitsPerEm: number;
  layout(s: string): { positions: { xAdvance: number }[] };
  hasGlyphForCodePoint(cp: number): boolean;
}
interface Fontkit {
  create(bytes: Uint8Array): FontkitFont;
}

let fontkitMod: Fontkit | null = null;
async function getFontkit(): Promise<Fontkit> {
  if (!fontkitMod) {
    const mod = await import("@pdf-lib/fontkit");
    fontkitMod = (mod.default ?? mod) as unknown as Fontkit;
  }
  return fontkitMod;
}

export interface Measurer {
  /** Advance width of `s` at the configured size (points). */
  measure: (s: string) => number;
  /** True if every code point in `s` has a glyph in this font. */
  covers: (s: string) => boolean;
}

/**
 * Build a measurer for `bytes` at `size`. Async only because fontkit is
 * lazy-loaded (kept out of the main bundle); the returned `measure` is sync.
 */
export async function createMeasurer(
  bytes: Uint8Array,
  size: number,
): Promise<Measurer> {
  const fontkit = await getFontkit();
  const font = fontkit.create(bytes);
  const upm = font.unitsPerEm || 1000;
  const cache = new Map<string, number>();

  const measure = (s: string): number => {
    if (s === "") return 0;
    const hit = cache.get(s);
    if (hit !== undefined) return hit;
    let w = 0;
    try {
      for (const p of font.layout(s).positions) w += p.xAdvance;
      w = (w / upm) * size;
    } catch {
      w = 0;
    }
    cache.set(s, w);
    return w;
  };

  const covers = (s: string): boolean => {
    for (const ch of s) {
      const cp = ch.codePointAt(0);
      if (cp === undefined) continue;
      if (cp === 0x20 || cp === 0x0a || cp === 0x0d || cp === 0x09) continue;
      try {
        if (!font.hasGlyphForCodePoint(cp)) return false;
      } catch {
        return false;
      }
    }
    return true;
  };

  return { measure, covers };
}
