/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    // These must be explicitly set
    NEXT_PUBLIC_APP_ENV: process.env.APP_ENV,
    NEXT_PUBLIC_API_URL: process.env.API_URL,
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'production') {
      if (!process.env.API_URL) {
        throw new Error('Environment variable API_URL is required but not set in development mode.');
      }
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.API_URL}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

// Validate required environment variables
if (!process.env.APP_ENV) {
  throw new Error('Environment variable APP_ENV is required but not set.');
}
if (!process.env.API_URL) {
  throw new Error('Environment variable API_URL is required but not set.');
}

module.exports = nextConfig;
