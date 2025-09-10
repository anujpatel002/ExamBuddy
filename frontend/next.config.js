/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // 👇 this allows pages with searchParams without suspense (not recommended long-term)
    missingSuspenseWithCSRBailout: true
  }
};

module.exports = nextConfig;