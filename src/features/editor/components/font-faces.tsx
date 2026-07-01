import { bundledFontFaceCss } from "@/lib/fonts/catalog";

/**
 * Injects `@font-face` rules for the bundled text library. The browser loads
 * each face lazily the first time something renders in it (a picker preview or a
 * text annotation), so this adds no upfront cost. Editor-only.
 */
export function FontFaces() {
  return <style dangerouslySetInnerHTML={{ __html: bundledFontFaceCss() }} />;
}
