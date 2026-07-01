import {
  ArrowDown,
  ArrowRight,
  Check,
  Clock,
  CreditCard,
  Download,
  Eraser,
  Highlighter,
  Info,
  ListOrdered,
  PenLine,
  Search,
  Signature,
  Snail,
  Stamp,
  Type,
  Upload,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

import { Brand, BrandMark } from "@/components/brand";
import { GitHubStar } from "@/components/layout/github-star";
import { Button } from "@/components/ui/button";
import { OpenPdfButton } from "@/features/upload/components/open-pdf-button";
import { UploadDropzone } from "@/features/upload/components/upload-dropzone";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ============================================================= doodles == */
/* Loose, hand-drawn gray scrawls — the marginalia that gives the page its
   irreverent, sketchbook energy. Purely decorative, hidden on small screens. */

function Scrawl({
  d,
  className,
  viewBox = "0 0 120 120",
}: {
  d: string;
  className?: string;
  viewBox?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      aria-hidden
      className={cn(
        "text-muted-foreground/35 pointer-events-none absolute hidden md:block",
        className,
      )}
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Scratchy text scribbled in the margin (e.g. "???"). */
function Scribble({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "text-muted-foreground/35 pointer-events-none absolute hidden font-mono text-sm tracking-widest whitespace-nowrap md:block",
        className,
      )}
    >
      {children}
    </span>
  );
}

function HeroDoodles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* curly arrow nodding at the headline, upper-left */}
      <Scrawl
        className="top-[18%] left-[8%] w-20 -rotate-6"
        d="M14 10 C 46 4, 78 34, 66 74 M66 74 L54 60 M66 74 L82 66"
      />
      <Scribble className="top-[24%] right-[12%] rotate-6">???</Scribble>
      <Snail className="text-muted-foreground/35 absolute right-[10%] bottom-[16%] hidden size-8 -rotate-3 md:block" />
    </div>
  );
}

/* ================================================================ data == */

const PILLARS = [
  {
    mark: "Edit",
    rest: "it all",
    body: "It's a real editor, not a viewer. Change the text in place, annotate, sign, fill forms, reorder pages — then export it however you like.",
    items: [
      "Edit real text in place",
      "Annotate, highlight & sign",
      "Fill forms & reorder pages",
      "Export PDF, images, or text",
    ],
  },
  {
    mark: "Trust",
    rest: "no one",
    body: "Your file opens in the browser and stays there. No upload, no account, no tracking. Close the tab and it's gone for good.",
    items: [
      "Nothing is ever uploaded",
      "No account, no tracking",
      "Runs fully offline",
      "Open source, MIT",
    ],
  },
  {
    mark: "Redact",
    rest: "for real",
    body: "A black box on top isn't redaction. DoxPDF removes the content underneath, scans for PII, and verifies the file before it downloads.",
    items: [
      "Mark regions or auto-find PII",
      "Content is truly removed",
      "Verified before download",
      "All on your device",
    ],
  },
];

const FORMATS = ["PDF", "PNG", "JPEG", "ZIP", "TXT", "MD"];

const STATS: [string, string][] = [
  ["0", "servers touched"],
  ["30+", "bundled fonts"],
  ["100%", "in your browser"],
  ["MIT", "open source"],
];

const OLD_WAY = [
  { icon: Upload, label: "Upload to some random site" },
  { icon: UserPlus, label: "Make yet another account" },
  { icon: Stamp, label: "Watch a watermark appear" },
  { icon: CreditCard, label: "Pay $14.99 to remove it" },
  { icon: Clock, label: "Hope they actually delete it" },
];

const FEATURES = [
  { icon: Type, label: "Edit text", color: "oklch(0.845 0.155 92)" },
  { icon: Highlighter, label: "Annotate", color: "oklch(0.6 0.16 320)" },
  { icon: Signature, label: "Sign", color: "oklch(0.64 0.09 178)" },
  { icon: Eraser, label: "Redact", color: "oklch(0.68 0.17 18)" },
  { icon: PenLine, label: "Fill forms", color: "oklch(0.68 0.13 245)" },
  { icon: ListOrdered, label: "Reorder", color: "oklch(0.845 0.155 92)" },
  { icon: Download, label: "Export", color: "oklch(0.64 0.09 178)" },
  { icon: Search, label: "Search", color: "oklch(0.6 0.16 320)" },
  { icon: Info, label: "Metadata", color: "oklch(0.68 0.17 18)" },
];

/* ================================================================ page == */

