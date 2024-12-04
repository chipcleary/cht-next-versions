import yaml from 'yaml';
import { join } from 'path';
import { readTemplate, replaceHooks } from './processor-utils.js';
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
 * @param {Object} options.cloudBuildHooks Hook functions for injecting steps
 * @param {string} options.version Version name for deployment
 * @param {string} options.projectId GCP project ID
 * @param {string} options.region GCP region
 * @param {string} options.repository Artifact Registry repository name
 * @param {Object} options.context Additional context passed to hooks
 * @returns {Promise<{cloudbuild: string}>} Processed YAML and shell utils content
 */
export default async function processCloudBuildTemplate(options) {
  logger.debug('(processCloudBuildTemplate) Received options:', options);
  const { projectId, version, region, repository, cloudBuildHooks = {} } = options;
  const context = { projectId, version, region, repository };

  validateParameters(options);

  const templatePath = join(__dirname, '../../templates/cloudbuild.yaml');
  let content = await readTemplate(templatePath);

  // Hook replacements for cloudbuild.yaml
  const hookReplacements = {
    '# [HOOK: beforeServiceDeploy]': cloudBuildHooks.beforeServiceDeploy
      ? await cloudBuildHooks.beforeServiceDeploy(context)
      : '',
    '# [HOOK: beforeDeploy]': cloudBuildHooks.beforeDeploy
      ? await cloudBuildHooks.beforeDeploy(context)
      : '',
    '# [HOOK: afterDeploy]': cloudBuildHooks.afterDeploy
      ? await cloudBuildHooks.afterDeploy(context)
      : '',
  };

  // Perform replacements on the content string
  content = replaceHooks(content, hookReplacements);

  // Parse the final string back into a YAML object
  let buildConfig = yaml.parse(content);

  // Update substitutions
  buildConfig.substitutions = {
    _APP_VERSION: version,
    _REGION: region,
    _REPOSITORY: repository,
  };

  const yamlOptions = {
    lineWidth: 0, // Prevent line wrapping
    indent: 2,
  };

  logger.debug(`(processCloudBuildTemplate) Generated cloudbuild:', ${!!buildConfig}`);

  return yaml.stringify(buildConfig, yamlOptions);
}
