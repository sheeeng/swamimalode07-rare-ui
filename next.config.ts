import type { NextConfig } from "next";

const PUBLIC_CACHE = [
  {
    key: "Cache-Control",
    value: "public, max-age=345600, stale-while-revalidate=604800",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:dir(componentdemos|logos|assets|fonts)/:path*",
        headers: PUBLIC_CACHE,
      },
      { source: "/ogimage.webp", headers: PUBLIC_CACHE },
    ];
  },
};

export default nextConfig;
