"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

/** Composes every client-side provider into a single tree for the root layout. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <TooltipProvider delay={250}>
          {children}
          <Toaster richColors position="bottom-right" />
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
