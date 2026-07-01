import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** True when the user has asked the OS to minimize non-essential motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
