import type { NextConfig } from "next";

// The original portfolio now lives under /original. Everything else on the
// domain is the streamlined portfolio (lassor-streamlined repo), a separate
// static Vercel project, proxied in at the root.
const BASE = "/original";
const STREAMLINED = process.env.STREAMLINED_ORIGIN ?? "https://lassor-focused.vercel.app";
// Project pages the streamlined site has; any other /work/:slug is original.
const STREAMLINED_WORK = "renewables|swiper|gracious";

const nextConfig: NextConfig = {
  basePath: BASE,
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
    return {
      beforeFiles: [],
      afterFiles: [],
      // After the original site's own routes, so nothing under /original is proxied.
      fallback: [
        { source: "/", destination: `${STREAMLINED}/`, basePath: false as const },
        { source: "/:path((?!original(?:/|$)).*)", destination: `${STREAMLINED}/:path`, basePath: false as const },
      ],
    };
  },
  async redirects() {
    const toOriginal = (source: string, destination = `${BASE}${source}`) => ({
      source,
      destination,
      permanent: false,
      basePath: false as const,
    });
    return [
      // Root-relative assets and API calls hard-coded in the original site
      // (scripts, stylesheets, Webflow exports, admin fetches). Temporary
      // redirects keep the method and body, so API POSTs survive.
      ...["js", "css", "webflow", "api"].map((dir) => toOriginal(`/${dir}/:path*`)),
      toOriginal("/:icon(apple-touch-icon\\.png|favicon-16x16\\.png|favicon-32x32\\.png)", `${BASE}/:icon`),
      // Legacy password-reset links land on the homepage with ?code=.
      {
        source: "/",
        has: [{ type: "query" as const, key: "code", value: "(?<code>.+)" }],
        destination: `${BASE}/auth/callback?code=:code&next=/admin/reset-password`,
        permanent: false,
        basePath: false as const,
      },
      toOriginal("/admin"),
      toOriginal("/admin/:path*"),
      toOriginal("/auth/:path*"),
      toOriginal("/work"),
      // The streamlined site's client navigation also fetches /work/<slug>.txt.
      toOriginal(`/work/:slug((?!(?:${STREAMLINED_WORK})(?:\\.txt)?$)[^/]+)`, `${BASE}/work/:slug`),
      toOriginal("/projects/:slug", `${BASE}/work/:slug`),
      toOriginal("/writing"),
      toOriginal("/writing/:path*"),
      toOriginal("/project-types"),
      toOriginal("/project-types/:path*"),
      toOriginal("/faceblind"),
      toOriginal("/origonal", BASE),
      toOriginal("/origonal/:path*", `${BASE}/:path*`),
      // The streamlined site's old home.
      toOriginal("/focused", "/"),
      toOriginal("/focused/:path*", "/:path*"),
    ];
  },
};

export default nextConfig;
