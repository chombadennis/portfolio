/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,

  // Conditionally set the assetPrefix only in production from an environment variable
  assetPrefix: isProd ? process.env.NEXT_PUBLIC_ASSET_PREFIX : undefined,

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
};

export default nextConfig;
