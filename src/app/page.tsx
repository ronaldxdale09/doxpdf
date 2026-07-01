import { Check, Lock, ShieldCheck, Type } from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/features/upload/components/upload-dropzone";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- doodles -- */

function Squiggle({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 240 120"
      fill="none"
      aria-hidden
      className={cn("text-signal pointer-events-none absolute hidden sm:block", className)}
      style={{ filter: "drop-shadow(0 0 5px var(--signal))" }}
    >
      <path d={d} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" opacity={0.9} />
    </svg>
  );
}

/** A struck-through "old way" annoyance floating in the hero. */
function Scribble({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "text-muted-foreground/55 decoration-signal/80 pointer-events-none absolute hidden font-mono text-xs whitespace-nowrap line-through decoration-2 sm:block",
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
      <Squiggle className="top-[16%] left-[5%] w-40 -rotate-6 opacity-70" d="M2,40 C40,6 70,74 108,40 S176,8 238,52" />
      <Squiggle className="top-[24%] right-[6%] w-40 rotate-3 opacity-70" d="M2,20 C34,64 82,-8 120,32 S204,72 238,22" />
      <Squiggle className="bottom-[8%] left-[15%] w-32 rotate-12 opacity-60" d="M2,30 C40,0 60,80 100,50 S170,10 238,44" />
      <Squiggle className="right-[16%] bottom-[12%] w-28 -rotate-6 opacity-60" d="M2,50 C50,10 90,90 140,40 S210,10 238,40" />
      <Scribble className="top-[30%] left-[8%] -rotate-6">Upload required</Scribble>
      <Scribble className="top-[19%] right-[9%] rotate-6">Create an account</Scribble>
      <Scribble className="top-[52%] left-[12%] -rotate-3">Watermark added</Scribble>
      <Scribble className="top-[50%] right-[11%] rotate-3">$14.99 / month</Scribble>
      <Scribble className="bottom-[15%] right-[19%] -rotate-6">&ldquo;We kept a copy&rdquo;</Scribble>
      <Scribble className="bottom-[13%] left-[9%] rotate-3">Processed on our servers</Scribble>
    </div>
  );
}

/* ------------------------------------------------------------------ data -- */

