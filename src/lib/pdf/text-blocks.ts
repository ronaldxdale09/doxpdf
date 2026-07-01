/**
 * Reconstruct paragraph blocks from PDF.js text runs and decide whether each is
 * safely reflowable. A port of pdfminer-style geometry (lines → paragraphs) with
 * a deliberately conservative classifier: anything ambiguous is downgraded so we
 * never corrupt a document. See `docs/reflow-text-editing.md`.
 *
 * All geometry is in the page's unrotated point space, **top-left origin
 * (y-down)** — the same space the annotation model and exporter use.
 */
import type { PDFDocumentProxy } from "pdfjs-dist";

import type { Align } from "./reflow/layout";

export interface Run {
  str: string;
  x: number; // left edge
  baselineY: number; // baseline (top-left space)
  top: number; // glyph-box top
  width: number;
  fontSize: number;
  fontName: string; // PDF.js loadedName — same name ⇒ same family/weight/style
  dir: string; // 'ltr' | 'rtl' | 'ttb'
  rotated: boolean;
}

export interface Line {
  runs: Run[];
  x0: number;
  x1: number;
  baselineY: number;
  top: number;
  bottom: number;
  fontSize: number;
  text: string;
}

export type Reflowability = "reflowable" | "inline-only" | "skip";

export interface Paragraph {
  lines: Line[];
  x0: number;
  y0: number; // top
  x1: number;
  y1: number; // bottom
  text: string;
  fontSize: number;
  lineHeight: number;
  align: Align;
  fontName: string;
  reflow: Reflowability;
}

const LIST_PREFIX = /^\s*([•◦▪‣·*-]|\(?\d{1,3}[.)]|\(?[a-zA-Z][.)])\s+/;

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
function mode(xs: number[], bucket = 0.5): number {
  if (xs.length === 0) return 0;
  const counts = new Map<number, number>();
  let best = xs[0];
  let bestN = 0;
  for (const x of xs) {
    const k = Math.round(x / bucket);
    const n = (counts.get(k) ?? 0) + 1;
    counts.set(k, n);
    if (n > bestN) {
      bestN = n;
      best = k * bucket;
    }
  }
  return best;
}

/** Extract runs in top-left point space. */
export async function getPageRuns(
  proxy: PDFDocumentProxy,
  pageNumber: number,
): Promise<Run[]> {
  const page = await proxy.getPage(pageNumber);
  const H = page.getViewport({ scale: 1, rotation: 0 }).height;
  const content = await page.getTextContent();
  const styles = content.styles as Record<string, { ascent?: number }>;

  const runs: Run[] = [];
  for (const it of content.items) {
    if (!("str" in it) || it.str.length === 0) continue;
    const tx = it.transform as number[];
    const fontSize = Math.hypot(tx[2], tx[3]) || it.height || 10;
    const rotated = Math.abs(tx[1]) > 1e-3 || Math.abs(tx[2]) > 1e-3;
    const ascent = styles[it.fontName]?.ascent ?? 0.8;
    const baselineY = H - tx[5];
    runs.push({
      str: it.str,
      x: tx[4],
      baselineY,
      top: baselineY - ascent * fontSize,
      width: it.width,
      fontSize,
      fontName: "fontName" in it ? (it.fontName as string) : "",
      dir: "dir" in it ? (it.dir as string) : "ltr",
      rotated,
    });
  }
  return runs;
}

