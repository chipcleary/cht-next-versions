import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readTemplate, replaceHooks } from './processor-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generates the complete shell utilities script
 * @param {Object} config Configuration options
 * @param {Object} config.hooks Optional hooks for customizing shell functions
 * @param {Function} config.hooks.validateEnvironment Additional environment validation
 * @param {Function} config.hooks.beforeDeploy Additional pre-deployment steps
 * @param {Function} config.hooks.afterDeploy Additional post-deployment steps
 * @returns {Promise<string>} Generated shell script content
 */
export const generateShellUtils = async (options = {}) => {
  const { hooks = {}, projectId, version, region, repository } = options;
  const context = { projectId, version, region, repository };

  const hookReplacements = {
    '# [HOOK: validateEnvironment]': hooks.validateEnvironment
      ? await hooks.validateEnvironment(context)
      : '',
    '# [HOOK: beforeDeploy]': hooks.beforeDeploy ? await hooks.beforeDeploy(context) : '',
    '# [HOOK: afterDeploy]': hooks.afterDeploy ? await hooks.afterDeploy(context) : '',
  };

  const templatePath = join(__dirname, '../../templates/cht-utils.sh');
  const template = await readTemplate(templatePath);
  return replaceHooks(template, hookReplacements);
};

/**
 * Writes shell utilities to the workspace
 * @param {string} workspacePath Path to deployment workspace
 * @param {Object} config Configuration options
 * @returns {Promise<void>}
 */
export const writeShellUtils = async (workspacePath, config = {}) => {
  const content = await generateShellUtils(config);
  const utilsPath = join(workspacePath, 'cht-utils.sh');

  try {
    await fs.writeFile(utilsPath, content, { mode: 0o755 });
  } catch (err) {
    throw new Error(`Error writing to file at ${utilsPath}: ${err.message}`);
  }
  return utilsPath;
};
