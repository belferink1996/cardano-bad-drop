/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['badfoxmc.com'],
  },
  async rewrites() {
    return [
      {
        source: '/main-api/:path*',
        destination: 'https://badfoxmc.com/api/:path*',
      },
    ]
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
