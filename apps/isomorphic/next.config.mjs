import './src/env.mjs';

/** @type {import('next').NextConfig} */

const nextConfig = {
  // Dossier de compilation : NEXT_DIST_DIR permet un build de vérification sans toucher au serveur de dev.
  // (next build ajoute alors ce dossier à tsconfig.json : ne pas commiter ce changement.)
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
  poweredByHeader: false,
  // En-têtes de sécurité de toutes les pages. Le visualiseur pdf.js est affiché dans un cadre
  // de la même origine : SAMEORIGIN et frame-ancestors 'self', jamais depuis un autre site.
  async headers() {
    const security = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
    ];
    if (process.env.NODE_ENV === 'production') {
      security.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' });
    }
    return [{ source: '/:path*', headers: security }];
  },
  transpilePackages: ['core'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 2.9b : les erreurs TypeScript bloquent de nouveau la compilation (0 erreur au 18 nov 2026).
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
