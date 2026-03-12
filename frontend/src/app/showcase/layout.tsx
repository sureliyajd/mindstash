import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mindstashhq.space";

export const metadata: Metadata = {
  title: "Showcase",
  description: "See MindStash in action — real examples of how AI organizes your thoughts, tasks, ideas, and more.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/showcase`,
    title: "Showcase | MindStash",
    description: "See MindStash in action — real examples of how AI organizes your thoughts, tasks, ideas, and more.",
    images: [
      {
        url: "/MindStash.png",
        width: 500,
        height: 500,
        alt: "MindStash Showcase",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Showcase | MindStash",
    description: "See MindStash in action — real examples of how AI organizes your thoughts, tasks, ideas, and more.",
    images: ["/MindStash.png"],
  },
};

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