/** Cluster runs into lines by baseline (tol = 0.5·fontSize), jitter-robust. */
function groupLines(runs: Run[]): Line[] {
  const sorted = [...runs].sort(
    (a, b) => a.baselineY - b.baselineY || a.x - b.x,
  );
  const lines: { runs: Run[]; baselineY: number }[] = [];
  for (const r of sorted) {
    if (!r.str.trim()) continue; // skip pure-whitespace runs for grouping
    const L = lines.find(
      (l) =>
        Math.abs(l.baselineY - r.baselineY) <
        0.5 * Math.max(r.fontSize, l.runs[0].fontSize),
    );
    if (L) {
      L.runs.push(r);
      L.baselineY = median(L.runs.map((x) => x.baselineY));
    } else {
      lines.push({ runs: [r], baselineY: r.baselineY });
    }
  }
  return lines.map((l) => {
    const rs = l.runs.sort((a, b) => a.x - b.x);
    const x0 = Math.min(...rs.map((r) => r.x));
    const x1 = Math.max(...rs.map((r) => r.x + r.width));
    const fontSize = median(rs.map((r) => r.fontSize));
    return {
      runs: rs,
      x0,
      x1,
      baselineY: l.baselineY,
      top: Math.min(...rs.map((r) => r.top)),
      bottom: l.baselineY + 0.25 * fontSize,
      fontSize,
      text: rs
        .map((r) => r.str)
        .join("")
        .replace(/\s+/g, " ")
        .trim(),
    };
  });
}

/** Largest internal horizontal gap within a line (a column gutter / table cell). */
function maxInternalGap(line: Line): number {
  let gap = 0;
  for (let i = 1; i < line.runs.length; i++) {
    const prev = line.runs[i - 1];
    gap = Math.max(gap, line.runs[i].x - (prev.x + prev.width));
  }
  return gap;
}

/** Group consecutive lines into paragraphs (single-column assumption). */
function segmentParagraphs(lines: Line[]): Line[][] {
  const ordered = [...lines].sort((a, b) => a.baselineY - b.baselineY);
  if (ordered.length === 0) return [];
  const gaps: number[] = [];
  for (let i = 1; i < ordered.length; i++) {
    gaps.push(ordered[i].baselineY - ordered[i - 1].baselineY);
  }
  const bodyGap = mode(gaps, 0.5) || median(gaps) || ordered[0].fontSize * 1.2;
  const leftEdge = median(ordered.map((l) => l.x0));
  const bodySize = median(ordered.map((l) => l.fontSize));
  const blockRight = Math.max(...ordered.map((l) => l.x1));

  const paras: Line[][] = [];
  let cur: Line[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const L = ordered[i];
    const P = ordered[i - 1];
    let boundary = i === 0;
    if (P) {
      const gap = L.baselineY - P.baselineY;
      const gapBreak = gap > 1.35 * bodyGap;
      const indentStart = L.x0 > leftEdge + 0.5 * bodySize;
      const prevShort = blockRight - P.x1 > 0.2 * (blockRight - leftEdge);
      const sizeJump = Math.abs(L.fontSize - P.fontSize) > 0.15 * bodySize;
      const listStart = LIST_PREFIX.test(L.text);
      boundary = gapBreak || sizeJump || listStart || (indentStart && prevShort);
    }
    if (boundary && cur.length) {
      paras.push(cur);
      cur = [];
    }
    cur.push(L);
  }
  if (cur.length) paras.push(cur);
  return paras;
}

function classifyAlignment(lines: Line[], x0: number, x1: number, fs: number): Align {
  if (lines.length <= 1) return "left";
  const tol = 0.4 * fs;
  const leftFlush = lines.every((l) => Math.abs(l.x0 - x0) <= tol);
  const body = lines.slice(0, -1);
  const bodyRightFlush = body.every((l) => Math.abs(l.x1 - x1) <= tol);
  // Justify needs at least TWO body lines flush to the right edge: with a single
  // body line it trivially defines `x1`, so a ragged-left two-line paragraph
  // would be misread as justified. Require real evidence before justifying.
  if (leftFlush && bodyRightFlush && body.length >= 2) return "justify";
  if (leftFlush) return "left";
  if (lines.every((l) => Math.abs(l.x1 - x1) <= tol)) return "right";
  if (lines.every((l) => Math.abs(l.x0 - x0 - (x1 - l.x1)) <= tol)) return "center";
  return "left";
}

