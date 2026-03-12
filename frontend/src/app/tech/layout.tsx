import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mindstashhq.space";

export const metadata: Metadata = {
  title: "Tech Stack",
  description: "Explore the technology behind MindStash — built with Next.js, FastAPI, PostgreSQL, and Claude AI.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/tech`,
    title: "Tech Stack | MindStash",
    description: "Explore the technology behind MindStash — built with Next.js, FastAPI, PostgreSQL, and Claude AI.",
    images: [
      {
        url: "/MindStash.png",
        width: 500,
        height: 500,
        alt: "MindStash Tech Stack",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Tech Stack | MindStash",
    description: "Explore the technology behind MindStash — built with Next.js, FastAPI, PostgreSQL, and Claude AI.",
    images: ["/MindStash.png"],
  },
};

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return children;
}
