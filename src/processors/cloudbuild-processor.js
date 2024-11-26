import yaml from 'yaml';
import fs from 'fs/promises';
import { generateShellUtils } from './shell-utils-generator.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  const {
    hooks = {},
    version,
    region,
    repository,
    context = {}
  } = options;

  // Validate required parameters
  if (!version) throw new Error('version is required');
  if (!region) throw new Error('region is required');
  if (!repository) throw new Error('repository is required');

  // Read cloudbuild template
  const templatePath = join(__dirname, '../../templates/cloudbuild.yaml');
  const templateContent = await fs.readFile(templatePath, 'utf8');
  let buildConfig = yaml.parse(templateContent);

  // Update substitutions
  buildConfig.substitutions = {
    _APP_VERSION: version,
    _REGION: region,
    _REPOSITORY: repository
  };

  // Generate shell utilities
  const shellUtils = await generateShellUtils({
    hooks: {
      validateEnvironment: hooks.validateEnvironment,
      beforeDeploy: hooks.beforeDeploy,
      afterDeploy: hooks.afterDeploy
    }
  });

  // Use specific YAML formatting options to maintain structure
  const yamlOptions = {
    lineWidth: 0,  // Prevent line wrapping
    indent: 2
  };

  return {
    cloudbuild: yaml.stringify(buildConfig, yamlOptions),
    shellUtils
  };
}
