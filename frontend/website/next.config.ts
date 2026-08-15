import type { NextConfig } from "next";

// Allow Supabase Storage public URLs as Next/Image sources.
// Covers <project-ref>.supabase.co and self-hosted hosts via the deployment env.
const supabaseHost = (() => {
  try {
    return process.env.SUPABASE_URL
      ? new URL(process.env.SUPABASE_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  // Prefer fresh HTML/RSC over CDN caches (catalog updates frequently).
  // Exclude hashed static assets so JS/CSS/images can still be cached.
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico|images/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kawaii.com.bd",
        pathname: "/wp-content/uploads/**",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
