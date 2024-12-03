/** @type {import('next').NextConfig} */
const nextConfig = {
  "output": "standalone",
  "experimental": {
    "outputFileTracingRoot": "/app"
  },
  "reactStrictMode": true,
  "swcMinify": true,
  "env": {
    "APP_CONFIG": "{\n  \"HELLO\": \"world\",\n  \"NEXT_PUBLIC_HELLO\": \"mom\"\n}"
  }
};

export default nextConfig;
