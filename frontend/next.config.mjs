/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  env: {
    API_URL: 'https://cafe-api-f9re.onrender.com',
  },
  images: {
    domains: ['cafe-api-f9re.onrender.com'],
    unoptimized: true
  },
};

export default nextConfig;