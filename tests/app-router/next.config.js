/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false, // Disable SWC minifier, use Babel fallback
  // Server Actions not stable in Next.js 13.5.6
}

module.exports = nextConfig
