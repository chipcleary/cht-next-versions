import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readTemplate } from './processor-utils.js';
import { logger } from '../logging/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Creates a Next.js configuration with Cloud Run compatibility
 * @param {Object} options Configuration options
 * @param {Object} [options.baseConfig={}] Base Next.js configuration to extend
 * @param {Function} [options.configHook] Hook for modifying final configuration
 * @returns {Promise<string>} Processed Next.js configuration content
 */
export default async function processNextConfig(options = {}) {
  logger.debug('(processNextConfig) Received options:', options);
  const { configHook, projectId, version, region, repository } = options;
  const context = { projectId, version, region, repository };

  const templatePath = join(__dirname, '../../templates/next.config.js');
  let content = await readTemplate(templatePath);

  if (configHook) {
    // Extract config object from template content
    const configMatch = content.match(/const nextConfig = ({[\s\S]*?});/);
    if (!configMatch) {
      throw new Error('Could not parse config from template');
    }
    let config = eval('(' + configMatch[1] + ')');

    logger.debug('(processNextConfig) Executing configHook');
    const hookConfig = await configHook(config, context);

    // Replace config in template
    content = content.replace(
      /const nextConfig = {[\s\S]*?};/,
      `const nextConfig = ${JSON.stringify(hookConfig, null, 2)};`
    );
  }

  logger.debug('(processNextConfig) Returned nextConfig.js:', content);
  return content;
}
