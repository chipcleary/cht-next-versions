import {
  getProjectNumber,
  setIamPolicyBinding,
  executeGCloudCommand,
  waitForResourceReady,
} from './gcloud-utils.js';
import { getComputeServiceAccountEmail } from './name-utils.js';
import { logger } from '../logging/logger.js';
/**
 * Sets up Secret Manager for the project
 * @param {string} projectId - GCP project ID
 * @returns {Promise<void>}
 */
export async function setupSecretManager(projectId) {
  try {
    // Enable Secret Manager API
    await executeGCloudCommand({
      args: ['services', 'enable', 'secretmanager.googleapis.com', `--project=${projectId}`],
    });

    // Get project number and set up service account
    const projectNumber = await getProjectNumber(projectId);
    const buildServiceAccount = getComputeServiceAccountEmail(projectNumber);

    // Grant Secret Manager access using setIamPolicyBinding
    await setIamPolicyBinding({
      projectId,
      member: `serviceAccount:${buildServiceAccount}`,
      role: 'roles/secretmanager.secretAccessor',
    });

    logger.info('✓ Secret Manager setup complete');
  } catch (error) {
    logger.error(`Secret Manager setup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Gets secret name for a version
 * @param {string} version - Deployment version
 * @returns {string} Secret name
 */
export function getSecretName(version) {
  return `APP_CONFIG_${version.toUpperCase()}`;
}

/**
 * Validates secret JSON format
 * @param {string} secretValue - Secret value to validate
 * @returns {Object} Parsed secret value
 * @throws {Error} If secret is invalid JSON
 */
export function validateSecretFormat(secretValue) {
  try {
    return JSON.parse(secretValue);
  } catch (error) {
    throw new Error(`Invalid secret format: must be valid JSON\n${error.message}`);
  }
}

/**
 * Gets and validates a secret's value
 * @param {Object} config - Configuration object
 * @param {string} config.projectId - GCP project ID
 * @param {string} config.version - Deployment version
 * @returns {Promise<Object>} Parsed secret value
 */
export async function getSecretConfig({ projectId, version }) {
  const secretName = getSecretName(version);
  logger.debug(`(getSecretConfig): Attempting to access secret ${secretName}`);

  try {
    // Wait for secret to be accessible
    await waitForResourceReady({
      type: 'secret',
      name: secretName,
      params: { project: projectId },
    });

    const secretValue = await executeGCloudCommand({
      args: [
        'secrets',
        'versions',
        'access',
        'latest',
        `--secret=${secretName}`,
        `--project=${projectId}`,
      ],
      options: {
        silent: true,
        returnOutput: true,
      },
    });

    logger.debug('(getSecretConfig): Successfully accessed secret');
    return validateSecretFormat(secretValue);
  } catch (error) {
    logger.error(`(getSecretConfig): Error accessing secret: ${error.message}`);
    if (error.message.includes('NOT_FOUND')) {
      throw new Error(
        `Secret ${secretName} not found. Create it with:\n` +
          `gcloud secrets create ${secretName} --replication-policy="automatic"\n` +
          `echo '{your-config-json}' | gcloud secrets versions add ${secretName} --data-file=-`
      );
    }
    throw error;
  }
}