/** Build a paragraph (geometry, reconstructed text, alignment) and classify it. */
function buildParagraph(lines: Line[]): Paragraph {
  const x0 = Math.min(...lines.map((l) => l.x0));
  const x1 = Math.max(...lines.map((l) => l.x1));
  const y0 = Math.min(...lines.map((l) => l.top));
  const y1 = Math.max(...lines.map((l) => l.bottom));
  const fontSize = median(lines.flatMap((l) => l.runs.map((r) => r.fontSize)));
  const text = lines.map((l) => l.text).join(" ").replace(/\s+/g, " ").trim();
  const align = classifyAlignment(lines, x0, x1, fontSize);

  const baselines = lines.map((l) => l.baselineY).sort((a, b) => a - b);
  const lineHeight =
    baselines.length > 1
      ? median(baselines.slice(1).map((b, i) => b - baselines[i]))
      : fontSize * 1.2;

  const allRuns = lines.flatMap((l) => l.runs);
  const fontNames = new Set(allRuns.map((r) => r.fontName));
  const sizes = allRuns.map((r) => r.fontSize);
  const sizeSpread = Math.max(...sizes) - Math.min(...sizes);
  const fontName = lines[0]?.runs[0]?.fontName ?? "";

  // ---- conservative classifier (first failing gate wins) ----
  let reflow: Reflowability = "reflowable";
  const gutter = Math.max(...lines.map(maxInternalGap));
  if (allRuns.some((r) => r.rotated)) reflow = "skip";
  else if (allRuns.some((r) => r.dir === "ttb")) reflow = "skip";
  else if (allRuns.some((r) => r.dir === "rtl")) reflow = "inline-only";
  else if (fontNames.size > 1) reflow = "inline-only";
  else if (sizeSpread > 0.15 * fontSize) reflow = "inline-only";
  else if (gutter > 2.5 * fontSize) reflow = "inline-only"; // column gutter / table cell
  else if (lines.some((l) => LIST_PREFIX.test(l.text))) reflow = "inline-only";
  else if (text.length === 0) reflow = "skip";

  return { lines, x0, y0, x1, y1, text, fontSize, lineHeight, align, fontName, reflow };
}

/** Full pipeline: page runs → classified paragraphs. */
export function detectParagraphs(runs: Run[]): Paragraph[] {
  const lines = groupLines(runs);
  return segmentParagraphs(lines).map(buildParagraph);
}

// Per-file cache (cleared when the open file changes via `token`).
const paraCache = new Map<number, Paragraph[]>();
let paraToken: unknown = null;

/** Cached page → classified paragraphs. `token` keys the cache (pass the File). */
export async function getPageParagraphs(
  proxy: PDFDocumentProxy,
  src: number,
  token: unknown,
): Promise<Paragraph[]> {
  if (token !== paraToken) {
    paraCache.clear();
    paraToken = token;
  }
  let p = paraCache.get(src);
  if (!p) {
    p = detectParagraphs(await getPageRuns(proxy, src));
    paraCache.set(src, p);
  }
  return p;
}

/**
 * The paragraph whose box contains `point` (page points), or null. The box is
 * grown by font-size-proportional slack so a click just outside the text still
 * resolves to it (and keeps the nicer reflow path instead of dropping to a
 * single-run edit). When boxes overlap, the smallest (most specific) wins.
 */
export function findParagraphAt(
  paras: Paragraph[],
  point: { x: number; y: number },
): Paragraph | null {
  let best: Paragraph | null = null;
  let bestArea = Infinity;
  for (const p of paras) {
    const padX = Math.max(2, 0.5 * p.fontSize);
    const padY = Math.max(2, 0.35 * p.fontSize);
    if (
      point.x >= p.x0 - padX &&
      point.x <= p.x1 + padX &&
      point.y >= p.y0 - padY &&
      point.y <= p.y1 + padY
    ) {
      const area = (p.x1 - p.x0) * (p.y1 - p.y0);
      if (area < bestArea) {
        best = p;
        bestArea = area;
      }
    }
  }
  return best;
}
