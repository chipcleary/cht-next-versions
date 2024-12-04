import { join } from 'path';
import fs from 'fs/promises';
import { executeGCloudCommand } from './gcloud-utils.js';
import { getComputeServiceAccountEmail } from './name-utils.js';
import processCloudBuildTemplate from '../processors/cloudbuild-processor.js';
import processDockerfileTemplate from '../processors/dockerfile-processor.js';
import processNextConfig from '../processors/next-config-processor.js';
import processShellUtilsTemplate from '../processors/shell-utils-processor.js';
import { logger } from '../logging/logger.js';

/**
 * Creates workspace directory
 * @param {string[]} subdirs - Subdirectories to create
 * @returns {Promise<void>}
 */
export async function createWorkspace(subdirs = []) {
  const baseDirectories = ['public', '.next/standalone', '.next/static', 'workspace'];
  const allDirectories = [...baseDirectories, ...subdirs];

  for (const dir of allDirectories) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Generates necessary deployment files
 * @param {string} version - Version name
 * @param {string} projectId - GCP project ID
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
export async function generateDeploymentFiles(version, projectId, config) {
  logger.debug('(generateDeploymentFiles) called with:', { version, projectId });
  logger.debug('(generateDeploymentFiles) called with config:', config);

  // Process cloudbuild template with hooks
  const cloudbuild = await processCloudBuildTemplate({
    projectId,
    version,
    region: config.region,
    repository: config.repository,
    cloudBuildHooks: config.cloudBuildHooks,
  });
  logger.debug('✓ Generated cloudbuild.yaml');

  // Process shell utilities template with hooks
  const shellUtils = await processShellUtilsTemplate({
    version,
    region: config.region,
    repository: config.repository,
    projectId,
    shellUtilsHooks: config.shellUtilsHooks,
  });
  logger.debug('✓ Generated cht_utils.sh');

  // Process Dockerfile template with hooks
  const dockerfile = await processDockerfileTemplate({
    hooks: config.hooks,
  });
  logger.debug('✓ Generated Dockerfile');

  // Process next config with it's one hook
  const nextConfig = await processNextConfig({
    baseConfig: {
      output: 'standalone',
    },
    configHook: config.nextConfigHooks?.configureNextConfig,
    projectId,
    version,
    region: config.region,
    repository: config.repository,
  });
  logger.debug('✓ Generated next.config.js');

  // Create workspace directory
  await createWorkspace();

  // Write all files
  const files = {
    'cloudbuild.yaml': cloudbuild,
    'cht-utils.sh': shellUtils,
    Dockerfile: dockerfile,
    'next.config.js': nextConfig,
  };

  logger.debug('(generateDeploymentFiles) Writing deployment files:', Object.keys(files));

  await writeDeploymentFiles(files);
  logger.debug('✓ Wrote deployment files\n');
}

/**
 * Writes deployment files to workspace
 * @param {Object} files - Map of filenames to content
 * @returns {Promise<void>}
 */
export async function writeDeploymentFiles(files) {
  for (const [filename, content] of Object.entries(files)) {
    const workspacePath = join('workspace', filename);
    await fs.writeFile(workspacePath, content);
    await fs.copyFile(workspacePath, filename);

    if (filename.endsWith('.sh')) {
      await fs.chmod(filename, 0o755);
    }
  }
}

/**
 * Submits build to Cloud Build
 * @param {Object} config - Configuration object
 * @param {string} config.projectId - GCP project ID
 * @param {string} config.version - Version name
 * @returns {Promise<void>}
 */
export async function submitBuild(projectId, version) {
  try {
    logger.debug('(submitBuild) options:', { projectId, version });
    logger.info('\nStarting deployment...');

    // Get project number to construct service account email
    const projectNumber = await executeGCloudCommand({
      args: ['projects', 'describe', projectId, '--format="value(projectNumber)"'], // Added quotes
      options: { returnOutput: true, silent: true },
    });

    const buildServiceAccount = getComputeServiceAccountEmail(projectNumber);

    await executeGCloudCommand({
      args: [
        'beta',
        'builds',
        'submit',
        '--config=cloudbuild.yaml',
        `--project=${projectId}`,
        `--impersonate-service-account=${buildServiceAccount}`,
      ],
      options: {
        silent: logger.level === 'info' ? true : false,
        returnOutput: false,
      },
    });
  } catch (error) {
    logger.error(`Cloud Build submission failed: ${error.message}`);
    logger.debug('Full error:', error);
    throw error;
  }
}

/**
 * Cleans up workspace directory
 * @returns {Promise<void>}
 */
export async function cleanupWorkspace() {
  /* TODO: DISABLED TEMPORARILY FOR DEBUGGING
  try {
    await fs.rm('workspace', { recursive: true, force: true });
  } catch (error) {
    logger.warn(`Warning: Failed to cleanup workspace: ${error.message}`);
  }
   */
}
