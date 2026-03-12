import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mindstashhq.space";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for MindStash. Start free, upgrade when you're ready.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/pricing`,
    title: "Pricing | MindStash",
    description: "Simple, transparent pricing for MindStash. Start free, upgrade when you're ready.",
    images: [
      {
        url: "/MindStash.png",
        width: 500,
        height: 500,
        alt: "MindStash Pricing",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Pricing | MindStash",
    description: "Simple, transparent pricing for MindStash. Start free, upgrade when you're ready.",
    images: ["/MindStash.png"],
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
