/** @type {import('next').NextConfig} */
const nextConfig = {
  "output": "standalone",
  "experimental": {
    "outputFileTracingRoot": "/app"
  },
  "reactStrictMode": true,
  "swcMinify": true,
  "env": {
    "NEXT_PUBLIC_HELLO": "mom",
    "APP_VERSION": "load-secret-example"
  }
};

export default nextConfig;
