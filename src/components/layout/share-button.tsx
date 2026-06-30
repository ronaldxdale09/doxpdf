"use client";

import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const URL = "https://github.com/ronaldxdale09/doxpdf";
const TEXT =
  "DoxPDF — a fast, privacy-first PDF editor that runs entirely in your browser. No account, no uploads, no watermarks.";

const u = encodeURIComponent(URL);
const t = encodeURIComponent(TEXT);

const LINKS = {
  x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
  linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
};

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4">
      {children}
    </svg>
  );
}

/** Social-share dropdown for the landing page (shares the repo). */
export function ShareButton({ className }: { className?: string }) {
  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "DoxPDF", text: TEXT, url: URL });
      } catch {
        // user cancelled — ignore
      }
    } else {
      void copyLink();
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(URL);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Share DoxPDF"
            className={className}
          />
        }
      >
        <Share2 className="size-[1.05rem]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuItem onClick={nativeShare}>
          <Share2 className="size-4" />
          Share…
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<a href={LINKS.x} target="_blank" rel="noopener noreferrer" />}
        >
          <Icon>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </Icon>
          Share on X
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" />
          }
        >
          <Icon>
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </Icon>
          Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a href={LINKS.facebook} target="_blank" rel="noopener noreferrer" />
          }
        >
          <Icon>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </Icon>
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyLink}>
          <Link2 className="size-4" />
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
