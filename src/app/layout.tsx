import type { Metadata, Viewport } from "next";
import {
  Caveat,
  Dancing_Script,
  Geist,
  Geist_Mono,
  Great_Vibes,
  Space_Grotesk,
} from "next/font/google";

import { Providers } from "@/components/providers";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/constants";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face — technical, characterful, used with restraint for headings.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
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
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${dancingScript.variable} ${caveat.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