export default function HomePage() {
  return (
    <div className="landing dark bg-background text-foreground min-h-dvh">
      {/* -------------------------------------------------------- header -- */}
      <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Brand />
          <nav className="flex items-center gap-1">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground hidden px-2.5 py-1 font-mono text-[11px] tracking-wide uppercase transition-colors sm:inline"
            >
              Features
            </a>
            <a
              href="#how"
              className="text-muted-foreground hover:text-foreground hidden px-2.5 py-1 font-mono text-[11px] tracking-wide uppercase transition-colors sm:inline"
            >
              How it works
            </a>
            <span className="bg-border mx-1.5 hidden h-5 w-px sm:block" />
            <GitHubStar />
            <Button
              size="sm"
              nativeButton={false}
              className="bg-signal text-signal-foreground hover:bg-signal/90 ml-1 rounded-full font-semibold"
              render={<Link href="/editor" />}
            >
              Open editor
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* ---------------------------------------------------------- hero -- */}
        <section className="bg-background relative overflow-hidden border-b">
          {/* clean, on-brand depth: fine drafting dots, a soft overhead
              spotlight, and a warm gold pool under the drop box. */}
          <div className="dot-grid-hero absolute inset-0 opacity-50" aria-hidden />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(58% 52% at 50% 26%, color-mix(in oklch, var(--foreground) 7%, transparent), transparent 72%)",
            }}
          />
          <div
            aria-hidden
            className="absolute bottom-0 left-1/2 h-64 w-[620px] max-w-[92vw] -translate-x-1/2 translate-y-1/3 rounded-[50%] blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse, color-mix(in oklch, var(--signal) 15%, transparent), transparent 70%)",
            }}
          />
          <HeroDoodles />

          <div className="relative z-10 mx-auto max-w-3xl px-4 pt-11 pb-14 text-center sm:px-6 sm:pt-14 sm:pb-16">
            <span className="border-border bg-card/50 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10.5px] tracking-[0.16em] uppercase backdrop-blur-sm">
              <BrandMark className="text-signal size-3.5" />
              Private PDF editor · on your device
            </span>

            <h1 className="text-signal font-sans mt-6 text-[2.3rem] leading-[0.95] font-extrabold tracking-[-0.03em] text-balance sm:text-[3.7rem]">
              Why the f#k did that
              <br className="hidden sm:block" /> PDF site keep my file?
              <span className="caret" />
            </h1>

            <p className="text-foreground/85 mt-4 text-lg font-medium">
              {APP_NAME} <span className="marker">never</span> sees it.
            </p>

            <div className="mx-auto mt-6 max-w-md">
              <UploadDropzone variant="hero" highlighted />
            </div>

            <ul className="text-muted-foreground mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[10.5px] tracking-[0.12em] uppercase">
              {["No account", "No upload", "No watermark", "Open source"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="text-signal size-3" />
                    {t}
                  </li>
                ),
              )}
            </ul>

            <a
              href="#how"
              className="text-muted-foreground hover:text-foreground mt-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              See how it works
              <ArrowDown className="size-4" />
            </a>
          </div>
        </section>

        {/* ------------------------------------------------------- pillars -- */}
        <section
          id="features"
          className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24"
        >
          <div className="grid gap-12 sm:grid-cols-3 sm:gap-10">
            {PILLARS.map(({ mark, rest, body, items }) => (
              <div key={mark}>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  <span className="marker">{mark}</span>{" "}
                  <span className="text-foreground">{rest}</span>
                </h2>
                <p className="text-muted-foreground mt-4 text-[0.95rem] leading-relaxed">
                  {body}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {items.map((it) => (
                    <li
                      key={it}
                      className="text-foreground/90 flex items-start gap-2.5 text-sm font-medium"
                    >
                      <ArrowRight className="text-signal mt-0.5 size-4 shrink-0" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* formats + stats strip */}
          <div className="mt-20 grid gap-14 border-t pt-14 lg:grid-cols-2 lg:gap-10">
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2.5">
                {FORMATS.map((f) => (
                  <span
                    key={f}
                    className="border-border bg-card text-foreground/90 rounded-lg border px-3 py-1.5 font-mono text-xs tracking-wide"
                  >
                    {f}
                  </span>
                ))}
                <span className="border-signal/40 text-signal rounded-lg border px-3 py-1.5 font-mono text-xs tracking-wide">
                  +more
                </span>
              </div>
              {/* hand-drawn brace under the formats */}
              <svg
                viewBox="0 0 300 24"
                fill="none"
                aria-hidden
                className="text-muted-foreground/30 mt-2 hidden h-5 w-64 sm:block"
              >
                <path
                  d="M2 2 C 2 14, 12 12, 140 14 C 268 12, 298 14, 298 2"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                <path
                  d="M150 14 L150 22"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-muted-foreground mt-2 font-mono text-[11px] tracking-wide">
                Everything exports on your device
              </p>
            </div>

            <div className="relative grid grid-cols-2 gap-8 sm:grid-cols-4">
              {STATS.map(([n, label]) => (
                <div key={label}>
                  <div className="text-signal text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {n}
                  </div>
                  <div className="text-muted-foreground mt-1 font-mono text-[11px] tracking-wide uppercase">
                    {label}
                  </div>
                </div>
              ))}
              <Scrawl
                className="-top-10 right-2 h-16 w-16 rotate-6"
                d="M20 8 C 60 0, 84 30, 70 68 M70 68 L56 56 M70 68 L86 60"
              />
              <Scribble className="-top-9 right-16 rotate-3">
                psst — it&apos;s open source
              </Scribble>
            </div>
          </div>
        </section>

        {/* ---------------------------------------- pile vs. clean window -- */}
        <section id="how" className="border-y">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-balance sm:text-[2.75rem] sm:leading-[1.05]">
                This isn&apos;t editing.
                <br />
                <span className="marker">It&apos;s a leak.</span>
              </h2>
              <p className="text-muted-foreground mt-5 text-lg">
                The usual way ships your private file to a stranger&apos;s server
                and hopes for the best. {APP_NAME} keeps the whole job on your
                machine.
              </p>
            </div>

            <div className="mt-14 grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
              {/* the pile */}
              <div className="relative">
                <div className="text-muted-foreground mb-5 font-mono text-[11px] tracking-[0.2em] uppercase">
                  The old way
                </div>
                <div className="space-y-3">
                  {OLD_WAY.map(({ icon: Icon, label }, i) => (
                    <div
                      key={label}
                      style={{
                        marginLeft: `${i * 16}px`,
                        rotate: `${i % 2 === 0 ? -1.5 : 1.5}deg`,
                      }}
                      className="border-border bg-card/70 text-foreground/80 flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm"
                    >
                      <Icon className="text-muted-foreground size-4 shrink-0" />
                      {label}
                    </div>
                  ))}
                </div>
                <Scrawl
                  className="right-6 -bottom-6 h-14 w-14 rotate-6"
                  d="M40 78 C 8 60, 12 24, 46 14 M46 14 L34 20 M46 14 L44 28"
                />
                <span
                  aria-hidden
                  className="text-muted-foreground/40 absolute right-2 -bottom-9 hidden font-mono text-xs md:block"
                >
                  a whole pile of trust
                </span>
              </div>

              {/* the clean DoxPDF window */}
              <div className="border-border bg-card ring-hairline rounded-2xl border p-3 shadow-2xl">
                <div className="flex items-center gap-2 border-b px-2 pb-3">
                  <span className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-white/15" />
                    <span className="size-2.5 rounded-full bg-white/15" />
                    <span className="size-2.5 rounded-full bg-white/15" />
                  </span>
                  <div className="flex-1 text-center">
                    <Brand href={null} className="justify-center" />
                  </div>
                  <span className="w-8" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {FEATURES.map(({ icon: Icon, label, color }) => (
                    <div
                      key={label}
                      className="border-border/60 bg-background/40 flex flex-col gap-2 rounded-xl border p-3"
                    >
                      <span
                        className="grid size-8 place-items-center rounded-lg"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${color} 16%, transparent)`,
                        }}
                      >
                        <Icon className="size-4" style={{ color }} />
                      </span>
                      <span className="text-foreground/90 text-[0.8rem] font-medium">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground pt-3 text-center font-mono text-[11px] tracking-wide">
                  One tab · No upload · All on your device
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ final CTA -- */}
        <section className="relative overflow-hidden">
          <Scrawl
            className="top-[26%] left-[12%] w-28 -rotate-6"
            d="M4 30 C 34 2, 52 58, 84 30 S 130 6, 156 34"
            viewBox="0 0 160 60"
          />
          <Snail className="text-muted-foreground/30 absolute right-[13%] bottom-[24%] hidden size-9 rotate-6 md:block" />
          <div className="relative z-10 mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
            <h2 className="text-signal font-sans text-4xl font-extrabold tracking-[-0.02em] text-balance sm:text-[3.5rem] sm:leading-[0.95]">
              Your PDF stays yours.
            </h2>
            <p className="text-muted-foreground mx-auto mt-5 max-w-sm text-lg">
              Drop a file and start editing in seconds. No sign-up, no upload, no
              catch.
            </p>
            <div className="mt-9 flex justify-center">
              <OpenPdfButton />
            </div>
            <p className="text-muted-foreground/80 mt-7 font-mono text-[11px] tracking-[0.14em] uppercase">
              Free forever · No account · Nothing uploaded
            </p>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------ footer -- */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
          <p className="text-sm">
            <span className="font-semibold">{APP_NAME}</span>{" "}
            <span className="text-muted-foreground">
              — private PDF editing, on your device.
            </span>
          </p>
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
            © {APP_NAME} · Local-first · Open source
          </p>
        </div>
      </footer>
    </div>
  );
}
