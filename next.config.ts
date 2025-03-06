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
}

export default nextConfig
