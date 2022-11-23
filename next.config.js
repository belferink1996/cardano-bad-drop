/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  api: {
    responseLimit: false,
  },
  images: {
    domains: ['badfoxmc.com'],
  },
  webpack: function (config, options) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    }
    return config
  },
}

module.exports = nextConfig
