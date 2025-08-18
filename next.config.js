/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisations de base
  reactStrictMode: false, // Désactivé en dev pour réduire les recompilations
  swcMinify: process.env.NODE_ENV === 'production',

  // Images optimisées
  images: {
    domains: ['images.unsplash.com', 'ui-avatars.com', 'res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Variables d'environnement
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
  },

  // Configuration pour App Router
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },

  // Optimisations de bundle
  webpack: (config, { isServer }) => {
    // Configuration des alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value:
              process.env.NODE_ENV === 'production'
                ? process.env.ALLOWED_ORIGINS || 'https://votre-domaine.com'
                : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
