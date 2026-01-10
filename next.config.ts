import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Enable standalone output for Cloud Run deployment
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configure assetPrefix for proper static asset serving
  assetPrefix: process.env.NODE_ENV === 'production' ? '/' : '',
  // Enable CSS modules
  sassOptions: {
    includePaths: ['./src'],
  },
  // Ensure static files are properly exported
  trailingSlash: true,
} as NextConfig;

export default nextConfig;
