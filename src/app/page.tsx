import {
  FileSignature,
  Highlighter,
  Layers,
  Search,
  Share2,
  Type,
  type LucideIcon,
} from "lucide-react";

import { BrandMark } from "@/components/brand";
import { SiteHeader } from "@/components/layout/site-header";
import { UploadDropzone } from "@/features/upload/components/upload-dropzone";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Capability {
  icon: LucideIcon;
  title: string;
  description: string;
}

const CAPABILITIES: Capability[] = [
  {
    icon: Type,
    title: "Edit real text",
    description:
      "Double-click any paragraph to rewrite it in place — in a matching font.",
  },
  {
    icon: Highlighter,
    title: "Annotate & highlight",
    description: "Highlighter, pen, shapes, sticky notes, stamps, and images.",
  },
  {
    icon: FileSignature,
    title: "Fill & sign",
    description: "Complete forms and add a drawn, typed, or uploaded signature.",
  },
  {
    icon: Layers,
    title: "Organize pages",
    description: "Reorder, rotate, duplicate, delete, and insert pages.",
  },
  {
    icon: Search,
    title: "Search the document",
    description: "Find any text with highlighted matches and quick navigation.",
  },
  {
    icon: Share2,
    title: "Export anywhere",
    description: "Download as PDF, PNG, JPEG, text, or markdown — or share.",
  },
];

// Cycle the brand accents across the capability tiles — terracotta for energy,
// green-teal for depth, charcoal for structure — echoing the visual language.
const TILE_ACCENT = [
  "bg-signal text-signal-foreground",
  "bg-brand-green text-success-foreground",
  "bg-foreground text-background",
];

const STEPS = [
  {
    label: "Drop a PDF",
    description:
      "Drag a file in. It opens instantly, parsed right inside your browser.",
  },
  {
    label: "Make your edits",
    description: "Text, pages, annotations, forms, and signatures.",
  },
  {
    label: "Download or share",
    description: "Save a PDF, image, or text file — or share from your device.",
  },
];

const TRUST = ["No account", "No upload", "No watermark", "Open source"];

