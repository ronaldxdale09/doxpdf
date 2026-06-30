# Inline text editing & font identification

> Double-click any text in a PDF and edit it in place — in the same (or a
> close-enough) font, on the same background, with the layout preserved.

This document explains how DoxPDF edits "real" PDF text without a server, an
external SDK, or the original source files. It is grounded in how PDFs actually
store text and how the libraries we use (PDF.js, pdf-lib) behave.

## The problem

A PDF has **no notion of words, lines, or paragraphs**. Text is a sequence of
glyph-drawing operators placed at fixed coordinates using embedded (usually
*subsetted*) fonts. There is no "text box" to click into, and pdf-lib
[explicitly cannot edit or remove existing text](https://github.com/Hopding/pdf-lib#limitations).

So "edit the text" is really three sub-problems:

1. **Locate** the text run under the cursor and its exact box.
2. **Identify** the font it's drawn in, closely enough to reproduce it.
3. **Replace** it: hide the original, draw the new text in a matching font on a
   matching background, without shifting the surrounding layout.

We solve these with a **cover-and-replace** model (the same approach used by
every browser-based PDF editor), elevated by a **font identifier** that makes
the replacement visually seamless.

## Strategy: cover & replace

- **On screen** the original glyphs live on PDF.js's canvas. We paint an opaque
  rectangle in the page's *sampled background color* over the original box, then
  render an editable text element on top, pre-filled with the original string in
  an *identified* font. To the user it looks like they're editing the document.
- **On export** `bake.ts` draws the same cover rectangle, then `drawText` with a
  matched, embeddable font.

The original glyphs remain in the content stream beneath the cover (still
selectable/extractable) — acceptable for editing. True removal (redaction-grade)
is tracked as a follow-up.

## Font identification — the core idea

PDF.js does the hard part for us, in two complementary layers:

### 1. Pixel-perfect on screen (reuse the embedded face)

After a page renders, PDF.js **reconstructs each embedded font as a complete
OpenType program** and registers it in `document.fonts` under a family name
equal to the font's internal `loadedName` (e.g. `g_d0_f1`).

- `page.getTextContent()` items carry `item.fontName` — which *is* that
  `loadedName`.
- `page.commonObjs.get(loadedName)` returns the font object: the real PostScript
  `name` (e.g. `ABCDEF+Helvetica-Bold`), the generic `fallbackName`
  (`serif`/`sans-serif`/`monospace`), and the raw OpenType bytes in `.data`.

We copy `.data` into our **own** stable `FontFace` (so it survives page
unmount/cleanup) and render the editable text in it → glyph-for-glyph identical
to the page, for every character that was already on the page.

> **Subset caveat.** Embedded fonts are usually *subsets* — only the glyphs used
> on the page. A character the user *types* that wasn't there falls back to the
> next family in the stack. That's why we always pair the exact face with a
> classified fallback (below).

### 2. Embeddable & close-enough on export (classify → substitute)

pdf-lib can't reuse a subset face for newly typed characters (missing glyphs
silently render as `.notdef` tofu — custom fonts don't throw). So for the
*export* path we **classify** the original font and pick an embeddable match:

```
postscriptName, /Flags, /FontWeight, /ItalicAngle
        │
        ▼
  normalize name (strip 6-letter subset tag, unify separators)
  bold   = name has bold/black/heavy  OR weight ≥ 600  OR ForceBold flag
  italic = name has italic/oblique    OR italicAngle ≠ 0  OR Italic flag
  category = FixedPitch flag | name(courier/mono…) → mono
             Serif flag       | name(times/georgia…) → serif
             else → sans
        │
        ▼
  pick font:
    base-14 family + WinAnsi text → pdf-lib StandardFonts (zero bytes, exact AFM widths)
    else → bundled metric-compatible TTF (Arimo/Tinos/Cousine, …)   [Stage 2]
```

The classifier (`lib/pdf/fonts/classify.ts`) follows Mozilla pdf.js's
`font_substitutions.js` name logic and the ISO 32000-1 §9.8.2 `/Flags` bitfield.

#### Metric-compatible substitutes (Stage 2)

"Metric-compatible" = identical advance widths, so re-rendered text occupies the
same space and the line doesn't reflow. All permissively licensed and bundle-able:

| Original | Substitute | License |
|---|---|---|
| Arial / Helvetica | **Arimo** | Apache-2.0 |
| Times New Roman | **Tinos** | Apache-2.0 |
| Courier New | **Cousine** | Apache-2.0 |
| Calibri | **Carlito** | OFL-1.1 |
| Cambria | **Caladea** | OFL-1.1 |
| Georgia | **Gelasio** | OFL-1.1 |

Arimo/Tinos/Cousine (Google **Croscore**, Apache-2.0) are the minimal core.

## Staging

- **Stage 1:** locate + identify + cover-and-replace, with pixel-perfect
  on-screen reuse of the embedded face and a **StandardFonts** export matched by
  category (sans→Helvetica, serif→Times, mono→Courier) with bold/italic.
- **Stage 2 (shipped):** for the **sans** category the export now embeds
  **Liberation Sans** (metric-compatible with Arial/Helvetica, within ~1% advance
  width) via a lazy-loaded `@pdf-lib/fontkit`, so edited sans text keeps the
  original widths and the layout never shifts. Liberation Sans already ships with
  PDF.js and is copied to `public/pdf/standard_fonts`, so this adds **zero new
  font files**. Serif/mono stay on base-14 Times/Courier; dropping Tinos/Cousine
  (or Liberation Serif/Mono) TTFs into `lib/pdf/fonts/embeddable.ts` is all that's
  needed to make those metric-exact too. Embedding is keyed by classified
  category+style and only runs when an inline edit is present (the common export
  never loads fontkit).

Implemented in `lib/pdf/fonts/embeddable.ts` (font bytes by category/style),
`export.ts` (`buildCustomFonts` → `registerFontkit` + subset `embedFont`), and
`bake.ts` (`drawAnnotation` prefers the embedded face, falls back to base-14).

## Module map

```
lib/pdf/fonts/
  classify.ts     # name + flags → { category, bold, italic } (pure, tested)
  identify.ts     # page + text item → FontIdentity (+ registers the exact FontFace)
lib/pdf/
  text-hit.ts     # page point → the text run under it (string, box, font)
  canvas-sample.ts# sample background + text color from the rendered page canvas
features/text-edit/
  use-inline-text-edit.ts   # double-click → cover+editable annotation, matched font
```

The `Annotation` model gains `coverColor` (background painted behind the text,
on screen and at bake) and `fontCategory`/`sourceFont` (export font selection +
provenance). No existing tool changes behavior.

## Known limits (honest)

- No paragraph **reflow** — long replacements shrink-to-fit the original width.
- **Subset** fonts can't render newly typed glyphs in the exact face; the
  classified fallback covers them (Stage 2 makes the fallback metric-exact).
- Background sampling assumes a roughly solid local background; text over
  photos/gradients won't blend perfectly.
- The cover is **visual**; the original text remains under it until true removal
  lands.
