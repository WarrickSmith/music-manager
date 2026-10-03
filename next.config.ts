import type { NextConfig } from 'next'
/**
 * Headers sent with every response. They stop the app being framed by other
 * sites, stop browsers guessing file types, and limit what a page may do with
 * forms and plugins. A full Content-Security-Policy for scripts is not set
 * because Next.js needs inline scripts to hydrate pages.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    key: 'Content-Security-Policy',
    value:
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
      ]
    : []),
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  images: {
    // Set unoptimized to true in all environments since you're not concerned about image optimization
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['node-appwrite'],
  // Tell Next.js to output a full server build rather than static
  output: 'standalone',
  // Add crossOrigin setting to prevent CORS issues
  crossOrigin: 'anonymous',
}
export default nextConfig
