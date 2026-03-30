import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/notifications/email-action",
        destination: `${apiUrl}/api/notifications/email-action`,
      },
    ];
  },
};

export default nextConfig;
