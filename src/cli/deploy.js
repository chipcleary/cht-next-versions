import { loadConfig } from './config.js';
import {
  validateGCloudPermissions,
  generateDeploymentFiles,
  getCloudRunServiceName,
  getDeployedServiceUrl,
  grantPublicAccess,
  executeGCloudCommand,
  submitBuild,
  cleanupWorkspace,
} from '@cht/next-versions';
import fs from 'fs/promises';
import { logger } from '@cht/next-versions';

async function ensureDirectories() {
  logger.debug('(ensureDirectories): ensure required directories exist');
  const dirs = ['public', '.next/standalone', '.next/static', 'workspace'];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Deploy a version of the application
 * @param {string} version Version name to deploy
 */
export async function deploy(version, options = {}) {
  if (!version) {
    throw new Error(
      'Version argument is required\nUsage: deploy <version>\nExample: deploy staging'
    );
  }

  // Set log level if provided in options
  if (options.logLevel) {
    logger.level = options.logLevel;
  }

  try {
    logger.info(`Deploying version: ${version}`);

    // Load configuration
    const config = await loadConfig();

    // Get project ID from gcloud
    const projectId = await executeGCloudCommand({
      args: ['config', 'get-value', 'project'],
      options: {
        silent: true,
        returnOutput: true,
      },
    });

    if (!projectId) {
      throw new Error(
        'No Google Cloud project configured. Run: gcloud config set project YOUR_PROJECT_ID'
      );
    }

    // Create required directories
    await ensureDirectories();

    // Setup Google Cloud (IAM, etc.)
    await validateGCloudPermissions(projectId);

    // Generate deployment files
    await generateDeploymentFiles(version, projectId, config);

    // Run deployment
    logger.info('Starting deployment...');
    try {
      await submitBuild(projectId, version);
      logger.verbose('Build submitted successfully');
    } catch (err) {
      // If the build actually failed, throw
      if (!err.message.includes('trim')) {
        throw err;
      }
      // If it's just the trim error, ignore it
      logger.verbose('Build completed');
    }

    // Post-deployment setup
    await grantPublicAccess({
      projectId,
      version,
      region: config.region,
    });

    cleanupWorkspace();

    // Run post-deploy hook if configured
    const serviceName = getCloudRunServiceName({ projectId, version });
    const url = await getDeployedServiceUrl({
      serviceName,
      region: config.region,
      projectId,
    });

    if (config.hooks?.postDeploy) {
      logger.info('\nRunning post-deploy hook...');
      await config.hooks.postDeploy(version, url);
    }

    logger.info(`\nDeployment complete!`);
    logger.info(`Service URL: ${url}`);
  } catch (error) {
    logger.error(`Deployment failed: ${error.message}`);
    logger.debug('Full error:', error);
    process.exit(1);
  }
}
