// import type { NextConfig } from "next";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Bypass Next.js image optimizer to avoid 402 responses
    remotePatterns: [
      // Convex API endpoint
      {
        protocol: "https",
        hostname: "reliable-sturgeon-574.convex.cloud",
        port: "",
        pathname: "/**",
      },
      // Convex File Storage CDN (where uploaded files are actually served from)
      {
        protocol: "https",
        hostname: "*.convex.cloud",
        port: "",
        pathname: "/**",
      },
      // Convex site/functions domain
      {
        protocol: "https",
        hostname: "*.convex.site",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
  env: {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
  // Expose uploaded files from /uploads through a rewrite (NOT for production scale / security hardening)
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/static/uploads/:path*', // placeholder; we can implement a secure file server route later
      },
    ];
  },
};

export default nextConfig;
