<div align="center">

# DoxPDF

### A fast, privacy-first PDF editor that runs entirely in your browser.

No account. No uploads. No watermarks. Drop a PDF, edit it instantly, and download — your files never leave your device.

[![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b.svg)](./LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-22a06b.svg)](#-contributing)
[![100% client-side](https://img.shields.io/badge/100%25-client--side-8b5cf6.svg)](#-privacy-by-design)

</div>

---

DoxPDF is a free, open-source alternative to Acrobat-style PDF editors that does
**all of its work on your device**. The rendering engine, fonts, and every edit
stay in your browser — nothing is uploaded, logged, or stored. Close the tab and
it's gone.

It avoids proprietary PDF SDKs (no PSPDFKit, no Apryse) and is built entirely on
open standards, so it deploys to any static/serverless host.

## 📸 Screenshots

<!--
Add captures to docs/screenshots/ and uncomment:

<p align="center">
  <img src="docs/screenshots/landing.png" alt="DoxPDF landing" width="49%" />
  <img src="docs/screenshots/editor.png" alt="DoxPDF editor" width="49%" />
</p>
-->

> Run `pnpm dev` and open <http://localhost:3000> to see it live, or add your own
> captures under [`docs/screenshots/`](./docs/screenshots).

## ✨ Features

| | |
| --- | --- |
| 🪄 **Instant, local** | Drop a PDF → in-browser preview & editing. Nothing is uploaded. |
| 🔡 **Edit real text** | Double-click any text to edit it **in place**, in a matching font — a built-in font identifier picks the closest face. |
| ✍️ **Annotate** | Text, freehand pen / marker / highlighter, shapes (rect / ellipse / line / arrow), highlight, sticky notes, stamps, images. |
| 🎛️ **Direct manipulation** | Select, move, resize, **snap & alignment guides**, a context properties bar, and an arrange/inspector panel. |
| ↩️ **Unlimited undo/redo** | Every action is a history step. |
| 🗂️ **Organize pages** | Drag-reorder, rotate, duplicate, delete, insert blank. |
| ✒️ **Sign** | Draw, type (handwriting fonts), or upload a signature; reuse + initials. |
| 📝 **Forms & metadata** | Fill AcroForm fields; edit document metadata. |
| 🔍 **Search** | Full-text search with match highlighting and navigation. |
| ⬇️ **Export anywhere** | PDF · PNG · JPEG · ZIP · text · markdown. |
| 📤 **Share** | Via the OS share sheet (Web Share API) — still no upload. |
| 🌗 **Polished** | Light/dark mode, Adobe-style keyboard shortcuts, responsive, accessible. |

## 🔒 Privacy by design

```
Your device  →  DoxPDF (in your browser)  →  Your device
```

- **No cloud upload.** PDFs are parsed and edited client-side with PDF.js + pdf-lib.
- **No tracking, no accounts.** There is no backend that sees your files.
- **Assets are self-hosted.** The PDF.js worker, cmaps, and fonts are served from
  your own origin (copied into `public/` on install) — not a third-party CDN.
- **Works offline** once loaded.

## 🧰 Tech stack

**Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** (strict) ·
**Tailwind CSS v4** + **shadcn/ui** (on **Base UI**) · **Zustand** ·
**PDF.js** (`pdfjs-dist`) + **react-pdf** (render) · **pdf-lib** +
**@pdf-lib/fontkit** (edit/export) · **react-rnd** (move/resize) · **JSZip**.

## 🚀 Getting started

**Prerequisites:** Node.js 20+ and [pnpm](https://pnpm.io).

```bash
git clone https://github.com/ronaldxdale09/doxpdf.git
cd doxpdf

pnpm install   # postinstall copies the PDF.js worker/cmaps/fonts into public/
pnpm dev       # http://localhost:3000
```

Then drop a PDF onto the landing page (or `/editor`) and start editing.

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` | Production build (must stay green) |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm copy-pdf-worker` | Refresh the local PDF.js worker / cmaps / fonts in `public/` |

## 🏗️ Architecture

DoxPDF is a **feature-based, client-rendered** app. A few decisions are load-bearing:

- **The editor is client-only.** PDF.js touches browser globals (`DOMMatrix`) at
  module load, which crashes SSR, so the editor shell is loaded via
  `next/dynamic` with `ssr: false`. All react-pdf/pdf.js imports live behind that boundary.
- **One `<Document>` for the whole editor.** The page viewer and thumbnail sidebar
  are descendants of a single react-pdf `<Document>`, so the file is parsed **once**
  and shared via context.
- **Windowing.** Page and thumbnail canvases mount only when near the viewport
  (IntersectionObserver), reserving scroll space with an estimated height — so
  500+ page documents stay fast and memory-bounded.
- **Annotation geometry** is stored in **PDF points, top-left origin**, converted
  to screen pixels by a single `scale`, and flipped to PDF's bottom-left origin at
  bake time. One canonical unit keeps rendering and export trivial.
- **Page-slot model.** The document is an ordered list of slots (a view of a source
  page + rotation); reorder/duplicate/delete/insert just rearrange slots — no re-parse.
  Annotations are keyed by slot id, so they travel with their page.
- **`pdfjs-dist` is pinned** to the exact version react-pdf depends on (a mismatch
  throws "API version does not match Worker version").

### Inline text editing & font identification

The standout feature — double-click existing PDF text to edit it — is documented
in depth in **[`docs/inline-text-editing.md`](./docs/inline-text-editing.md)**:
how the original glyphs are located, how the font is identified (and reused on
screen, pixel-perfect), and how the replacement is baked with a metric-compatible
font so the layout never shifts.

### Project structure

```
src/
├─ app/                 # routes: / (landing) and /editor, global styles
├─ components/          # providers, site chrome, shared UI (shadcn / Base UI)
├─ features/
│  ├─ upload/           # drag & drop + file validation
│  ├─ viewer/           # windowed react-pdf page rendering
│  ├─ editor/           # shell, top bar, tool rail, inspector, shortcuts
│  ├─ annotations/      # annotation layer & items, snapping/guides
│  ├─ text-edit/        # double-click inline text editing
│  ├─ signature/        # draw / type / upload signatures
│  └─ search/           # full-text search + highlight
├─ lib/
│  ├─ pdf/              # setup, export & bake (pdf-lib), fonts, search
│  └─ annotations/      # geometry, defaults, page operations
├─ store/               # Zustand stores (document, editor, annotations, …)
└─ types/               # shared domain types
```

## 🗺️ Roadmap

Shipped: annotations, inline text editing, pages & signatures, forms,
multi-format export, search, metadata, sharing, snapping, keyboard shortcuts.

Planned / help wanted:

- **Password protection & encryption** — pdf-lib can't encrypt; needs a wasm
  crypto module (e.g. qpdf-wasm).
- **Merge / split across documents** — the slot model is ready; needs a
  second-source importer.
- **Metric-exact serif/mono export fonts** — drop-in (the loader already accepts them).
- **Whole-line inline editing**, true (redaction-grade) text removal, and rotated-page support.

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repo and create a branch: `git checkout -b feat/my-change`.
2. Make your change. Keep features self-contained under `features/<name>/` and
   match the surrounding style.
3. **Before opening a PR**, make sure both stay green:
   ```bash
   pnpm lint
   pnpm build
   ```
4. Open a pull request describing the change.

Found a bug or have an idea? [Open an issue](https://github.com/ronaldxdale09/doxpdf/issues).

## 📄 License

[MIT](./LICENSE) © Ronald Dale Fuentebella

## 🙏 Acknowledgements

Built on the shoulders of [PDF.js](https://github.com/mozilla/pdf.js),
[pdf-lib](https://github.com/Hopding/pdf-lib),
[react-pdf](https://github.com/wojtekmaj/react-pdf),
[Next.js](https://nextjs.org), and [shadcn/ui](https://ui.shadcn.com) — no
proprietary PDF SDKs.
