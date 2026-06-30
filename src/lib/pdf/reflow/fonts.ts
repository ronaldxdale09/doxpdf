/**
 * Resolve the font a reflowed paragraph is measured, rendered, and baked with —
 * a single source so screen ⇄ export stay identical. Prefers the original
 * embedded program (exact look) when it covers the text; otherwise a bundled
 * metric-compatible face. Bytes are kept in an in-memory registry keyed by id so
 * the on-screen renderer and the bake can both reach them. See
 * `docs/reflow-text-editing.md`.
 */
import { nanoid } from "nanoid";

import { loadEmbeddableFont } from "../fonts/embeddable";
import type { FontIdentity } from "../fonts/identify";

import { createMeasurer } from "./measure";

const byteRegistry = new Map<string, Uint8Array>();
const renderFamilyCache = new Map<Uint8Array, string>();

/** Bytes for a resolved reflow font (renderer + bake look them up by id). */
export function getReflowFontBytes(id: string): Uint8Array | null {
  return byteRegistry.get(id) ?? null;
}

export interface ReflowFont {
  fontId: string;
  bytes: Uint8Array;
  /** CSS family that renders identically to `bytes` (no synthetic bold/italic). */
  cssFamily: string;
}

/** Register bundled bytes as a FontFace so on-screen render matches the bake. */
async function registerRenderFace(bytes: Uint8Array): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const cached = renderFamilyCache.get(bytes);
  if (cached) return cached;
  const family = `rf-${nanoid(6)}`;
  try {
    const face = new FontFace(family, bytes.slice().buffer);
    await face.load();
    document.fonts.add(face);
    renderFamilyCache.set(bytes, family);
    return family;
  } catch {
    return null;
  }
}

/**
 * Resolve a font for a reflowable paragraph. Returns null when none is faithful
 * and complete (caller then falls back to single-run inline editing).
 */
export async function resolveReflowFont(
  identity: FontIdentity,
  size: number,
  text: string,
): Promise<ReflowFont | null> {
  // 1. Exact: the original embedded program, if it covers every glyph in `text`.
  if (identity.embeddedBytes && identity.embeddedBytes.byteLength > 0) {
    try {
      const m = await createMeasurer(identity.embeddedBytes, size);
      if (m.covers(text)) {
        const fontId = `rf-${nanoid(8)}`;
        byteRegistry.set(fontId, identity.embeddedBytes);
        return { fontId, bytes: identity.embeddedBytes, cssFamily: identity.cssFamily };
      }
    } catch {
      // fall through to bundled
    }
  }

  // 2. Metric-compatible bundled face (sans today; serif/mono → caller falls back).
  const bundled = await loadEmbeddableFont(identity.category, identity.bold, identity.italic);
  if (bundled) {
    const family = await registerRenderFace(bundled);
    const fontId = `rf-${nanoid(8)}`;
    byteRegistry.set(fontId, bundled);
    return {
      fontId,
      bytes: bundled,
      cssFamily: family ? `"${family}", ${identity.cssFamily}` : identity.cssFamily,
    };
  }

  return null;
}
