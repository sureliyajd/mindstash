import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

// =============================================================================
// FONT CONFIGURATION
// =============================================================================

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

// =============================================================================
// METADATA
// =============================================================================

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mindstashhq.space";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MindStash - Never lose a thought again",
    template: "%s | MindStash",
  },
  description: "Drop thoughts without thinking. AI organizes, you remember. MindStash is your AI-powered personal knowledge manager.",
  keywords: ["knowledge management", "AI", "notes", "productivity", "mind dump", "second brain"],
  authors: [{ name: "MindStash" }],
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    apple: "/logo.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "MindStash",
    title: "MindStash - Never lose a thought again",
    description: "Drop thoughts without thinking. AI organizes, you remember. MindStash is your AI-powered personal knowledge manager.",
    locale: "en_US",
    images: [
      {
        url: "/MindStash.png",
        width: 500,
        height: 500,
        alt: "MindStash - AI-powered personal knowledge management",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "MindStash - Never lose a thought again",
    description: "Drop thoughts without thinking. AI organizes, you remember.",
    images: ["/MindStash.png"],
  },
};

// =============================================================================
// ROOT LAYOUT
// =============================================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
