import yaml from 'yaml';
import { join } from 'path';
import { readTemplate } from './processor-utils.js';
import { generateShellUtils } from './shell-utils-generator.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from '../logging/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Validates the required parameters
 * @param {Object} options Processing options
 * @throws {Error} if a required parameter is missing
 */
const validateParameters = (options) => {
  const { version, region, repository } = options;
  if (!version) throw new Error('version is required');
  if (!region) throw new Error('region is required');
  if (!repository) throw new Error('repository is required');
};

/**
 * Processes a cloudbuild.yaml template, injecting hooks and customizing parameters
 * @param {Object} options Processing options
 * @param {Object} options.hooks Hook functions for injecting steps
 * @param {string} options.version Version name for deployment
 * @param {string} options.region GCP region
 * @param {string} options.repository Artifact Registry repository name
 * @param {Object} options.context Additional context passed to hooks
 * @returns {Promise<{cloudbuild: string, shellUtils: string}>} Processed YAML and shell utils content
 */
export default async function processCloudBuildTemplate(options) {
  logger.debug('(processCloudBuildTemplate) Received options:', options);
  const { version, region, repository } = options;

  validateParameters(options);

  const templatePath = join(__dirname, '../../templates/cloudbuild.yaml');
  let content = await readTemplate(templatePath);

  // Update substitutions
  let buildConfig = yaml.parse(content);
  buildConfig.substitutions = {
    _APP_VERSION: version,
    _REGION: region,
    _REPOSITORY: repository,
  };

  const shellUtils = await generateShellUtils(options);
  logger.debug('(processCloudBuildTemplate) Generated shellUtils complete');

  // Use specific YAML formatting options to maintain structure
  const yamlOptions = {
    lineWidth: 0, // Prevent line wrapping
    indent: 2,
  };

  logger.debug(`(processCloudBuildTemplate) Generated cloudbuild:', ${!!buildConfig}
  `);
  logger.debug(`(processCloudBuildTemplate) Generated shellUtils(type): ${typeof shellUtils}`);
  logger.debug(
    '(processCloudBuildTemplate) Generated shellUtils (length):',
    shellUtils?.length || 0
  );
  return {
    cloudbuild: yaml.stringify(buildConfig, yamlOptions),
    shellUtils,
  };
}
