import Link from "next/link";

import { Brand } from "@/components/brand";
import { GitHubStar } from "@/components/layout/github-star";
import { ShareButton } from "@/components/layout/share-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#privacy", label: "Privacy" },
];

/** Top navigation bar for marketing/landing pages. */
export function SiteHeader() {
  return (
    <header className="border-border/70 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />
        <nav className="flex items-center gap-0.5">
          {NAV.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              nativeButton={false}
              className="text-muted-foreground hidden font-mono text-[11px] tracking-wide uppercase sm:inline-flex"
              render={<Link href={item.href} />}
            >
              {item.label}
            </Button>
          ))}
          <span className="bg-border mx-1.5 hidden h-5 w-px sm:block" />
          <GitHubStar className="ml-0.5" />
          <ShareButton />
          <ThemeToggle />
          <Button
            size="sm"
            nativeButton={false}
            className="ml-1"
            render={<Link href="/editor" />}
          >
            Open editor
          </Button>
        </nav>
      </div>
    </header>
  );
}
