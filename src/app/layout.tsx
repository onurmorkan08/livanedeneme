import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import { SiteShell } from "@/components/site-shell";

const bodyFont = localFont({
  src: "./fonts/Bahnschrift.ttf",
  variable: "--font-body",
});

const displayFont = localFont({
  src: "./fonts/Baskerville.ttf",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "LIVANE | Premium Restoration & Renovation Services",
    template: "%s | LIVANE",
  },
  description:
    "Premium restoration, floor polishing, renovation support, and exterior surface care for the Miami and Fort Lauderdale area.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
