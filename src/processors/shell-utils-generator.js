/**
 * Generates deployment shell utilities
 */

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Configuration object for shell util functions
 * @typedef {Object} ShellConfig
 * @property {Object} hooks Optional hooks for customizing shell functions
 * @property {Function} hooks.validateEnvironment Additional environment validation
 * @property {Function} hooks.beforeDeploy Additional pre-deployment steps
 * @property {Function} hooks.afterDeploy Additional post-deployment steps
 */

/**
 * Generates the complete shell utilities script
 * @param {ShellConfig} config Configuration options
 * @returns {Promise<string>} Generated shell script content
 */
export async function generateShellUtils(config = {}) {
  // Read the base shell utils template
  const templatePath = join(__dirname, '../../templates/cht-utils.sh');
  let content = await fs.readFile(templatePath, 'utf8');

  // Insert any additional validation from hooks
  if (config.hooks?.validateEnvironment) {
    content = content.replace(
      '# [HOOK: validateEnvironment]',
      config.hooks.validateEnvironment()
    );
  }

  // Add any pre-deployment steps
  if (config.hooks?.beforeDeploy) {
    content = content.replace(
      '# [HOOK: beforeDeploy]',
      config.hooks.beforeDeploy()
    );
  }

  // Add any post-deployment steps
  if (config.hooks?.afterDeploy) {
    content = content.replace(
      '# [HOOK: afterDeploy]',
      config.hooks.afterDeploy()
    );
  }

  return content;
}

/**
 * Writes shell utilities to the workspace
 * @param {string} workspacePath Path to deployment workspace
 * @param {ShellConfig} config Configuration options
 * @returns {Promise<void>}
 */
export async function writeShellUtils(workspacePath, config = {}) {
  const content = await generateShellUtils(config);
  const utilsPath = path.join(workspacePath, 'cht-utils.sh');

  await fs.writeFile(utilsPath, content, { mode: 0o755 }); // Make executable
  return utilsPath;
}

