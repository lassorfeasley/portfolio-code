import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async rewrites() {
    // The streamlined portfolio (lassor-streamlined repo) is a separate static
    // Vercel project built with basePath "/focused".
    return [
      { source: "/focused", destination: "https://lassor-focused.vercel.app/" },
      { source: "/focused/:path*", destination: "https://lassor-focused.vercel.app/:path*" },
    ];
  },
  async redirects() {
    return [
      { source: "/projects/:slug", destination: "/work/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
