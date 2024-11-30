/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Cloud Run deployment
  experimental: {
    outputFileTracingRoot: '/app', // Docker container path
  },
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
