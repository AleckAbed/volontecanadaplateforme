import './src/env.mjs';

/** @type {import('next').NextConfig} */

const nextConfig = {
  webpack: (config) => {
    // pdfjs-dist@3.11.174 référence canvas (module natif Node.js) dans son build.
    // On l'ignore côté browser — pdfjs utilise le canvas du DOM à la place.
    config.resolve.alias.canvas = false;
    return config;
  },
  experimental: {
    optimizePackageImports: ['@headlessui/react', 'react-icons', 'recharts', 'motion'],
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/api/portraits/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        pathname: '/redqteam.com/isomorphic-furyroad/public/**',
      },
      {
        protocol: 'https',
        hostname: 'isomorphic-furyroad.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'isomorphic-furyroad.vercel.app',
      },
    ],
  },
  reactStrictMode: true,
  transpilePackages: ['core'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
