import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  serverExternalPackages: ['node-appwrite'],
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  // Tell Next.js to output a full server build rather than static
  output: 'standalone',
  // Add crossOrigin setting to prevent CORS issues
  crossOrigin: 'anonymous',
}
export default nextConfig