const VALUES = [
  {
    icon: Type,
    title: "Do everything",
    items: [
      "Edit real text in place",
      "Annotate, highlight & sign",
      "Fill forms, reorder pages",
      "Export PDF, images, or text",
    ],
  },
  {
    icon: Lock,
    title: "Keep it private",
    items: [
      "No upload — not once",
      "No account, no tracking",
      "Runs fully offline",
      "Open source, MIT",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Redact for real",
    items: [
      "Mark regions or auto-find PII",
      "Content is truly removed",
      "Verified before it downloads",
      "On your device, always",
    ],
  },
];

const STATS: [string, string][] = [
  ["0", "servers touched"],
  ["30+", "bundled fonts"],
  ["100%", "in your browser"],
  ["MIT", "open source"],
];

const TRUST = "No account · No upload · No watermark · Open source";

/* ------------------------------------------------------------------ page -- */

export default function HomePage() {
  return (
    <div className="dark bg-background text-foreground min-h-dvh">
      <SiteHeader />

      <main>
        {/* Hero — the punchy pain-question, wrapped in neon doodles */}
        <section className="relative overflow-hidden border-b">
          <HeroDoodles />
          <div className="relative mx-auto max-w-3xl px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24">
            <span className="border-signal/30 bg-signal/10 text-signal inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] tracking-[0.14em] uppercase">
              Private PDF editor
            </span>

            <h1 className="font-sans mt-7 text-[2.7rem] leading-[0.98] font-extrabold tracking-[-0.03em] text-balance sm:text-[4.75rem]">
              Why upload your
              <br />
              PDF to <span className="text-signal">some random</span>
              <br />
              website?
            </h1>

            <p className="text-muted-foreground mx-auto mt-6 max-w-md text-[1.05rem] text-pretty">
              You don&apos;t have to. {APP_NAME} edits, redacts, and signs your
              PDFs right in the browser — nothing is uploaded, logged, or kept.
            </p>

            <div className="animate-in fade-in zoom-in-95 mx-auto mt-9 max-w-md duration-700">
              <UploadDropzone variant="hero" highlighted />
            </div>

            <p className="text-muted-foreground/70 mt-6 font-mono text-[10.5px] tracking-[0.14em] uppercase">
              {TRUST}
            </p>
          </div>
        </section>

        {/* Three columns — do everything / keep it private / redact for real */}
        <section className="mx-auto max-w-6xl px-4 py-18 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {VALUES.map(({ icon: Icon, title, items }) => (
              <div key={title}>
                <div className="flex items-center gap-2.5">
                  <span className="bg-signal text-signal-foreground grid size-8 place-items-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {items.map((it) => (
                    <li key={it} className="text-muted-foreground flex items-start gap-2.5 text-sm">
                      <Check className="text-signal mt-0.5 size-4 shrink-0" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Showcase — "where does my file go?" with an annotated data flow */}
        <section className="border-y">
          <div className="mx-auto max-w-5xl px-4 py-18 sm:px-6">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="font-sans text-3xl font-extrabold tracking-[-0.02em] text-balance sm:text-[2.6rem] sm:leading-[1.05]">
                So… where does my file <span className="text-signal">actually</span> go?
              </h2>
              <p className="text-muted-foreground mt-4">
                Nowhere. Here&apos;s the entire data flow — notice the part that&apos;s missing.
              </p>
            </div>

            <div className="relative mx-auto mt-12 max-w-2xl">
              <Squiggle className="top-[-2.5rem] right-[8%] w-28 rotate-6 opacity-70" d="M2,60 C40,10 90,90 140,30 S210,10 238,44" />
              <span className="text-muted-foreground/70 decoration-signal absolute -top-9 right-[26%] hidden font-mono text-xs whitespace-nowrap line-through decoration-2 sm:block">
                no server here
              </span>

              <div className="bg-card rounded-2xl border p-6 sm:p-9">
                <div className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">
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
                <ul className="text-muted-foreground mt-7 grid gap-2.5 text-sm sm:grid-cols-2">
                  <li className="flex items-center gap-2.5">
                    <span className="text-destructive font-medium">✗</span> No cloud upload
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-destructive font-medium">✗</span> No tracking or accounts
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-brand-green font-medium">✓</span> Works fully offline
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-brand-green font-medium">✓</span> Close the tab, it&apos;s gone
                  </li>
                </ul>
              </div>
            </div>

            {/* stats strip */}
            <div className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {STATS.map(([n, label]) => (
                <div key={label} className="text-center">
                  <div className="font-sans text-signal text-4xl font-extrabold tracking-tight">
                    {n}
                  </div>
                  <div className="text-muted-foreground mt-1 font-mono text-[11px] tracking-wide uppercase">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA band */}
        <section className="relative overflow-hidden">
          <Squiggle className="top-[20%] left-[10%] w-32 -rotate-6 opacity-60" d="M2,40 C40,6 70,74 108,40 S176,8 238,52" />
          <Squiggle className="right-[10%] bottom-[16%] w-32 rotate-6 opacity-60" d="M2,20 C34,64 82,-8 120,32 S204,72 238,22" />
          <div className="relative mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
            <h2 className="font-sans text-3xl font-extrabold tracking-[-0.02em] text-balance sm:text-[2.75rem] sm:leading-[1.05]">
              Make PDF editing <span className="text-signal">private</span> again.
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-sm">
              Drop a file and start editing in seconds. No sign-up, no catch.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                nativeButton={false}
                className="bg-signal text-signal-foreground hover:bg-signal/90 h-11 rounded-full px-6 text-base font-semibold"
                render={<Link href="/editor" />}
              >
                Open the editor →
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
          <p className="text-sm">
            <span className="font-semibold">{APP_NAME}</span>{" "}
            <span className="text-muted-foreground">— private PDF editing, on your device.</span>
          </p>
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
            © {APP_NAME} · Local-first · Open source
          </p>
        </div>
      </footer>
    </div>
  );
}
