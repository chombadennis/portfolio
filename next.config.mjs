/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },

  experimental: {
    serverComponentsExternalPackages: [
      "@react-email/components",
      "@react-email/render"
    ],
  },

  async rewrites() {
    return [
      {
        source: '/nesh',
        destination: '/auth',
      },
    ]
  },

  async redirects() {
    return [
      {
        source: '/auth',
        destination: '/404',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
