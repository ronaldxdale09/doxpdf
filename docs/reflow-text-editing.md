# Reflowable text editing

> Double-click a paragraph and edit it like a word processor — the text **rewraps
> live** as you type and is re-baked into the PDF. Where reflow isn't provably
> safe, it falls back to the single-run [inline edit](./inline-text-editing.md)
> and **never corrupts the document.**

This is the hard problem most browser PDF tools punt on. A PDF stores only
positioned glyphs — no words, lines, paragraphs, columns, or reading order — so
every higher-level structure we reflow is *reconstructed* and therefore fallible.
Even Acrobat and Foxit only reflow *within a single text box*. We match that
conservatism and lean on a strict safety classifier.

## The two load-bearing decisions

1. **One layout engine, used twice.** A single pure function
   `layoutParagraph(text, measure, size, maxWidth, align) → placements` computes
   the line breaks and per-word x-positions. Its output drives **both** the
   on-screen editor **and** the pdf-lib bake. We **never** let the browser's CSS
   engine choose line breaks — that's a second, non-deterministic layout engine,
   and screen/export would only coincidentally agree (the documented failure mode
   of PDF.js's own canvas-vs-textlayer drift). Measurement, breaking, and
   justification all come from our code so screen ⇄ PDF are identical.

2. **One measurement oracle = the font we embed.** We measure with **fontkit**
   on the exact font bytes pdf-lib will embed. pdf-lib measures embedded fonts via
   fontkit too, so widths match to the float. Canvas `measureText` is preview-only
   (it's an approximation the browser corrects with `scaleX`).

## Pipeline

```
getTextContent runs
   │  (content-stream order — must re-sort by reading order)
   ▼
text-blocks:  runs → words → lines → columns → paragraphs        [ported pdfminer LAParams geometry]
   │
   ▼
classify:     skip | inline-only | reflowable                    [conservative; first failing gate wins]
   │
   ├─ reflowable  → reflow editor (live rewrap)  → bake per-line/word
   └─ otherwise   → single-run inline edit (today's cover & replace)
```

### Detection constants (fractions of font size)

Ported from pdfminer.six / pdfplumber / PyMuPDF (all MIT or learned-from):

| Step | Rule |
| --- | --- |
| same line | `|Δbaseline| < 0.5·fontSize` (median baseline, jitter-robust) |
| word / space gap | join `< 0.1·fs`, split `> 0.25·fs` (`str` already has pdf.js spaces) |
| paragraph break | `gap > 1.35·median-gap` **or** list prefix **or** font/size/weight jump **or** (first-line indent `> 0.5em` **and** prev line ragged-short `> 20%`) |
| column gutter | tall vertical whitespace `> 1.5·space-width` |
| table guard | `≥3 rows` sharing `≥2` aligned x-edges ⇒ table (don't paragraph-segment) |
| reading order | sort `0.5·x0 − 1.5·(y0+y1)` (pdfminer `boxes_flow`) |

### The safety classifier (never corrupt a document)

Evaluate in order; the **first failing gate caps the result**:

- **skip** — no extractable text (image/scan), any rotation ≠ 0 (run *or* page
  `/Rotate`), vertical CJK (`dir==='ttb'`), or region overlapping a form
  widget/annotation.
- **inline-only** — more than one font family/size, super/subscripts, RTL or
  mixed direction, list/hanging indent, a column gutter or table cell, heavy
  end-of-line hyphenation, or a needed glyph missing from the embeddable font.
- **reflowable** — *all* gates pass: single column, single font family+size,
  horizontal LTR, rotation 0, ragged-or-re-justifiable, no overlaps, every glyph
  available. Deliberately narrow: plain body paragraphs.

Tagged PDFs (`getStructTree()`) give real `P`/`Hn`/`L`/`Table` boundaries via
marked-content `pX_mcN` ids — used as a *better hypothesis* when present, still
validated against geometry; most PDFs are untagged, so geometry is the baseline.

## Layout & bake (the shared engine)

- **Line-breaking:** greedy / first-fit (O(n), local — re-wraps only the edited
  region as you type). Knuth–Plass is reserved for *export-time* justification
  quality (optional).
- **Justification:** distribute the line's slack over its `n−1` gaps; the last
  line of a paragraph stays left-aligned. Left/center/right are start-offset only.
- **Editing surface:** we self-render the wrapped lines (absolutely-positioned
  word boxes at computed x) and overlay a **transparent `<textarea>`** that owns
  caret / selection / IME (the Monaco pattern) — never `contenteditable`, never
  CSS wrapping.
- **Bake:** cover the original block rectangle, then draw **word-by-word** with
  `drawText` at the computed x for every alignment (not pdf-lib's `maxWidth`,
  which is left-only and defaults `lineHeight` to 24). First-line baseline comes
  from the original run; line advance uses the original paragraph's leading.
- **Overflow** (edited text taller than the block): shrink-to-fit within a small
  bound → grow downward *only* into empty space → else show an overflow state.
  **Never** push or overlap neighboring content; pdf-lib reflows nothing for us.

## Fonts

Reflowed text is drawn in a **fontkit-embeddable** font so screen and bake share
one measurement source and all typed glyphs are guaranteed present:

- Prefer the original embedded program (PDF.js `fontObj.data`, re-wrapped
  OpenType) when it covers every needed glyph — exact appearance.
- Otherwise a bundled **metric-compatible** face by category (Liberation Sans for
  sans, ships with PDF.js; serif/mono drop-in). Widths stay close, glyphs are
  complete.

## Honest limits

- Cover-and-replace is **visual** — the original glyphs remain in the content
  stream (selectable/extractable). This is editing, **not redaction**.
- Paragraph boundaries in justified, tightly-leaded, un-indented text are
  genuinely ambiguous (even MuPDF's maintainer concedes no stable constant). When
  unsure we under-segment and let the user merge/split.
- Multi-column *cross-column* reflow, tables, rotated/vertical/RTL text, and
  scanned pages are out of scope — they classify as `inline-only` or `skip`.

## Module map

```
lib/pdf/reflow/
  layout.ts      # greedyWrap, wordOffsets, layoutParagraph — pure, the parity core
  measure.ts     # fontkit measurer from font bytes (word → advance @ size)
  fonts.ts       # resolve reflow font bytes (embedded-if-complete | bundled metric)
lib/pdf/
  text-blocks.ts # runs → lines → columns → paragraphs + the safety classifier
features/text-edit/
  use-inline-text-edit.ts  # double-click → classify → reflow editor | inline fallback
  reflow-block.tsx         # editable, live-rewrapping paragraph overlay
lib/pdf/bake.ts  # + reflow paragraph baking (cover + per-word drawText)
```
