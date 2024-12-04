import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readTemplate, replaceHooks } from './processor-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Processes a cht_utils.sh template, injecting hooks and customizing parameters
 * @param {Object} options Processing options
 * @param {Object} options.shellUtilsHooks Hook functions for injecting steps
 * @param {string} options.version Version name for deployment
 * @param {string} options.region GCP region
 * @param {string} options.repository Artifact Registry repository name
 * @param {Object} options.context Additional context passed to hooks
 * @returns {Promise<string>} Generated shell script content
 */

const processShellUtilsTemplate = async (options = {}) => {
  const { shellUtilsHooks = {}, projectId, version, region, repository } = options;
  const context = { projectId, version, region, repository };

  const hookReplacements = {
    '# [HOOK: validateEnvironment]': shellUtilsHooks.validateEnvironment
      ? await shellUtilsHooks.validateEnvironment(context)
      : '',
    '# [HOOK: beforeDeploy]': shellUtilsHooks.beforeDeploy ? await hooks.beforeDeploy(context) : '',
    '# [HOOK: afterDeploy]': shellUtilsHooks.afterDeploy ? await hooks.afterDeploy(context) : '',
  };

  const templatePath = join(__dirname, '../../templates/cht-utils.sh');
  const template = await readTemplate(templatePath);
  const shellUtils = replaceHooks(template, hookReplacements);

  logger.debug(`(processCloudBuildTemplate) Generated shellUtils(type): ${typeof shellUtils}`);
  logger.debug(
    '(processCloudBuildTemplate) Generated shellUtils (length):',
    shellUtils?.length || 0
  );

  return shellUtils;
};

/**
 * Writes shell utilities to the workspace
 * @param {string} workspacePath Path to deployment workspace
 * @param {Object} config Configuration options
 * @returns {Promise<void>}
 */
/* DEPRECATED
export const writeShellUtils = async (workspacePath, config = {}) => {
  const content = await processShellUtilsTemplate(config);
  const utilsPath = join(workspacePath, 'cht-utils.sh');

  try {
    await fs.writeFile(utilsPath, content, { mode: 0o755 });
  } catch (err) {
    throw new Error(`Error writing to file at ${utilsPath}: ${err.message}`);
  }
  return utilsPath;
};
*/

export default processShellUtilsTemplate;
