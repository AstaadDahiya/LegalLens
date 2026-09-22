import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development practices
  reactStrictMode: true,

  // Compress responses with gzip for faster delivery
  compress: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Limit API request body size (10 MB)
  serverExternalPackages: ['pdf-parse'],

  // Optimize images if any are added
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Security and performance headers
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
      ],
    },
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'private, no-store, max-age=0',
        },
      ],
    },
  ],
};

export default nextConfig;
