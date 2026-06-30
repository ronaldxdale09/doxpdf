// Copies PDF.js runtime assets (worker, cmaps, standard fonts) from the
// installed `pdfjs-dist` package into `public/` so they are served from our own
// origin. This keeps DoxPDF privacy-first and fully offline-capable — the
// browser never reaches out to a third-party CDN to render a PDF.
//
// Runs automatically on `postinstall` and can be invoked manually.
import { access, cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = resolve(root, "node_modules/pdfjs-dist");

/** @param {string} p */
async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** @type {{ from: string; to: string; recursive?: boolean }[]} */
const assets = [
  {
    from: resolve(pkg, "build/pdf.worker.min.mjs"),
    to: resolve(root, "public/pdf.worker.min.mjs"),
  },
  {
    from: resolve(pkg, "cmaps"),
    to: resolve(root, "public/pdf/cmaps"),
    recursive: true,
  },
  {
    from: resolve(pkg, "standard_fonts"),
    to: resolve(root, "public/pdf/standard_fonts"),
    recursive: true,
  },
];

let copied = 0;
for (const asset of assets) {
  if (!(await exists(asset.from))) {
    console.warn(`[copy-pdf-worker] Skipped (not found): ${asset.from}`);
    continue;
  }
  await mkdir(dirname(asset.to), { recursive: true });
  await cp(asset.from, asset.to, { recursive: Boolean(asset.recursive) });
  copied += 1;
}

console.log(`[copy-pdf-worker] Copied ${copied} PDF.js asset(s) into public/`);
