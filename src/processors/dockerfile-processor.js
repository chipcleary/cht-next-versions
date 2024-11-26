import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Docker build hooks interface
 * @typedef {Object} DockerHooks
 * @property {string[]} [additionalStages] Additional build stages to add at start
 * @property {string[]} [afterDeps] Commands to run after deps stage
 * @property {string[]} [beforeBuild] Commands to run before build
 * @property {string[]} [additionalBuildArgs] Additional build arguments
 * @property {string[]} [additionalEnv] Additional environment variables
 * @property {string[]} [beforeCopy] Commands to run before copy
 * @property {string[]} [additionalCopy] Additional files to copy
 */

/**
 * Processes Dockerfile template, injecting hooks
 * @param {Object} options Processing options
 * @param {DockerHooks} [options.hooks] Hook functions for injecting Dockerfile instructions
 * @returns {Promise<string>} Processed Dockerfile content
 */
export default async function processDockerfileTemplate(options = {}) {
  const { hooks = {} } = options;

  // Read template
  const templatePath = join(__dirname, '../../templates/Dockerfile');
  let content = await fs.readFile(templatePath, 'utf8');

  // Replace hook points with actual content
  const hookReplacements = {
    '# [HOOK: additionalStages]': hooks.additionalStages?.join('\n') || '',
    '# [HOOK: afterDeps]': hooks.afterDeps?.join('\n') || '',
    '# [HOOK: beforeBuild]': hooks.beforeBuild?.join('\n') || '',
    '# [HOOK: additionalBuildArgs]': hooks.additionalBuildArgs?.join('\n') || '',
    '# [HOOK: additionalEnv]': hooks.additionalEnv?.join('\n') || '',
    '# [HOOK: beforeCopy]': hooks.beforeCopy?.join('\n') || '',
    '# [HOOK: additionalCopy]': hooks.additionalCopy?.join('\n') || '',
  };

  // Replace each hook point
  for (const [hookPoint, replacement] of Object.entries(hookReplacements)) {
    content = content.replace(hookPoint, replacement);
  }

  return content;
}
