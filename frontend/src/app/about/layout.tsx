import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mindstashhq.space";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about MindStash — the AI-powered tool that helps you capture, organize, and resurface your best thoughts.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/about`,
    title: "About | MindStash",
    description: "Learn about MindStash — the AI-powered tool that helps you capture, organize, and resurface your best thoughts.",
    images: [
      {
        url: "/MindStash.png",
        width: 500,
        height: 500,
        alt: "About MindStash",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "About | MindStash",
    description: "Learn about MindStash — the AI-powered tool that helps you capture, organize, and resurface your best thoughts.",
    images: ["/MindStash.png"],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
