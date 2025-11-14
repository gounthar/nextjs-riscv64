/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false, // Disable SWC minifier, use Babel fallback
  experimental: {
    serverActions: {
      enabled: true,
    },
  },
}

module.exports = nextConfig
