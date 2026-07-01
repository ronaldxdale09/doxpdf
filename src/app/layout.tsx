import type { Metadata, Viewport } from "next";
import {
  Caveat,
  Dancing_Script,
  Geist_Mono,
  Great_Vibes,
  Hanken_Grotesk,
  Newsreader,
} from "next/font/google";

import { Providers } from "@/components/providers";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/constants";

import "./globals.css";

// Body & UI face — a warm humanist grotesque (the "Claude" voice): clean,
// approachable, human-centered. Carries all interface text and the wordmark.
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face — an editorial serif (the "Anthropic" voice): used for
// headlines and pull quotes, with true italics, to feel considered and human.
const newsreader = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

// Handwriting faces for typed signatures.
const dancingScript = Dancing_Script({
  variable: "--font-sign-1",
  subsets: ["latin"],
  weight: ["600"],
});
const caveat = Caveat({
  variable: "--font-sign-2",
  subsets: ["latin"],
  weight: ["600"],
});
const greatVibes = Great_Vibes({
  variable: "--font-sign-3",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "PDF editor",
    "edit PDF",
    "free PDF editor",
    "online PDF",
    "sign PDF",
    "annotate PDF",
    "privacy",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F3EE" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1714" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${hankenGrotesk.variable} ${geistMono.variable} ${newsreader.variable} ${dancingScript.variable} ${caveat.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
