import type { PDFDocumentProxy } from "pdfjs-dist";

/** Extract the plain text of a single page. */
export async function extractPageText(
  proxy: PDFDocumentProxy,
  pageNumber: number,
): Promise<string> {
  const page = await proxy.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract document text for AI context, page-labelled and capped so we never
 * blow the model's context window. Returns the text and whether it was cut.
 */
export async function extractDocumentText(
  proxy: PDFDocumentProxy,
  maxChars = 24000,
): Promise<{ text: string; truncated: boolean }> {
  const parts: string[] = [];
  let total = 0;
  let truncated = false;

  for (let i = 1; i <= proxy.numPages; i++) {
    const text = await extractPageText(proxy, i);
    if (!text) continue;
    parts.push(`[Page ${i}]\n${text}`);
    total += text.length;
    if (total > maxChars) {
      truncated = true;
      break;
    }
  }

  return { text: parts.join("\n\n"), truncated };
}
