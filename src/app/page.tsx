import {
  FileSignature,
  Highlighter,
  Layers,
  Search,
  Share2,
  Type,
  type LucideIcon,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { UploadDropzone } from "@/features/upload/components/upload-dropzone";
import { APP_NAME } from "@/lib/constants";

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
      "Double-click any text to edit it in place — in a matching font.",
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

const STEPS = [
  {
    label: "Drop a PDF",
    description: "Drag a file in. It opens instantly, parsed right in your browser.",
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase">
      <span className="bg-signal size-1.5 rounded-full" />
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero — one bold gesture (the highlighter-marked headline); the rest quiet */}
        <section className="from-muted/45 to-background relative overflow-hidden bg-gradient-to-b">
          {/* Editing-canvas grid, focused with a soft mask — quiet texture, no glow */}
          <div
            aria-hidden
            className="dot-grid-hero pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_62%_58%_at_50%_32%,black,transparent_72%)]"
          />
          {/* A faint baseline ground line where the hero band meets the page */}
          <div
            aria-hidden
            className="via-border/70 pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent"
          />
          <div className="animate-in fade-in slide-in-from-bottom-4 relative mx-auto max-w-2xl px-4 pt-14 pb-14 text-center duration-700 sm:px-6 sm:pt-16">
            <div className="flex justify-center">
              <Eyebrow>Local-first PDF editor</Eyebrow>
            </div>
            <h1 className="font-display mx-auto mt-4 max-w-xl text-[2rem] leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
              PDF editing that{" "}
              <span className="mark mark-draw whitespace-nowrap">
                never leaves
              </span>{" "}
              your browser.
            </h1>
            <p className="text-muted-foreground mx-auto mt-4 max-w-md text-pretty">
              Highlight, annotate, sign, edit text, and export — entirely on your
              device.
            </p>

            <div className="animate-in fade-in zoom-in-95 mx-auto mt-8 max-w-md [animation-delay:120ms] duration-700">
              <UploadDropzone variant="hero" highlighted />
            </div>

            <p className="text-muted-foreground/80 mt-5 font-mono text-[10.5px] tracking-[0.12em] uppercase">
              {TRUST.join(" · ")}
            </p>
          </div>
        </section>

        {/* Capabilities */}
        <section
          id="features"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24"
        >
          <div className="max-w-2xl">
            <Eyebrow>Capabilities</Eyebrow>
            <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              A full editor, no SDK lock-in
            </h2>
            <p className="text-muted-foreground mt-3">
              Everything you expect from a desktop PDF tool, built entirely on
              open standards.
            </p>
          </div>

          <div className="bg-border mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-card hover:bg-accent/40 group relative p-6 transition-colors sm:p-7"
              >
                <span className="bg-foreground text-background mb-4 grid size-10 place-items-center rounded-lg transition-colors group-hover:bg-signal group-hover:text-signal-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-medium">{title}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works — a real sequence, so numbered steps earn their place */}
        <section id="how" className="bg-card scroll-mt-20 border-y">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-display mt-4 max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Three steps. A few seconds.
            </h2>

            <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-6">
              {STEPS.map((step, i) => (
                <li key={step.label} className="relative">
                  <div className="text-muted-foreground/70 font-mono text-xs tracking-wider">
                    STEP {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="bg-border my-4 h-px w-full" />
                  <h3 className="font-display text-xl font-medium">
                    {step.label}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm">
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
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24"
        >
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow>Privacy by default</Eyebrow>
              <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Your files never touch a server.
              </h2>
              <p className="text-muted-foreground mt-4 max-w-md">
                {APP_NAME}{" "}runs entirely in your browser. The rendering engine,
                fonts, and every edit stay on your device — nothing is uploaded,
                logged, or stored. Close the tab and it&apos;s gone.
              </p>
            </div>

            <div className="bg-card rounded-xl border p-6 sm:p-8">
              <div className="font-mono text-xs">
                <div className="text-muted-foreground tracking-wider">
                  DATA FLOW
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="bg-foreground text-background rounded-md px-3 py-2 font-medium">
                    Your device
                  </span>
                  <span className="text-signal">→</span>
                  <span className="border-signal/60 text-foreground rounded-md border px-3 py-2">
                    {APP_NAME}
                  </span>
                  <span className="text-signal">→</span>
                  <span className="bg-foreground text-background rounded-md px-3 py-2 font-medium">
                    Your device
                  </span>
                </div>
                <ul className="text-muted-foreground mt-6 space-y-2">
                  <li>
                    <span className="text-destructive">✗</span> No cloud upload
                  </li>
                  <li>
                    <span className="text-destructive">✗</span> No tracking or
                    accounts
                  </li>
                  <li>
                    <span className="text-success">✓</span> Works fully offline
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 font-mono text-xs tracking-wide sm:flex-row sm:px-6">
          <p>© {APP_NAME} — in-browser PDF editing</p>
          <p>Local-first · Open standards · No lock-in</p>
        </div>
      </footer>
    </div>
  );
}
