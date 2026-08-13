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
        hostname: "frugal-zebra-890.convex.cloud",
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
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  // Add environment variables from .env files
  env: {
    // AWS Configuration
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    // Google Maps API Key
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    // Cognito Configuration
    NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID,
    // Database Configuration - explicitly pass DATABASE_URL to server environment
    DATABASE_URL: process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL,
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
