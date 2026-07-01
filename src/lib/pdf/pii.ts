/**
 * On-device PII detection for "Find sensitive info". Pure pattern matching over
 * the document's own extracted text — nothing is uploaded. Each match is mapped
 * back to a page region so it can become a redaction mark.
 */
import type { PDFDocumentProxy } from "pdfjs-dist";

import type { PageSlot } from "@/types/pdf";

import { getPageTextItems } from "./text-items";

export type PiiType = "email" | "ssn" | "credit-card" | "phone" | "ip";

interface PiiPattern {
  type: PiiType;
  label: string;
  regex: RegExp;
  validate?: (s: string) => boolean;
}

/** Luhn check so we only flag real card numbers, not any 16-digit run. */
function luhnValid(s: string): boolean {
  const d = s.replace(/\D/g, "");
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// Order matters: more specific / longer patterns first for overlap resolution.
const PII_PATTERNS: PiiPattern[] = [
  {
    type: "email",
    label: "Email",
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },
  {
    type: "credit-card",
    label: "Credit card",
    regex: /\b(?:\d[ -]?){13,19}\b/g,
    validate: luhnValid,
  },
  { type: "ssn", label: "SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  {
    type: "ip",
    label: "IP address",
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
  },
  {
    type: "phone",
    label: "Phone",
    regex: /(?:\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  },
];

export interface PiiMatch {
  type: PiiType;
  label: string;
  value: string;
  start: number;
  end: number;
}

/** Find PII in a string, with overlapping matches resolved to the longest. */
export function findPiiInText(text: string): PiiMatch[] {
  const raw: PiiMatch[] = [];
  for (const p of PII_PATTERNS) {
    p.regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = p.regex.exec(text)) !== null) {
      const value = m[0];
      if (m.index === p.regex.lastIndex) p.regex.lastIndex++; // guard zero-width
      if (p.validate && !p.validate(value)) continue;
      raw.push({
        type: p.type,
        label: p.label,
        value,
        start: m.index,
        end: m.index + value.length,
      });
    }
  }
  // Prefer longer matches; drop any that overlap an already-accepted span.
  raw.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const accepted: PiiMatch[] = [];
  for (const c of raw) {
    if (accepted.some((a) => c.start < a.end && c.end > a.start)) continue;
    accepted.push(c);
  }
  return accepted.sort((a, b) => a.start - b.start);
}

export interface PiiRegion {
  type: PiiType;
  label: string;
  value: string;
  pageId: string;
  /** Region in the page's displayed point space (top-left origin). */
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Scan every source page for PII and return redaction candidates positioned on
 * the matching text (proportional sub-run of the containing text item).
 */
export async function scanPdfForPii(
  proxy: PDFDocumentProxy,
  slots: PageSlot[],
): Promise<PiiRegion[]> {
  const regions: PiiRegion[] = [];
  for (const slot of slots) {
    if (slot.src <= 0) continue;
    const items = await getPageTextItems(proxy, slot.src);
    for (const it of items) {
      const n = it.str.length;
      if (n === 0) continue;
      for (const mt of findPiiInText(it.str)) {
        const x0 = it.x + (it.width * mt.start) / n;
        const w = (it.width * (mt.end - mt.start)) / n;
        regions.push({
          type: mt.type,
          label: mt.label,
          value: mt.value,
          pageId: slot.id,
          x: x0 - 1.5,
          y: it.y - 1,
          width: w + 3,
          height: it.height + 2,
        });
      }
    }
  }
  return regions;
}
