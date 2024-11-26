/**
 * Creates a Next.js configuration with Cloud Run compatibility
 * @param {Object} options Configuration options
 * @param {Object} [options.baseConfig={}] Base Next.js configuration to extend
 * @param {Function} [options.configHook] Hook for modifying final configuration
 * @returns {string} Next.js configuration content
 */
export default function processNextConfig(options = {}) {
  const { baseConfig = {}, configHook } = options;

  // Start with required Cloud Run settings
  let config = {
    ...baseConfig,
    output: 'standalone',
    experimental: {
      ...baseConfig.experimental,
      // Use Docker container path instead of local path
      outputFileTracingRoot: '/app'
    },
    // Ensure these settings for Cloud Run
    reactStrictMode: true,
    swcMinify: true
  };

  // Force standalone output
  config.output = 'standalone';

  // Allow hook to modify config but preserve critical settings
  if (configHook) {
    const hookConfig = configHook(config);
    config = {
      ...hookConfig,
      output: 'standalone' // Always force standalone
    };
  }

  // Generate the configuration file content
  const content = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Cloud Run deployment
  experimental: {
    outputFileTracingRoot: '/app' // Docker container path
  },
  reactStrictMode: ${config.reactStrictMode},
  swcMinify: ${config.swcMinify}
};

export default nextConfig;
`;

  return content;
}
