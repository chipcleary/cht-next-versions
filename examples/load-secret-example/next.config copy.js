/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: '/app',
  },
  reactStrictMode: true,
  swcMinify: true,
  env:
    process.env.NODE_ENV === 'development'
      ? {}
      : {
          NEXT_PUBLIC_HELLO: 'mom',
          APP_VERSION: 'staging',
        },
};

export default nextConfig;
