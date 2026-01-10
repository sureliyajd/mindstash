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

export const metadata: Metadata = {
  title: "MindStash - Never lose a thought again",
  description: "Drop thoughts without thinking. AI organizes, you remember.",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-icon.png",
  },
  openGraph: {
    title: "MindStash - Never lose a thought again",
    description: "Drop thoughts without thinking. AI organizes, you remember.",
    images: ["/logo.png"],
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
