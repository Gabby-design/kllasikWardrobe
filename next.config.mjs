/** @type {import('next').NextConfig} */

// Refuse startup if ADMIN_SESSION_SECRET is missing
if (!process.env.ADMIN_SESSION_SECRET || !process.env.ADMIN_SESSION_SECRET.trim()) {
  throw new Error('FATAL: ADMIN_SESSION_SECRET environment variable is missing. Application refuses to start without it set.');
}

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
