/**
 * The single, pure layout engine for reflowable paragraphs.
 *
 * `layoutParagraph` decides line breaks and per-word x-positions; its output
 * drives **both** the on-screen editor and the pdf-lib bake, so the two are
 * identical. Measurement is injected (a `measure(text) → width` closure built
 * from the exact font we embed), and breaking/justification are done here — never
 * by the browser's CSS engine. See `docs/reflow-text-editing.md`.
 */

export type Align = "left" | "center" | "right" | "justify";

/** A measured word and its x within a line (points, from the line's left edge). */
export interface WordPlacement {
  word: string;
  x: number;
  /** 0-based line index across the whole paragraph (incl. blank lines). */
  line: number;
}

export interface ParagraphLayout {
  placements: WordPlacement[];
  /** Total number of lines (used to compute height = lineCount · lineHeight). */
  lineCount: number;
}

interface WrappedLine {
  words: string[];
  wordWidths: number[];
  /** Rendered width: words + single interior spaces, no trailing space. */
  naturalWidth: number;
  /** Last line of its paragraph — never justified. */
  isLast: boolean;
}

/**
 * Greedy / first-fit word wrap. O(n), local — re-wraps only the edited region as
 * you type, which is why it's right for live editing (Knuth–Plass is global and
 * would re-break earlier lines on every keystroke).
 */
export function greedyWrap(
  words: string[],
  wordWidths: number[],
  spaceWidth: number,
  maxWidth: number,
): WrappedLine[] {
  const lines: WrappedLine[] = [];
  let idxs: number[] = [];
  let lineWidth = 0;

  const flush = () => {
    if (!idxs.length) return;
    lines.push({
      words: idxs.map((i) => words[i]),
      wordWidths: idxs.map((i) => wordWidths[i]),
      naturalWidth: lineWidth,
      isLast: false,
    });
    idxs = [];
    lineWidth = 0;
  };

  for (let i = 0; i < words.length; i++) {
    const w = wordWidths[i];
    if (idxs.length === 0) {
      idxs = [i]; // first word always placed (even if it overflows)
      lineWidth = w;
    } else if (lineWidth + spaceWidth + w <= maxWidth) {
      idxs.push(i);
      lineWidth += spaceWidth + w;
    } else {
      flush();
      idxs = [i];
      lineWidth = w;
    }
  }
  flush();
  if (lines.length) lines[lines.length - 1].isLast = true;
  return lines;
}

/** x-offset (from the line's left edge) for each word, per alignment. */
export function wordOffsets(
  line: WrappedLine,
  spaceWidth: number,
  maxWidth: number,
  align: Align,
): number[] {
  const n = line.wordWidths.length;
  const slack = Math.max(0, maxWidth - line.naturalWidth);
  let gap = spaceWidth;
  let start = 0;

  if (align === "right") start = slack;
  else if (align === "center") start = slack / 2;
  else if (align === "justify" && !line.isLast && n > 1) {
    gap = spaceWidth + slack / (n - 1); // distribute slack over the gaps
  }

  const xs: number[] = [];
  let x = start;
  for (let i = 0; i < n; i++) {
    xs.push(x);
    x += line.wordWidths[i] + gap;
  }
  return xs;
}

/**
 * Lay out `text` into a block of width `maxWidth`. `measure(s)` returns the
 * advance width of `s` in the same units as `maxWidth` (font size baked in).
 * Explicit newlines split paragraphs (each wrapped independently; blank lines
 * preserved). Returns per-word placements + total line count.
 */
export function layoutParagraph(
  text: string,
  measure: (s: string) => number,
  maxWidth: number,
  align: Align,
): ParagraphLayout {
  const spaceWidth = measure(" ") || measure(" ") || 1;
  const placements: WordPlacement[] = [];
  let line = 0;

  for (const para of text.split(/\r\n|\r|\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      line++; // blank line
      continue;
    }
    const wordWidths = words.map((w) => measure(w));
    for (const wl of greedyWrap(words, wordWidths, spaceWidth, maxWidth)) {
      const xs = wordOffsets(wl, spaceWidth, maxWidth, align);
      wl.words.forEach((w, i) => placements.push({ word: w, x: xs[i], line }));
      line++;
    }
  }

  return { placements, lineCount: Math.max(1, line) };
}