/** Numbered editorial section label: `01 — CAPABILITIES`. */
function SectionLabel({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] uppercase">
      <span className="text-signal tabular-nums">
        {String(index).padStart(2, "0")}
      </span>
      <span className="bg-border h-px w-6" />
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero — an editorial masthead. One serif headline, the spark motif,
            and the dropzone as the single bold gesture. No glow. */}
        <section className="relative overflow-hidden">
          {/* Quiet drafting texture, softly masked toward the headline. */}
          <div
            aria-hidden
            className="dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_30%,black,transparent_75%)]"
          />
          {/* Oversized signature spark, bleeding off the top-right corner. */}
          <BrandMark
            aria-hidden
            className="text-signal/[0.07] pointer-events-none absolute -top-24 -right-20 size-[34rem] rotate-12"
          />

          <div className="animate-in fade-in slide-in-from-bottom-4 relative mx-auto max-w-3xl px-4 pt-16 pb-16 text-center duration-700 sm:px-6 sm:pt-20">
            <div className="flex justify-center">
              <span className="text-muted-foreground inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase">
                <BrandMark className="text-signal size-3.5" />
                Private PDF editor · runs on your device
              </span>
            </div>

            <h1 className="font-display mx-auto mt-6 max-w-2xl text-[2.6rem] leading-[1.04] font-medium tracking-[-0.015em] text-balance sm:text-6xl">
              PDF editing that{" "}
              <em className="text-signal font-display italic">never leaves</em>{" "}
              your browser.
            </h1>

            <p className="text-muted-foreground mx-auto mt-5 max-w-md text-[1.05rem] text-pretty">
              Highlight, annotate, sign, edit real text, and export — entirely on
              your device. Nothing is uploaded, logged, or stored.
            </p>

            <div className="animate-in fade-in zoom-in-95 mx-auto mt-9 max-w-md [animation-delay:120ms] duration-700">
              <UploadDropzone variant="hero" highlighted />
            </div>

            <p className="text-muted-foreground/80 mt-6 font-mono text-[10.5px] tracking-[0.14em] uppercase">
              {TRUST.join("  ·  ")}
            </p>
          </div>
        </section>

        {/* Capabilities */}
        <section
          id="features"
          className="border-border/70 scroll-mt-20 border-t"
        >
          <div className="mx-auto max-w-6xl px-4 py-18 sm:px-6 lg:py-24">
            <div className="max-w-2xl">
              <SectionLabel index={1}>Capabilities</SectionLabel>
              <h2 className="font-display mt-5 text-3xl font-medium tracking-[-0.01em] text-balance sm:text-[2.5rem] sm:leading-[1.08]">
                A complete editor, nothing to install.
              </h2>
              <p className="text-muted-foreground mt-4 max-w-md text-pretty">
                Everything you expect from a desktop PDF tool — built on open web
                standards and running fully offline.
              </p>
            </div>

            <div className="border-border/80 mt-12 grid grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map(({ icon: Icon, title, description }, i) => (
                <div
                  key={title}
                  className={cn(
                    "group bg-card hover:bg-accent/40 relative p-7 transition-colors sm:p-8",
                    // Hairline rules between cells, no double borders at edges.
                    "border-border/80 border-t border-l",
                    i < 3 && "sm:border-t-0",
                    i % 2 === 0 && "max-sm:border-l-0",
                    "lg:[&:nth-child(3n+1)]:border-l-0 lg:[&:nth-child(-n+3)]:border-t-0",
                  )}
                >
                  <span
                    className={cn(
                      "mb-5 grid size-11 place-items-center rounded-xl shadow-sm ring-1 ring-black/5 transition-transform group-hover:-translate-y-0.5",
                      TILE_ACCENT[i % TILE_ACCENT.length],
                    )}
                  >
                    <Icon className="size-[1.15rem]" />
                  </span>
                  <h3 className="text-[1.05rem] font-medium">{title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm text-pretty">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — a real sequence, so numbered steps earn their place */}
        <section id="how" className="bg-secondary/50 scroll-mt-20 border-y">
          <div className="mx-auto max-w-6xl px-4 py-18 sm:px-6 lg:py-24">
            <SectionLabel index={2}>How it works</SectionLabel>
            <h2 className="font-display mt-5 max-w-xl text-3xl font-medium tracking-[-0.01em] text-balance sm:text-[2.5rem] sm:leading-[1.08]">
              Three steps. A few seconds.
            </h2>

            <ol className="mt-14 grid gap-12 sm:grid-cols-3 sm:gap-8">
              {STEPS.map((step, i) => (
                <li key={step.label} className="relative">
                  <div className="font-display text-signal text-5xl leading-none font-medium tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="bg-border my-5 h-px w-full" />
                  <h3 className="text-lg font-medium">{step.label}</h3>
                  <p className="text-muted-foreground mt-2 text-sm text-pretty">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Privacy band — the differentiator */}
        <section
          id="privacy"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-18 sm:px-6 lg:py-24"
        >
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionLabel index={3}>Privacy by default</SectionLabel>
              <h2 className="font-display mt-5 text-3xl font-medium tracking-[-0.01em] text-balance sm:text-[2.5rem] sm:leading-[1.08]">
                Your files never touch a server.
              </h2>
              <p className="text-muted-foreground mt-5 max-w-md text-pretty">
                {APP_NAME}{" "}runs entirely in your browser. The rendering engine,
                fonts, and every edit stay on your device — nothing is uploaded,
                logged, or stored. Close the tab and it&apos;s gone.
              </p>
            </div>

            <div className="bg-card rounded-2xl border p-7 sm:p-9">
              <div className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
                Data flow
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <span className="bg-foreground text-background rounded-lg px-3.5 py-2 font-medium">
                  Your device
                </span>
                <span className="text-signal font-medium">→</span>
                <span className="border-signal/50 text-foreground rounded-lg border px-3.5 py-2">
                  {APP_NAME}
                </span>
                <span className="text-signal font-medium">→</span>
                <span className="bg-foreground text-background rounded-lg px-3.5 py-2 font-medium">
                  Your device
                </span>
              </div>
              <ul className="text-muted-foreground mt-7 space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5">
                  <span className="text-destructive font-medium">✗</span> No cloud
                  upload
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-destructive font-medium">✗</span> No
                  tracking or accounts
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-brand-green font-medium">✓</span> Works
                  fully offline
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <BrandMark className="text-signal size-5" />
            <p className="font-display text-base italic">
              Private by design. Yours to keep.
            </p>
          </div>
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
            © {APP_NAME} · Local-first · Open standards
          </p>
        </div>
      </footer>
    </div>
  );
}
